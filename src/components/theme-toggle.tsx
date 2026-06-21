"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateUserTheme } from "@/app/actions/user"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme
  const isDark = currentTheme === "dark"

  const toggleTheme = async () => {
    const newTheme = isDark ? "light" : "dark"
    setTheme(newTheme)
    
    // Save theme to user profile in database
    try {
      await updateUserTheme(newTheme)
    } catch (err) {
      console.error("Failed to save theme preference in database:", err)
    }
  }

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="rounded-full w-9 h-9 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label="Cambiar tema"
      >
        {isDark ? (
          <Sun className="h-[1.2rem] w-[1.2rem] text-amber-500 transition-all rotate-0 scale-100" />
        ) : (
          <Moon className="h-[1.2rem] w-[1.2rem] text-zinc-700 transition-all rotate-0 scale-100" />
        )}
      </Button>
      
      {/* Hover tooltip for desktop only */}
      <div className="absolute top-full right-0 mt-2 hidden md:group-hover:block z-50 bg-zinc-905 bg-zinc-900 text-zinc-100 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-zinc-800 whitespace-nowrap shadow-xl pointer-events-none select-none transition-all duration-200">
        {isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      </div>
    </div>
  )
}
