"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"

interface ThemeSyncProps {
  savedTheme: string
}

export function ThemeSync({ savedTheme }: ThemeSyncProps) {
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    if (savedTheme && theme !== savedTheme) {
      setTheme(savedTheme)
    }
  }, [savedTheme, theme, setTheme])

  return null
}
