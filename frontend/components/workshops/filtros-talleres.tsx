"use client"

import { useEffect, useState, useMemo } from "react"
import { Input } from "@/components/shared/ui/input"
import { Label } from "@/components/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shared/ui/select"
import { Button } from "@/components/shared/ui/button"
import { Filter } from "lucide-react"
import type { Taller } from "@/types"

// Nombres bonitos para las categorías
const CATEGORIA_LABELS: Record<string, string> = {
  programming: "Programación",
  frontend: "Frontend",
  backend: "Backend",
  devops: "DevOps",
  ai: "Inteligencia Artificial",
  cooking: "Cocina Tech",
  productivity: "Productividad",
  design: "Diseño",
  data: "Datos",
  security: "Seguridad",
  mobile: "Mobile",
  cloud: "Cloud",
}

// Props del componente
type Props = {
  // Cuando se aplican los filtros
  onChange?: (f: { q: string; categoria: string }) => void
  // Valores iniciales
  valores?: { q?: string; categoria?: string }
  // Lista de talleres para sacar categorías
  talleres?: Taller[]
}

// Filtros para buscar talleres
export function FiltrosTalleres({ onChange = () => { }, valores = {}, talleres = [] }: Props) {
  // Búsqueda por texto
  const [q, setQ] = useState(valores.q || "")
  // Categoría elegida
  const [categoria, setCategoria] = useState(valores.categoria || "todas")

  // Sacamos las categorías únicas de los talleres
  const cats = useMemo(() => {
    const categoriasSet = new Set<string>()
    talleres.forEach(t => {
      if (t.categoria) {
        categoriasSet.add(t.categoria)
      }
    })
    return Array.from(categoriasSet).sort()
  }, [talleres])

  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-emerald-400" />
        <h3 className="font-semibold">Filtros de Búsqueda</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label className="text-white/90">Búsqueda</Label>
          <Input
            className="bg-black/30 border-white/20 text-white placeholder:text-white/50"
            placeholder="Buscar talleres, instructores..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-white/90">Categoría</Label>
          <Select value={categoria} onValueChange={(v) => setCategoria(v)}>
            <SelectTrigger className="bg-black/30 border-white/20 text-white">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent className="bg-[#0b0e13] text-white border-white/10">
              <SelectItem value="todas">Todas</SelectItem>
              {cats.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORIA_LABELS[c] || c.charAt(0).toUpperCase() + c.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid items-end">
          <Button
            className="bg-gradient-to-r from-purple-600 to-indigo-600"
            onClick={() => onChange({ q, categoria: categoria === "todas" ? "" : categoria })}
          >
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  )
}
