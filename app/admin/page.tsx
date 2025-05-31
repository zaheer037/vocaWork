"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Building, Trash2, Loader2, CheckCircle } from "lucide-react"
import { JobCard } from "@/components/job-card"

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  skills: string[]
  contact: string
  description: string
  posted_date: string
}

interface JobFormData {
  title: string
  company: string
  location: string
  salary: string
  skills: string
  contact: string
  description: string
}

export default function AdminPanel() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState<JobFormData>({
    title: "",
    company: "",
    location: "",
    salary: "",
    skills: "",
    contact: "",
    description: "",
  })

  const API_BASE =
    process.env.NODE_ENV === "production" ? "https://your-backend-url.com/api" : "http://localhost:5000/api"

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/jobs`)
      if (response.ok) {
        const jobsData = await response.json()
        setJobs(jobsData)
      } else {
        setError("Failed to load jobs")
      }
    } catch (err) {
      setError("Failed to connect to server")
      console.error("Error loading jobs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof JobFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
    setSuccess("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const requiredFields: (keyof JobFormData)[] = ["title", "company", "location", "salary", "contact", "description"]
    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        setError(`Please fill in the ${field} field`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      setError("")

      const jobData = {
        ...formData,
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill),
      }

      const response = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess("Job posted successfully!")
        setFormData({
          title: "",
          company: "",
          location: "",
          salary: "",
          skills: "",
          contact: "",
          description: "",
        })
        loadJobs() // Reload jobs list
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to post job")
      }
    } catch (err) {
      setError("Failed to post job")
      console.error("Error posting job:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this job?")) {
      return
    }

    try {
      const response = await fetch(`${API_BASE}/jobs/${jobId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Job deleted successfully!")
        loadJobs() // Reload jobs list
      } else {
        setError("Failed to delete job")
      }
    } catch (err) {
      setError("Failed to delete job")
      console.error("Error deleting job:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">👨‍💼 Vocawork Admin</h1>
          <p className="text-lg text-gray-600">Post and manage job opportunities</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Job Posting Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Post New Job
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <Input
                    placeholder="e.g., Software Developer"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <Input
                    placeholder="e.g., TechSolutions India"
                    value={formData.company}
                    onChange={(e) => handleInputChange("company", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <Input
                    placeholder="e.g., Bangalore, Mumbai, Delhi"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range *</label>
                  <Input
                    placeholder="e.g., ₹50,000 - ₹80,000 per month"
                    value={formData.salary}
                    onChange={(e) => handleInputChange("salary", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills Required</label>
                  <Input
                    placeholder="e.g., JavaScript, React, Node.js (comma separated)"
                    value={formData.skills}
                    onChange={(e) => handleInputChange("skills", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Information *</label>
                  <Input
                    placeholder="e.g., +91 9876543210 or hr@company.com"
                    value={formData.contact}
                    onChange={(e) => handleInputChange("contact", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                  <Textarea
                    placeholder="Describe the job role, responsibilities, and requirements..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-green-600 text-sm">{success}</p>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Posting Job...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Post Job
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Jobs Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Manage Jobs
                <Badge variant="outline">{jobs.length} jobs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : jobs.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">
                            {job.company} • {job.location}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDeleteJob(job.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{job.salary}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{job.description}</p>
                      {job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No jobs posted yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        {jobs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Listings Preview</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.slice(0, 6).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
