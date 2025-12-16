// Tipos de datos del sistema

// Inscripción de un estudiante
export type Inscripcion = {
  estudiante_id?: string // ID del estudiante
  nombre: string // Nombre completo
  email: string // Correo
  registrado_en?: string // Cuándo se inscribió
}

// Un taller o curso
export type Taller = {
  _id: string // ID en MongoDB
  nombre: string // Título del taller
  descripcion: string // De qué va
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM
  lugar: string // Dónde es
  categoria: string // Ej: tecnologia, habilidades-blandas
  tipo: string // Ej: curso técnico, capacitación
  instructor?: string // Quién lo da
  rating?: number // 0-5 estrellas
  cupo: number // Máximo de gente
  cupos_disponibles?: number // Lugares libres
  creado_en?: string | null
  actualizado_en?: string | null
  inscripciones?: Inscripcion[] // Gente inscrita
}

// Un estudiante del sistema
export type Estudiante = {
  _id: string // ID en MongoDB
  nombre: string // Nombre completo
  email: string // Correo
  creado_en?: string // Cuándo se registró
}