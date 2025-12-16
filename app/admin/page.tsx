"use client"

import { useEffect, useState } from "react"
import type { Taller } from "@/types"
import { apiFetch, obtenerTokenAdmin, limpiarTokenAdmin, esTokenAdmin } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Button } from "@/components/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/shared/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shared/ui/dialog"
import { FormularioTaller } from "@/components/admin/formulario-taller"
import { TablaTalleres } from "@/components/workshops/tabla-talleres"
import { AIInsights } from "@/components/ai"
import { useToast } from "@/lib/hooks/use-toast"
import { PlusCircle, LogOut, Users } from "lucide-react"
import Link from "next/link"
import { Navbar } from "@/components/shared/ui/navbar"
import { Toaster } from "@/components/shared/ui/toaster"

export default function PanelAdmin() {
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [cargando, setCargando] = useState(true)
  const [abiertoCrear, setAbiertoCrear] = useState(false)
  const [abiertoEditar, setAbiertoEditar] = useState(false)
  const [tallerEditar, setTallerEditar] = useState<Taller | null>(null)
  const [verificado, setVerificado] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const token = obtenerTokenAdmin()

  useEffect(() => {
    // Verificar que el token existe Y es de un admin
    if (!token || !esTokenAdmin(token)) {
      // Limpiar cualquier token inválido
      if (token && !esTokenAdmin(token)) {
        limpiarTokenAdmin()
        toast({ 
          title: "Acceso denegado", 
          description: "No tienes permisos de administrador", 
          variant: "destructive" 
        })
      }
      router.replace("/admin/login")
      return
    }
    setVerificado(true)
    cargar()
  }, [token])

  async function cargar() {
    setCargando(true)
    try {
      const data = await apiFetch("/workshops", { metodo: "GET", token })
      setTalleres(data)
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setCargando(false)
    }
  }

  async function crearTaller(valores: any) {
    try {
      const creado = await apiFetch("/workshops", { metodo: "POST", cuerpo: valores, token })
      setTalleres(prev => [creado, ...prev])
      setAbiertoCrear(false)
      toast({ title: "Taller creado", description: "El taller se ha registrado correctamente." })
    } catch (e: any) {
      toast({ title: "No se pudo crear", description: e.message, variant: "destructive" })
    }
  }

  async function actualizarTaller(valores: any) {
    if (!tallerEditar) return
    try {
      const actualizado = await apiFetch(`/workshops/${tallerEditar._id}`, { metodo: "PUT", cuerpo: valores, token })
      setTalleres(prev => prev.map(t => (t._id === actualizado._id ? actualizado : t)))
      setAbiertoEditar(false)
      setTallerEditar(null)
      toast({ title: "Taller actualizado", description: "Cambios guardados correctamente." })
    } catch (e: any) {
      toast({ title: "No se pudo actualizar", description: e.message, variant: "destructive" })
    }
  }

  async function eliminarTaller(t: Taller) {
    if (!confirm(`¿Eliminar el taller "${t.nombre}"?`)) return
    try {
      await apiFetch(`/workshops/${t._id}`, { metodo: "DELETE", token })
      setTalleres(prev => prev.filter(x => x._id !== t._id))
      toast({ title: "Taller eliminado", description: "Se ha cancelado el taller." })
    } catch (e: any) {
      toast({ title: "No se pudo eliminar", description: e.message, variant: "destructive" })
    }
  }

  function cerrarSesion() {
    limpiarTokenAdmin()
    router.push("/admin/login")
  }

  // No renderizar hasta verificar que es admin
  if (!verificado) {
    return (
      <div className="min-h-screen bg-[#0b0e13] text-white flex items-center justify-center">
        <p>Verificando permisos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0b0e13] text-white">
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestión de talleres</h1>
            <p className="text-white/80 mt-1">Crea, edita o cancela talleres. Define cupos y calificaciones.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/estudiantes">
              <Button variant="outline" className="border-white/20 !text-white hover:bg-white/10 hover:!text-white bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                Estudiantes
              </Button>
            </Link>

            {/* CREAR */}
            <Dialog open={abiertoCrear} onOpenChange={setAbiertoCrear}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nuevo taller
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar nuevo taller</DialogTitle>
                </DialogHeader>
                <FormularioTaller
                  key="crear"
                  onSubmit={crearTaller}
                  textoBoton="Crear"
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="border-white/20 !text-white hover:bg-white/10 hover:!text-white bg-transparent"
              onClick={cerrarSesion}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </header>

        {/* Insights de IA para admin */}
        {token && talleres.length > 0 && !cargando && (
          <AIInsights
            talleres={talleres}
            token={token}
            userType="admin"
          />
        )}

        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Listado</CardTitle>
            <CardDescription className="text-white/80">Talleres programados y cupos</CardDescription>
          </CardHeader>
          <CardContent>
            {cargando ? (
              <p className="text-sm text-white/80">Cargando talleres...</p>
            ) : (
              <TablaTalleres
                talleres={talleres}
                acciones
                onEditar={t => {
                  setTallerEditar(t)
                  setAbiertoEditar(true)
                }}
                onEliminar={t => eliminarTaller(t)}
              />
            )}
          </CardContent>
        </Card>

        {/* EDITAR */}
        <Dialog open={abiertoEditar} onOpenChange={setAbiertoEditar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar taller</DialogTitle>
            </DialogHeader>
            <FormularioTaller
              key={tallerEditar?._id || "editar"}
              valorInicial={tallerEditar || {}}
              onSubmit={actualizarTaller}
              textoBoton="Guardar cambios"
            />
          </DialogContent>
        </Dialog>
      </section>

      <Toaster />
    </div>
  )
}
