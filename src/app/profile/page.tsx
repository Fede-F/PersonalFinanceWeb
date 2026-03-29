import { auth } from "@/auth"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ChevronLeft, User } from "lucide-react"

export default async function ProfilePage() {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const [userData] = await db.select().from(users).where(eq(users.id, session.user.id))

    return (
        <div className="min-h-screen bg-zinc-50/50 p-6 md:p-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors w-fit"
                >
                    <ChevronLeft size={16} /> Volver al Dashboard
                </Link>

                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
                        <p className="text-zinc-500">Administra tu información personal y preferencias.</p>
                    </div>
                </div>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Información Personal</CardTitle>
                        <CardDescription>Estos datos se utilizan para personalizar tu experiencia.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" defaultValue={userData.name || ""} placeholder="Tu nombre" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" defaultValue={userData.email || ""} disabled className="bg-zinc-100" />
                            <p className="text-xs text-zinc-400 italic">El email no se puede cambiar por seguridad.</p>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            Guardar Cambios
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm border-rose-100">
                    <CardHeader>
                        <CardTitle className="text-rose-600">Zona Peligrosa</CardTitle>
                        <CardDescription>Acciones permanentes que afectan tu cuenta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
                            Eliminar mi cuenta
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
