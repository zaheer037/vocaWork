import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home, Settings } from "lucide-react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Vocawork - Voice-Powered Job Search",
  description: "Find jobs using your voice in multiple Indian languages",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                🎯 Vocawork
              </Link>
              <div className="flex gap-2">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Jobs
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  )
}
