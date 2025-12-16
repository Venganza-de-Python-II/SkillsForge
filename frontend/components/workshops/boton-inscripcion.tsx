"use client"

import { useState } from "react"
import { Button } from "@/components/shared/ui/button"
import { useToast } from "@/lib/hooks/use-toast"
import { apiFetch, obtenerTokenEstudiante } from "@/lib/api"
import type { Taller } from "@/types"
import { UserPlus, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

type Props = {
  taller?: Taller
  onRegistrado?: (t: Taller) => void
  yaRegistrado?: boolean
}

// Botón para inscribirse o cancelar inscripción
export function BotonInscripcion({
  taller = {
    _id: "",
    nombre: "",
    descripcion: "",
    fecha: "",
    hora: "",
    lugar: "",
    categoria: "",
    tipo: "",
    cupo: 0,
  },
  onRegistrado = () => { },
  yaRegistrado = false,
}: Props) {
  const [cargando, setCargando] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Inscribe o cancela según el estado
  async function manejarInscripcion() {
    const token = obtenerTokenEstudiante()
    if (!token) {
      router.push("/estudiantes/login?next=/estudiantes/talleres")
      return
    }
    setCargando(true)
    try {
      if (yaRegistrado) {
        await apiFetch(`/workshops/${taller._id}/register`, { metodo: "DELETE", token })
        onRegistrado({ ...taller, cupos_disponibles: (taller.cupos_disponibles || 0) + 1 })
        toast({ title: "Inscripción anulada", description: "Has anulado tu inscripción al taller." })
      } else {
        const actualizado = await apiFetch(`/workshops/${taller._id}/register`, { metodo: "POST", token })
        onRegistrado(actualizado)
        toast({ title: "Inscripción confirmada", description: "Te has inscrito al taller." })
      }
    } catch (e: any) {
      toast({ title: yaRegistrado ? "No se pudo anular" : "No se pudo inscribir", description: e.message, variant: "destructive" })
      if (e.message.toLowerCase().includes("no autorizado")) {
        router.push("/estudiantes/login?next=/estudiantes/talleres")
      }
    } finally {
      setCargando(false)
    }
  }

  // Cupos que quedan
  const disponibles =
    typeof taller.cupos_disponibles === "number"
      ? taller.cupos_disponibles
      : Math.max((taller.cupo || 0) - (taller.inscripciones?.length || 0), 0)

  if (yaRegistrado) {
    return (
      <Button
        disabled={cargando}
        onClick={manejarInscripcion}
        variant="outline"
        className="border-green-600/50 text-green-400 hover:bg-green-600/10 hover:text-green-400 bg-green-600/5 [&>svg]:text-green-400 hover:[&>svg]:text-green-400"
        aria-disabled={cargando}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {cargando ? "Anulando..." : "Registrado"}
      </Button>
    )
  }

  return (
    <Button
      disabled={cargando || disponibles <= 0}
      onClick={manejarInscripcion}
      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-[1.15] text-white hover:text-white [&>svg]:text-white hover:[&>svg]:text-white"
      aria-disabled={cargando || disponibles <= 0}
    >
      <UserPlus className="mr-2 h-4 w-4" />
      {disponibles <= 0 ? "Sin cupos" : cargando ? "Inscribiendo..." : "Inscribirme"}
    </Button>
  )
}