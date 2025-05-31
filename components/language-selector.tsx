"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"

interface LanguageSelectorProps {
  selectedLanguage: string
  onLanguageChange: (language: string) => void
}

const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
]

export function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
  const selectedLang = languages.find((lang) => lang.code === selectedLanguage)

  return (
    <div className="flex items-center gap-2 justify-center">
      <Globe className="h-4 w-4 text-gray-600" />
      <Select value={selectedLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-48">
          <SelectValue>
            {selectedLang ? `${selectedLang.native} (${selectedLang.name})` : "Select Language"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <span className="flex items-center gap-2">
                <span>{language.native}</span>
                <span className="text-gray-500">({language.name})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
