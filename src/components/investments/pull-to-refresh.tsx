"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowDown } from "lucide-react"
import { triggerHaptic } from "@/lib/haptics"

interface PullToRefreshProps {
    children: React.ReactNode
}

const PULL_THRESHOLD = 65

export function PullToRefresh({ children }: PullToRefreshProps) {
    const router = useRouter()
    const [pullDistance, setPullDistance] = React.useState(0)
    const [isRefreshing, setIsRefreshing] = React.useState(false)
    const touchStartY = React.useRef(0)
    const isPulling = React.useRef(false)

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0 && !isRefreshing) {
            touchStartY.current = e.touches[0].clientY
            isPulling.current = true
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPulling.current || isRefreshing || window.scrollY > 0) return

        const currentY = e.touches[0].clientY
        const diff = currentY - touchStartY.current

        if (diff > 0) {
            // Apply elastic drag resistance
            const distance = Math.min(diff * 0.4, 90)
            setPullDistance(distance)
        } else {
            setPullDistance(0)
            isPulling.current = false
        }
    }

    const handleTouchEnd = async () => {
        if (!isPulling.current || isRefreshing) return
        isPulling.current = false

        if (pullDistance >= PULL_THRESHOLD) {
            triggerHaptic("light")
            setIsRefreshing(true)
            setPullDistance(45)

            // Refresh route and quotes
            router.refresh()

            setTimeout(() => {
                setIsRefreshing(false)
                setPullDistance(0)
            }, 800)
        } else {
            setPullDistance(0)
        }
    }

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative min-h-screen"
        >
            {/* Pull Indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div
                    className="md:hidden flex items-center justify-center w-full overflow-hidden transition-all duration-150 pointer-events-none"
                    style={{ height: `${pullDistance}px` }}
                >
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-emerald-500">
                        {isRefreshing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <ArrowDown
                                className="w-4 h-4 transition-transform duration-150"
                                style={{
                                    transform: `rotate(${Math.min((pullDistance / PULL_THRESHOLD) * 180, 180)}deg)`,
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
            {children}
        </div>
    )
}
