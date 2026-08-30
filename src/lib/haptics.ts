/**
 * Micro-vibrations for Mobile & PWA
 * Very subtle and gentle pulses (5-8ms) for native feel
 */
export function triggerHaptic(type: "light" | "selection" | "success" = "light") {
    if (typeof window === "undefined" || !("vibrate" in navigator)) return

    try {
        switch (type) {
            case "selection":
                navigator.vibrate(6) // Ultra-subtle tick
                break
            case "light":
                navigator.vibrate(8) // Soft button tap
                break
            case "success":
                navigator.vibrate([6, 30, 8]) // Soft double confirmation
                break
            default:
                navigator.vibrate(6)
        }
    } catch {
        // Silently ignore if vibration is blocked or unsupported
    }
}
