"use client"

import { useEffect, useState, useRef } from "react"
import { Input } from "@/components/shared/ui/input"
import { Label } from "@/components/shared/ui/label"
import { Textarea } from "@/components/shared/ui/textarea"
import { Button } from "@/components/shared/ui/button"
import type { Taller } from "@/types"

type Props = {
  valorInicial?: Partial<Taller>
  onSubmit?: (
    valores: Omit<Taller, "_id" | "creado_en" | "actualizado_en" | "inscripciones" | "cupos_disponibles">,
  ) => void
  textoBoton?: string
}

// Form para crear/editar talleres
export function FormularioTaller({ valorInicial = {}, onSubmit = () => { }, textoBoton = "Guardar" }: Props) {
  // Para saber si es la primera vez que renderiza
  const esPrimeraRenderizacion = useRef(true)

  const [nombre, setNombre] = useState(valorInicial.nombre || "")
  const [descripcion, setDescripcion] = useState(valorInicial.descripcion || "")
  const [fecha, setFecha] = useState(valorInicial.fecha || "")
  const [hora, setHora] = useState(valorInicial.hora || "")
  const [lugar, setLugar] = useState(valorInicial.lugar || "")
  const [categoria, setCategoria] = useState(valorInicial.categoria || "")
  const [tipo, setTipo] = useState(valorInicial.tipo || "")
  const [cupo, setCupo] = useState<number>(typeof valorInicial.cupo === "number" ? valorInicial.cupo : 30)
  const [instructor, setInstructor] = useState(valorInicial.instructor || "")
  const [rating, setRating] = useState<number>(typeof valorInicial.rating === "number" ? valorInicial.rating : 0)

  // Errores de validación
  const [errorNombre, setErrorNombre] = useState<string>("")
  const [errorFecha, setErrorFecha] = useState<string>("")
  const [errorHora, setErrorHora] = useState<string>("")
  const [errorLugar, setErrorLugar] = useState<string>("")
  const [errorCupo, setErrorCupo] = useState<string>("")
  const [errorInstructor, setErrorInstructor] = useState<string>("")
  const [errorRating, setErrorRating] = useState<string>("")

  // Fecha de hoy en formato YYYY-MM-DD
  const obtenerFechaActual = () => {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  }

  const fechaMinima = obtenerFechaActual()

  // Límites de cupo
  const CUPO_MAXIMO = 500
  const CUPO_MINIMO = 1

  // Rating entre 0 y 5
  const validarRating = (valor: number): number => {
    if (isNaN(valor)) return 0
    if (valor < 0) return 0
    if (valor > 5) return 5
    // Limitar a un decimal
    return Math.round(valor * 10) / 10
  }

  // Cupo válido entre mínimo y máximo
  const validarCupo = (valor: number): number => {
    if (isNaN(valor)) return CUPO_MINIMO
    if (valor < CUPO_MINIMO) return CUPO_MINIMO
    if (valor > CUPO_MAXIMO) return CUPO_MAXIMO
    return Math.floor(valor) // Asegurar que sea un entero
  }

  // Que la fecha no sea en el pasado
  const validarFecha = (fechaSeleccionada: string): boolean => {
    if (!fechaSeleccionada) return false

    const fechaActual = new Date(obtenerFechaActual())
    const fechaIngresada = new Date(fechaSeleccionada)

    // Eliminar horas, minutos y segundos para comparar solo la fecha
    fechaActual.setHours(0, 0, 0, 0)
    fechaIngresada.setHours(0, 0, 0, 0)

    return fechaIngresada >= fechaActual
  }

  // Actualiza el form cuando cambia valorInicial (al editar)
  useEffect(() => {
    // Omitir actualizaciones de estado después de la primera renderización para evitar que los inputs se restablezcan
    if (esPrimeraRenderizacion.current) {
      esPrimeraRenderizacion.current = false
      return
    }

    // Solo ejecutar este efecto cuando se edita un taller existente (tiene un _id)
    if (valorInicial._id) {
      setNombre(valorInicial.nombre || "")
      setDescripcion(valorInicial.descripcion || "")
      setFecha(valorInicial.fecha || "")
      setHora(valorInicial.hora || "")
      setLugar(valorInicial.lugar || "")
      setCategoria(valorInicial.categoria || "")
      setTipo(valorInicial.tipo || "")
      setCupo(validarCupo(typeof valorInicial.cupo === "number" ? valorInicial.cupo : 30))
      setInstructor(valorInicial.instructor || "")
      setRating(validarRating(typeof valorInicial.rating === "number" ? valorInicial.rating : 0))
    }
  }, [valorInicial])

  function manejarEnvio(e: React.FormEvent) {
    e.preventDefault()

    // Verificar campos obligatorios
    let hayErrores = false

    // Validar nombre
    if (!nombre.trim()) {
      setErrorNombre("El nombre del taller es obligatorio")
      hayErrores = true
    } else {
      setErrorNombre("")
    }

    // Validar fecha
    if (!fecha) {
      setErrorFecha("La fecha es obligatoria")
      hayErrores = true
    } else if (!validarFecha(fecha)) {
      setErrorFecha("La fecha no puede ser anterior a hoy")
      hayErrores = true
    } else {
      setErrorFecha("")
    }

    // Validar hora
    if (!hora) {
      setErrorHora("La hora es obligatoria")
      hayErrores = true
    } else {
      setErrorHora("")
    }

    // Validar lugar
    if (!lugar.trim()) {
      setErrorLugar("El lugar es obligatorio")
      hayErrores = true
    } else {
      setErrorLugar("")
    }

    // Validar instructor
    if (!instructor.trim()) {
      setErrorInstructor("El nombre del instructor es obligatorio")
      hayErrores = true
    } else {
      setErrorInstructor("")
    }

    // Validar cupo
    if (cupo < CUPO_MINIMO) {
      setErrorCupo(`El cupo mínimo es ${CUPO_MINIMO}`)
      hayErrores = true
    } else if (cupo > CUPO_MAXIMO) {
      setErrorCupo(`El cupo máximo es ${CUPO_MAXIMO}`)
      hayErrores = true
    } else {
      setErrorCupo("")
    }

    // Validar rating
    if (rating < 0 || rating > 5) {
      setErrorRating("La calificación debe estar entre 0 y 5")
      hayErrores = true
    } else {
      setErrorRating("")
    }

    // Si hay errores, no enviar el formulario
    if (hayErrores) return

    // Validar datos antes de enviar
    const valorRatingValidado = validarRating(rating)
    const valorCupoValidado = validarCupo(cupo)

    onSubmit({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      fecha: fecha.trim(),
      hora: hora.trim(),
      lugar: lugar.trim(),
      categoria: categoria.trim(),
      tipo: tipo.trim(),
      cupo: valorCupoValidado,
      instructor: instructor.trim(),
      rating: valorRatingValidado,
    } as any)
  }

  // Cuando cambia la fecha
  const manejarCambioFecha = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevaFecha = e.target.value
    setFecha(nuevaFecha)

    if (nuevaFecha && !validarFecha(nuevaFecha)) {
      setErrorFecha("La fecha no puede ser anterior a hoy")
    } else {
      setErrorFecha("")
    }
  }

  // Cuando cambia el cupo
  const manejarCambioCupo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorIngresado = e.target.value

    // Si el campo está vacío, no mostrar error
    if (!valorIngresado) {
      setCupo(CUPO_MINIMO)
      setErrorCupo("")
      return
    }

    const valor = Number.parseInt(valorIngresado, 10)

    if (isNaN(valor)) {
      setCupo(CUPO_MINIMO)
      setErrorCupo("Debe ingresar un número válido")
    } else if (valor < CUPO_MINIMO) {
      setCupo(CUPO_MINIMO)
      setErrorCupo(`El cupo mínimo es ${CUPO_MINIMO}`)
    } else if (valor > CUPO_MAXIMO) {
      setCupo(CUPO_MAXIMO)
      setErrorCupo(`El cupo máximo es ${CUPO_MAXIMO}`)
    } else {
      // Valor dentro del rango permitido (incluye cuando es exactamente el máximo)
      setCupo(Math.floor(valor))
      setErrorCupo("")
    }
  }

  // Cuando cambia el rating
  const manejarCambioRating = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorIngresado = e.target.value

    // Si el campo está vacío, no mostrar error
    if (!valorIngresado) {
      setRating(0)
      setErrorRating("")
      return
    }

    const valor = Number.parseFloat(valorIngresado)

    if (isNaN(valor)) {
      setRating(0)
      setErrorRating("Debe ingresar un número válido")
    } else if (valor < 0) {
      setRating(0)
      setErrorRating("La calificación mínima es 0")
    } else if (valor > 5) {
      setRating(5)
      setErrorRating("La calificación máxima es 5")
    } else {
      // Valor dentro del rango permitido (incluye cuando es exactamente el máximo)
      setRating(Math.round(valor * 10) / 10)
      setErrorRating("")
    }
  }

  const clasesInput = "bg-black/30 border-white/20 text-white placeholder:text-white/50"
  const clasesFechaHora = "bg-black/30 border-white/20 text-white placeholder:text-white/50 [&::-webkit-calendar-picker-indicator]:filter-invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
  const clasesError = "text-red-400 text-xs mt-1 min-h-0 h-0 overflow-visible"

  return (
    <form onSubmit={manejarEnvio} className="grid gap-3 text-white">
      <div className="grid gap-1.5">
        <Label htmlFor="nombre" className="text-white/90">
          Nombre del taller
        </Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Fundamentos de Git"
          className={clasesInput}
          required
          maxLength={100}
        />
        {errorNombre && <p className={clasesError}>{errorNombre}</p>}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="descripcion" className="text-white/90">
          Descripción
        </Label>
        <Textarea
          id="descripcion"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Breve detalle del taller"
          className={clasesInput}
          maxLength={500}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="fecha" className="text-white/90">
            Fecha
          </Label>
          <Input
            id="fecha"
            type="date"
            value={fecha}
            onChange={manejarCambioFecha}
            className={clasesFechaHora}
            min={fechaMinima}
            required
          />
          {errorFecha && <p className={clasesError}>{errorFecha}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="hora" className="text-white/90">
            Hora
          </Label>
          <Input
            id="hora"
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className={clasesFechaHora}
            required
          />
          {errorHora && <p className={clasesError}>{errorHora}</p>}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="lugar" className="text-white/90">
          Lugar
        </Label>
        <Input
          id="lugar"
          value={lugar}
          onChange={(e) => setLugar(e.target.value)}
          placeholder="Aula 2, Laboratorio, etc."
          className={clasesInput}
          required
          maxLength={100}
        />
        {errorLugar && <p className={clasesError}>{errorLugar}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="categoria" className="text-white/90">
            Categoría
          </Label>
          <Input
            id="categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="tecnología, emprendimiento..."
            className={clasesInput}
            maxLength={50}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="tipo" className="text-white/90">
            Tipo de actividad
          </Label>
          <Input
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="curso técnico, capacitación..."
            className={clasesInput}
            maxLength={50}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="instructor" className="text-white/90">
            Instructor
          </Label>
          <Input
            id="instructor"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            placeholder="Nombre del instructor"
            className={clasesInput}
            required
            maxLength={100}
          />
          {errorInstructor && <p className={clasesError}>{errorInstructor}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rating" className="text-white/90">
            Calificación (0-5)
          </Label>
          <Input
            id="rating"
            type="number"
            step="0.1"
            min={0}
            max={5}
            value={rating}
            onChange={manejarCambioRating}
            className={clasesInput}
          />
          {errorRating && <p className={clasesError}>{errorRating}</p>}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="cupo" className="text-white/90">
          Cupo (min. {CUPO_MINIMO}, máx. {CUPO_MAXIMO})
        </Label>
        <Input
          id="cupo"
          type="number"
          min={CUPO_MINIMO}
          max={CUPO_MAXIMO}
          value={cupo}
          onChange={manejarCambioCupo}
          className={clasesInput}
          required
        />
        {errorCupo && <p className={clasesError}>{errorCupo}</p>}
      </div>

      <div className="flex justify-end mt-2">
        <Button
          type="submit"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {textoBoton}
        </Button>
      </div>
    </form>
  )
}