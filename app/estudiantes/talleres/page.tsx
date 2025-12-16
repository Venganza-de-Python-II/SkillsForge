"use client"

import { useEffect, useState } from "react"
import type { Taller } from "@/types"
import { apiFetch, obtenerTokenEstudiante } from "@/lib/api"
import { useToast } from "@/lib/hooks/use-toast"
import { Badge } from "@/components/shared/ui/badge"
import { BotonInscripcion } from "@/components/workshops/boton-inscripcion"
import { FiltrosTalleres } from "@/components/workshops/filtros-talleres"
import { AIInsights, LowStockBadge, RecommendedBadge } from "@/components/ai"
import Link from "next/link"
import { Navbar } from "@/components/shared/ui/navbar"
import { Button } from "@/components/shared/ui/button"
import { useRouter } from "next/navigation"

export default function PaginaTalleres() {
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [misRegistros, setMisRegistros] = useState<string[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState<{ q: string; categoria: string }>({ q: "", categoria: "" })
  const [token, setToken] = useState<string>("")
  const [userEmail, setUserEmail] = useState<string>("")
  const { toast } = useToast()
  const router = useRouter()

  // Escucha si el token expira para mandarte al login
  useEffect(() => {
    const handleTokenExpired = () => {
      toast({
        title: "Sesión expirada",
        description: "Por favor, inicia sesión nuevamente",
        variant: "destructive"
      })
      router.replace("/estudiantes/login?next=/estudiantes/talleres")
    }
    window.addEventListener("auth:token-expired", handleTokenExpired)
    return () => window.removeEventListener("auth:token-expired", handleTokenExpired)
  }, [router, toast])

  async function cargar() {
    setCargando(true)
    const qs = new URLSearchParams()
    if (filtros.q) qs.set("q", filtros.q)
    if (filtros.categoria) qs.set("categoria", filtros.categoria)

    try {
      const data = await apiFetch(`/workshops?${qs.toString()}`)
      setTalleres(data)

      // Si está logueado, cargamos sus registros
      const studentToken = obtenerTokenEstudiante()
      if (studentToken) {
        setToken(studentToken)
        // Sacamos el email del token
        try {
          const payload = JSON.parse(atob(studentToken.split('.')[1]))
          setUserEmail(payload.email || payload.sub || '')
        } catch {
          setUserEmail('')
        }
        try {
          const registros = await apiFetch("/registrations/me", { token: studentToken })
          setMisRegistros(registros.map((r: Taller) => r._id))
        } catch {
          // No pasa nada si falla, solo no mostramos registros
          setMisRegistros([])
        }
      }
    } catch (e: any) {
      toast({ title: "Error al cargar talleres", description: e.message, variant: "destructive" })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [filtros.q, filtros.categoria])

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Talleres Disponibles</h1>
              <p className="text-white/80 mt-2">{"Explora y regístrate en talleres de tu interés."}</p>
              <div className="mt-4">
                <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600">Portal Estudiantes</Badge>
              </div>
            </div>
            <Link href="/estudiantes/mis-registros">
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/30">
                Mis registros
              </Button>
            </Link>
          </div>
        </header>

        <FiltrosTalleres onChange={(f) => setFiltros(f)} valores={filtros} talleres={talleres} />

        {/* IA solo si hay token y talleres */}
        {token && talleres.length > 0 && !cargando && (
          <AIInsights
            talleres={talleres}
            token={token}
            userEmail={userEmail}
            userType="student"
            misRegistros={misRegistros}
            onInscribir={async (tallerId) => {
              try {
                await apiFetch(`/workshops/${tallerId}/register`, { metodo: "POST", token })
                setMisRegistros(prev => [...prev, tallerId])
                toast({ title: "¡Inscrito!", description: "Te has inscrito correctamente al taller" })
                cargar() // Recargar para actualizar cupos
              } catch (e: any) {
                toast({ title: "Error", description: e.message, variant: "destructive" })
              }
            }}
            onFiltrar={(f) => setFiltros(prev => ({ ...prev, ...f }))}
          />
        )}

        {cargando ? (
          <p className="text-sm text-white/80 mt-4">{"Cargando talleres..."}</p>
        ) : (
          <div className="space-y-6 mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {talleres.map((t) => {
                // Es popular si tiene más inscripciones que el promedio
                const avgInscripciones = talleres.reduce((acc, x) => acc + (x.inscripciones?.length || 0), 0) / talleres.length;
                const isPopular = (t.inscripciones?.length || 0) > avgInscripciones && (t.inscripciones?.length || 0) >= 2;

                return (
                  <div
                    key={`${t._id}-card`}
                    id={`workshop-${t._id}`}
                    data-slot="card"
                    className="flex flex-col gap-6 rounded-xl py-6 shadow-sm border border-white/10 bg-white/5 text-white transition-all duration-300"
                  >
                    <div data-slot="card-content" className="px-6 pt-6">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg text-white">{t.nombre}</h3>
                        <div className="flex items-center gap-1 text-amber-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star h-4 w-4 fill-amber-400">
                            <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>
                          </svg>
                          <span className="text-sm">{t.rating || 0}</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag h-3 w-3">
                            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"></path>
                            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor"></circle>
                          </svg> {t.categoria}
                        </span>
                        {isPopular && <RecommendedBadge />}
                        <LowStockBadge cupos={t.cupos_disponibles || 0} />
                      </div>

                      <p className="text-sm text-white/80 mt-3">{t.descripcion}</p>

                      <div className="mt-4 space-y-1 text-sm text-white/90">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-days h-4 w-4 text-emerald-400">
                            <path d="M8 2v4"></path><path d="M16 2v4"></path>
                            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                            <path d="M3 10h18"></path>
                            <path d="M8 14h.01"></path><path d="M12 14h.01"></path><path d="M16 14h.01"></path>
                            <path d="M8 18h.01"></path><path d="M12 18h.01"></path><path d="M16 18h.01"></path>
                          </svg>
                          <span>{t.fecha}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock h-4 w-4 text-emerald-400">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>{t.hora}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin h-4 w-4 text-emerald-400">
                            <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span>{t.lugar}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user h-4 w-4 text-emerald-400">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span>{t.instructor || 'No definido'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users h-4 w-4 text-emerald-400">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                          <span>Cupo: {t.cupo} · Disponibles: {t.cupos_disponibles}</span>
                        </div>
                      </div>

                      {/* Botón inscribirse */}
                      <div className="mt-4 flex justify-end">
                        <BotonInscripcion
                          taller={t}
                          yaRegistrado={misRegistros.includes(t._id)}
                          onRegistrado={(actualizado) => {
                            setTalleres((prev) => prev.map((x) => (x._id === actualizado._id ? actualizado : x)))
                            if (misRegistros.includes(t._id)) {
                              setMisRegistros(prev => prev.filter(id => id !== t._id))
                            } else {
                              setMisRegistros(prev => [...prev, t._id])
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}