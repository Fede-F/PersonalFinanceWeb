"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { registerUser } from "@/app/actions/auth"

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        const name = formData.get("name") as string
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        try {
            const result = await registerUser({ name, email, password })

            if (result.error) {
                if (typeof result.error === "string") {
                    toast.error(result.error)
                } else {
                    toast.error("Error en los campos del formulario")
                }
            } else {
                toast.success("Cuenta creada correctamente. Ya puedes iniciar sesión.")
                router.push("/login")
            }
        } catch (error) {
            toast.error("Ocurrió un error al registrar el usuario")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between mb-2">
                        <Link href="/login" className="text-sm text-zinc-500 hover:text-emerald-600 flex items-center transition-colors">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Volver al login
                        </Link>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        Crear una <span className="text-emerald-500">cuenta</span>
                    </CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400">
                        Regístrate para empezar a gestionar tus finanzas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre completo</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Juan Pérez"
                                required
                                className="bg-white dark:bg-zinc-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="tu@ejemplo.com"
                                required
                                className="bg-white dark:bg-zinc-900"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="bg-white dark:bg-zinc-900 pr-10"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-4 transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando cuenta...
                                </>
                            ) : (
                                "Registrarse"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="text-emerald-600 hover:text-emerald-500 font-semibold underline-offset-4 hover:underline">
                            Inicia sesión
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
