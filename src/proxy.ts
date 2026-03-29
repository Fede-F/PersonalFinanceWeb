import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const proxy = auth((req) => {
    const isLoggedIn = !!req.auth
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register")

    if (isAuthPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
        }
        return NextResponse.next()
    }

    if (!isLoggedIn && !req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.redirect(new URL("/api/auth/signin", req.nextUrl))
    }

    return NextResponse.next()
})

export default proxy


export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
