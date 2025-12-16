"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Input } from "@/components/shared/ui/input"
import { PasswordInput } from "@/components/shared/ui/password-input"
import { Label } from "@/components/shared/ui/label"
import { Button } from "@/components/shared/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import { apiFetch, guardarTokenEstudiante } from "@/lib/api"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/shared/ui/navbar"
import { Toaster } from "@/components/shared/ui/toaster"

export default function LoginEstudiante() {
  const [email, setEmail] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [cargando, setCargando] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next") || "/"

  async function iniciarSesion() {
    setCargando(true)
    try {
      const data = await apiFetch("/auth/estudiantes/login", { metodo: "POST", cuerpo: { email, contrasena } })
      guardarTokenEstudiante(data.token)
      toast({ title: "Bienvenido", description: "Inicio de sesión exitoso" })
      router.push(next)
    } catch (e: any) {
      toast({ title: "Error de autenticación", description: e.message, variant: "destructive" })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar />
      <main className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Iniciar sesión</CardTitle>
            <CardDescription className="text-white/85">Accede con tu cuenta de estudiante.</CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white/90">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="bg-black/30 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contrasena" className="text-white/90">
                  Contraseña
                </Label>
                <PasswordInput
                  id="contrasena"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="••••••••"
                  className="bg-black/30 border-white/20 text-white placeholder:text-white/60"
                />
              </div>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:text-white"
                disabled={cargando}
                onClick={iniciarSesion}
              >
                {cargando ? "Ingresando..." : "Ingresar"}
              </Button>
              <p className="text-sm text-white/85 text-center">
                ¿No tienes cuenta?{" "}
                <Link href="/estudiantes/registro" className="underline">
                  Regístrate
                </Link>
              </p>
            </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  )
}
