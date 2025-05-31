"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Search, Loader2 } from "lucide-react"
import { LanguageSelector } from "@/components/language-selector"
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

interface VoiceResult {
  transcript: string
  intent: {
    job_role: string
    location: string
    original_text: string
  }
  jobs: Job[]
  audio_url?: string
}

export default function VocaworkApp() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState("en")
  const [searchQuery, setSearchQuery] = useState("")
  const [jobs, setJobs] = useState<Job[]>([])
  const [voiceResult, setVoiceResult] = useState<VoiceResult | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)

  const API_BASE =
    process.env.NODE_ENV === "production" ? "https://your-backend-url.com/api" : "http://localhost:5000/api"

  // Load jobs on component mount
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

  const startRecording = async () => {
    try {
      setError("")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        processAudio()
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      setError("Failed to access microphone. Please allow microphone access.")
      console.error("Error starting recording:", err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async () => {
    try {
      setIsProcessing(true)
      setError("")

      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

      const formData = new FormData()
      formData.append("audio", audioBlob, "recording.webm")
      formData.append("language", selectedLanguage)

      const response = await fetch(`${API_BASE}/process-voice`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result: VoiceResult = await response.json()
        setVoiceResult(result)
        setJobs(result.jobs)

        // Play audio response if available
        if (result.audio_url && audioRef.current) {
          audioRef.current.src = `${API_BASE.replace("/api", "")}${result.audio_url}`
          audioRef.current.play().catch(console.error)
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to process voice")
      }
    } catch (err) {
      setError("Failed to process voice recording")
      console.error("Error processing audio:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextSearch = async () => {
    if (!searchQuery.trim()) {
      loadJobs()
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE}/jobs?query=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const jobsData = await response.json()
        setJobs(jobsData)
      } else {
        setError("Failed to search jobs")
      }
    } catch (err) {
      setError("Failed to search jobs")
      console.error("Error searching jobs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTextSearch()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎯 Vocawork</h1>
          <p className="text-lg text-gray-600 mb-4">Voice-powered job search for everyone</p>
          <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />
        </div>

        {/* Voice Recording Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Job Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                size="lg"
                className={`w-32 h-32 rounded-full ${
                  isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>

              <p className="text-center text-gray-600">
                {isProcessing
                  ? "Processing your voice..."
                  : isRecording
                    ? "Recording... Click to stop"
                    : "Click to start voice search"}
              </p>

              {voiceResult && (
                <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">You said:</p>
                  <p className="font-medium">{voiceResult.transcript}</p>
                  {voiceResult.intent.job_role && (
                    <div className="mt-2">
                      <Badge variant="secondary">Role: {voiceResult.intent.job_role}</Badge>
                      {voiceResult.intent.location && (
                        <Badge variant="outline" className="ml-2">
                          Location: {voiceResult.intent.location}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Text Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Text Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search for jobs (e.g., software developer, data analyst)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleTextSearch} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Jobs Results */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {voiceResult ? `Found ${jobs.length} jobs for you` : "Available Jobs"}
            </h2>
            <Badge variant="outline">{jobs.length} jobs</Badge>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">No jobs found. Try a different search.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Audio element for TTS playback */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  )
}
