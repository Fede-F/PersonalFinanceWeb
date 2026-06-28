"use client"

import { useEffect } from "react"
import { updateLastActiveWorkspace } from "@/app/actions/user"

interface ActiveWorkspaceTrackerProps {
    workspaceId: string
}

export function ActiveWorkspaceTracker({ workspaceId }: ActiveWorkspaceTrackerProps) {
    useEffect(() => {
        if (workspaceId) {
            updateLastActiveWorkspace(workspaceId)
        }
    }, [workspaceId])

    return null
}
