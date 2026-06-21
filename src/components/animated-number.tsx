"use client"

import { useEffect, useState } from "react"

interface AnimatedNumberProps {
  value: number
  prefix?: string
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, prefix = "", duration = 1000, className = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    const startValue = 0

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      // Easing function: easeOutExpo
      const easing = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      
      const currentCount = startValue + (value - startValue) * easing
      setDisplayValue(currentCount)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span className={className} suppressHydrationWarning>
      {prefix} {displayValue.toLocaleString("es-AR", { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
      })}
    </span>
  )
}
