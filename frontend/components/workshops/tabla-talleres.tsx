"use client"

import type { Taller } from "@/types"
import { Button } from "@/components/shared/ui/button"
import { Card, CardContent } from "@/components/shared/ui/card"
import { Edit, Trash2, MapPin, CalendarDays, Clock, Tag, Users, Star, User } from "lucide-react"

type Props = {
  talleres?: Taller[]
  onEditar?: (t: Taller) => void
  onEliminar?: (t: Taller) => void
  acciones?: boolean
}

// Tarjetas de talleres
export function TablaTalleres({ talleres = [], onEditar = () => { }, onEliminar = () => { }, acciones = false }: Props) {
  if (!talleres.length) {
    return <p className="text-sm text-white/70">{"No hay talleres disponibles por ahora."}</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {talleres.map((t) => (
        <Card key={t._id} className="border border-white/10 bg-white/5 text-white">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg text-white">{t.nombre}</h3>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="h-4 w-4 fill-amber-400" />
                <span className="text-sm">{Number(t.rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
            <p className="text-xs font-medium mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white">
              <Tag className="h-3 w-3" /> {t.categoria} · {t.tipo}
            </p>
            <p className="text-sm text-white/80 mt-3">{t.descripcion}</p>
            <div className="mt-4 space-y-1 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-400" />
                <span>{t.fecha}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>{t.hora}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>{t.lugar}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-400" />
                <span>{t.instructor || "Por asignar"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-400" />
                <span>
                  Cupo: {t.cupo} · Disponibles:{" "}
                  {typeof t.cupos_disponibles === "number"
                    ? t.cupos_disponibles
                    : Math.max((t.cupo || 0) - (t.inscripciones?.length || 0), 0)}
                </span>
              </div>
            </div>
            {acciones && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="border-white/20 !text-white hover:bg-white/10 hover:!text-white bg-transparent"
                  onClick={() => onEditar(t)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => onEliminar(t)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
