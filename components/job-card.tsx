"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Building, Phone, Calendar } from "lucide-react"

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

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Recently posted"
    }
  }

  const handleContact = () => {
    if (job.contact.startsWith("+") || job.contact.startsWith("0")) {
      window.open(`tel:${job.contact}`, "_blank")
    } else {
      window.open(`mailto:${job.contact}`, "_blank")
    }
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">{job.title}</CardTitle>
        <div className="flex items-center gap-2 text-gray-600">
          <Building className="h-4 w-4" />
          <span className="text-sm">{job.company}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{job.location}</span>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-green-800 font-semibold text-sm">💰 {job.salary}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Skills Required</p>
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 4).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {formatDate(job.posted_date)}
          </div>

          <Button onClick={handleContact} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Phone className="h-3 w-3 mr-1" />
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
