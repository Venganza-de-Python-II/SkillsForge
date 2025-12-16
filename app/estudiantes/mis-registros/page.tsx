"use client"

import { useEffect, useState } from "react"
import type { Taller } from "@/types"
import { apiFetch, obtenerTokenEstudiante } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/shared/ui/card"
import { Button } from "@/components/shared/ui/button"
import { Badge } from "@/components/shared/ui/badge"
import { Trash2, Calendar, Clock, MapPin, User, FileText, AlertCircle, CheckCircle2, Users } from "lucide-react"
import { useToast } from "@/lib/hooks/use-toast"
import { Navbar } from "@/components/shared/ui/navbar"
import { motion } from "framer-motion"
import Link from "next/link"
import { Toaster } from "@/components/shared/ui/toaster"

export default function MisRegistros() {
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [cargando, setCargando] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const token = obtenerTokenEstudiante()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Si el token expira, mandamos al login
  useEffect(() => {
    const handleTokenExpired = () => {
      toast({
        title: "Sesión expirada",
        description: "Por favor, inicia sesión nuevamente",
        variant: "destructive"
      })
      router.replace("/estudiantes/login?next=/estudiantes/mis-registros")
    }
    window.addEventListener("auth:token-expired", handleTokenExpired)
    return () => window.removeEventListener("auth:token-expired", handleTokenExpired)
  }, [router, toast])

  useEffect(() => {
    if (!token) {
      router.replace("/estudiantes/login?next=/estudiantes/mis-registros")
      return
    }
    cargar()
  }, [token])

  async function cargar() {
    setCargando(true)
    try {
      const data = await apiFetch("/registrations/me", { token })
      setTalleres(data)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setCargando(false)
    }
  }

  async function anular(t: Taller) {
    if (!confirm(`¿Anular tu inscripción al taller "${t.nombre}"?`)) return
    try {
      await apiFetch(`/workshops/${t._id}/register`, { metodo: "DELETE", token })
      setTalleres(prev => prev.filter(x => x._id !== t._id))
      toast({ title: "Inscripción anulada" })
    } catch (e: any) {
      toast({ title: "No se pudo anular", description: e.message, variant: "destructive" })
    }
  }

  const formatearFecha = (fecha: string) => {
    try {
      const date = new Date(fecha)
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`
    } catch {
      return fecha
    }
  }

  const esProximo = (fecha: string) => {
    if (typeof window === "undefined") return false
    try {
      const fechaTaller = new Date(fecha)
      const hoy = new Date()
      const diferencia = fechaTaller.getTime() - hoy.getTime()
      const diasDiferencia = Math.ceil(diferencia / (1000 * 3600 * 24))
      return diasDiferencia <= 7 && diasDiferencia >= 0
    } catch {
      return false
    }
  }

  const esPasado = (fecha: string) => {
    if (typeof window === "undefined") return false
    try {
      const fechaTaller = new Date(fecha)
      const hoy = new Date()
      return fechaTaller < hoy
    } catch {
      return false
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white relative">
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[30rem] w-[30rem] blur-3xl opacity-20"
        style={{
          background: "radial-gradient(ellipse at center, rgba(168,85,247,0.3) 0%, rgba(56,189,248,0.2) 35%, transparent 60%)",
        }}
      />

      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 relative">
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-600/40 to-cyan-500/40 ring-1 ring-white/10">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Mis Registros
              </h1>
              <p className="text-white/60 mt-1">Gestiona tus inscripciones a talleres</p>
            </div>
          </motion.div>

          {!cargando && talleres.length > 0 && mounted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white">{talleres.length}</div>
                  <div className="text-sm text-white/70">Total</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {talleres.filter(t => !esPasado(t.fecha)).length}
                  </div>
                  <div className="text-sm text-white/70">Activos</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {talleres.filter(t => esProximo(t.fecha)).length}
                  </div>
                  <div className="text-sm text-white/70">Esta semana</div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-white/60">
                    {talleres.filter(t => esPasado(t.fecha)).length}
                  </div>
                  <div className="text-sm text-white/70">Completados</div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
              <p className="text-white/80">Cargando inscripciones...</p>
            </div>
          </div>
        ) : talleres.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="mx-auto mb-6 p-4 rounded-full bg-white/5 w-fit">
              <Users className="h-12 w-12 text-white/40" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No tienes inscripciones</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Aún no te has inscrito a ningún taller. Explora nuestros talleres disponibles y encuentra el perfecto para ti.
            </p>
            <Link href="/estudiantes/talleres">
              <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-[1.15] text-white hover:text-white">
                Explorar Talleres
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {talleres.map((t, index) => {
              const proximo = mounted ? esProximo(t.fecha) : false
              const pasado = mounted ? esPasado(t.fecha) : false
              return (
                <motion.div
                  key={t._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Card className="bg-white/5 border-white/10 relative overflow-hidden h-full">
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute -inset-16 rounded-[40px] blur-3xl bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),rgba(99,102,241,0.1),transparent_60%)]" />
                    </div>
                    <CardHeader className="pb-3 relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white text-lg leading-tight mb-2">{t.nombre}</h3>
                          {t.descripcion && (
                            <p className="text-sm text-white/70 line-clamp-2">{t.descripcion}</p>
                          )}
                        </div>
                        <div className="ml-3">
                          {proximo ? (
                            <Badge className="bg-green-600/20 text-green-400 border-green-600/30">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Próximo
                            </Badge>
                          ) : pasado ? (
                            <Badge className="bg-white/10 text-white/60 border-white/20">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completado
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                              Programado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 relative">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Calendar className="h-4 w-4 text-purple-400" />
                          <span>{formatearFecha(t.fecha)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                          <Clock className="h-4 w-4 text-cyan-400" />
                          <span>{t.hora}</span>
                        </div>
                        {t.lugar && (
                          <div className="flex items-center gap-2 text-sm text-white/80">
                            <MapPin className="h-4 w-4 text-green-400" />
                            <span>{t.lugar}</span>
                          </div>
                        )}
                        {t.instructor && (
                          <div className="flex items-center gap-2 text-sm text-white/80">
                            <User className="h-4 w-4 text-orange-400" />
                            <span>{t.instructor}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white hover:text-white [&>svg]:text-white hover:[&>svg]:text-white"
                          onClick={() => anular(t)}
                          disabled={pasado}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {pasado ? "Completado" : "Anular"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
      <Toaster />
    </div>
  )
}