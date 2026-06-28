import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black p-4">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-6xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
          Finance<span className="text-emerald-500">App</span>
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          La plataforma de finanzas personales multi-tenant para hogares y grupos que buscan el siguiente nivel de gestión.
        </p>

        <div className="flex justify-center gap-4">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
            <Link href="/login">Empezar Ahora</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
