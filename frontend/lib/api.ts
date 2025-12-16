import { getApiConfig } from './config';

// URL base de la API
const API_BASE = getApiConfig().baseUrl

// Opciones para peticiones HTTP
type Opciones = {
  // Método HTTP (GET por defecto)
  metodo?: "GET" | "POST" | "PUT" | "DELETE"
  // Body de la petición (se convierte a JSON solo)
  cuerpo?: any
  // Token JWT (opcional)
  token?: string | null
  // Headers extra
  headers?: Record<string, string>
}

// Hace peticiones a la API con reintentos, manejo de 401, rate limiting, etc.
export async function apiFetch(ruta: string, opciones: Opciones = {}, intento: number = 0): Promise<any> {
  const {
    metodo = "GET",
    cuerpo,
    token,
    headers: extraHeaders = {}
  } = opciones

  const headers: Record<string, string> = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...extraHeaders
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(`${API_BASE}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
    })
  } catch (e: any) {
    // Si falla la red, reintentamos
    if (intento < 2) {
      console.warn(`Error de red. Reintentando (${intento + 1}/3)...`)
      await esperar(1000 * (intento + 1))
      return apiFetch(ruta, opciones, intento + 1)
    }
    const err = new Error("No se pudo conectar con el servidor.")
      ; (err as any).cause = e
    throw err
  }

  // Parseamos la respuesta (JSON o texto)
  const contentType = res.headers.get("content-type") || ""
  let parsed: any = null
  let rawText: string | null = null
  if (contentType.includes("application/json")) {
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }
  } else {
    try {
      rawText = await res.text()
    } catch {
      rawText = null
    }
  }

  // Si nos limitan (429), esperamos y reintentamos
  if (res.status === 429 && intento < 3) {
    const retryAfter = res.headers.get("Retry-After") || parsed?.reintentar_en || parsed?.retry_after
    const esperaMs = calcularEsperaRateLimit(intento, retryAfter)
    console.warn(`Rate limit alcanzado. Reintentando en ${esperaMs}ms (intento ${intento + 1}/3)`)
    await esperar(esperaMs)
    return apiFetch(ruta, opciones, intento + 1)
  }

  // Si el token expiró (401), intentamos refrescarlo
  if (res.status === 401) {
    const mensaje = (parsed?.mensaje || parsed?.message || "").toLowerCase()
    const expiro = mensaje.includes("expir") || mensaje.includes("inválido") || mensaje.includes("invalid")
    if (expiro && intento < 1) {
      const refreshed = await intentarRefreshToken()
      if (refreshed) {
        return apiFetch(ruta, opciones, intento + 1)
      }
      // Token inválido, limpiamos todo
      limpiarTokenAdmin()
      limpiarTokenEstudiante()
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:token-expired"))
      }
    }
  }

  // Si hay error HTTP, lanzamos excepción con mensaje amigable
  if (!res.ok) {
    const status = res.status
    const backend =
      parsed?.mensaje ||
      parsed?.message ||
      parsed?.error ||
      rawText ||
      `HTTP ${status}`

    const publico = mapearMensajePublico(status, backend)
    const error = new Error(publico)
      ; (error as any).status = status
      ; (error as any).backend = backend
      ; (error as any)._debug = { ruta, status, intento }
    throw error
  }

  // AWS devuelve {workshops: [...]} y nosotros queremos solo el array
  if (parsed !== null) {
    // Sacamos el array de workshops si viene envuelto
    if (parsed.workshops && Array.isArray(parsed.workshops)) {
      return parsed.workshops;
    }
    // O si viene en 'data'
    if (parsed.data !== undefined) {
      return parsed.data;
    }
    // Si no, devolvemos tal cual
    return parsed;
  }
  return rawText;
}

// Convierte errores HTTP a mensajes entendibles
function mapearMensajePublico(status: number, backend: string): string {
  // 400: mostramos el mensaje del backend
  if (status === 400) {
    // Limpiamos mensajes feos de Cognito
    if (backend.includes('InvalidPasswordException')) {
      return 'La contraseña no cumple los requisitos. Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.'
    }
    return backend || "Por favor verifica los datos ingresados."
  }
  if (status === 401) return "Las credenciales son incorrectas. Verifica tu email y contraseña."
  if (status === 403) return "No tienes permisos para realizar esta acción."
  if (status === 404) return "No se encontró el recurso solicitado."
  if (status === 409) {
    // 409: conflictos (email ya existe, etc)
    const backendLower = backend.toLowerCase()
    if (backendLower.includes('email') && backendLower.includes('registrado')) {
      return "Este correo electrónico ya tiene una cuenta registrada. ¿Quizás quieres iniciar sesión?"
    }
    if (backendLower.includes('ya está inscrito') || backendLower.includes('ya registrado')) {
      return "Ya estás inscrito en este taller."
    }
    return backend || "Este registro ya existe. Intenta con otros datos."
  }
  if (status === 422) return "Los datos ingresados no son válidos. Por favor revísalos."
  if (status === 429) return "Has realizado muchas solicitudes. Espera un momento e intenta de nuevo."
  if (status >= 500) return "Hubo un problema en el servidor. Intenta de nuevo en unos minutos."
  return backend || "Ocurrió un error inesperado. Intenta de nuevo."
}

// Calcula cuánto esperar antes de reintentar (backoff exponencial)
function calcularEsperaRateLimit(intento: number, retryAfter?: string | null): number {
  let base = 1000 * Math.pow(2, intento) // 1s, 2s, 4s
  if (retryAfter) {
    const num = parseInt(retryAfter, 10)
    if (!isNaN(num)) {
      if (retryAfter.includes("min")) base = Math.max(base, num * 60000)
      else base = Math.max(base, num * 1000)
    }
  }
  return base
}

// Sleep básico
function esperar(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// Decodifica un JWT y devuelve el payload
export function decodificarToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Padding para base64
    let payload = parts[1]
    const padding = 4 - (payload.length % 4)
    if (padding !== 4) {
      payload += '='.repeat(padding)
    }
    const decoded = JSON.parse(atob(payload))
    return decoded
  } catch {
    return null
  }
}

// Checa si el token es válido y no expiró
export function tokenValido(token: string | null): boolean {
  if (!token) return false
  const payload = decodificarToken(token)
  if (!payload) return false
  // Verificamos expiración
  if (payload.exp) {
    const ahora = Math.floor(Date.now() / 1000)
    if (payload.exp < ahora) return false
  }
  return true
}

// Saca el rol del token (compatible con Cognito)
export function obtenerRolDeToken(token: string | null): string | null {
  if (!token) return null
  const payload = decodificarToken(token)
  if (!payload) return null

  // Buscamos en varios lugares porque Cognito es raro
  const rol = payload['custom:role'] || payload.rol || payload.role
  if (rol) return rol

  // También checamos grupos de Cognito
  const groups = payload['cognito:groups'] || []
  if (Array.isArray(groups)) {
    if (groups.includes('admin') || groups.includes('admins')) return 'admin'
    if (groups.includes('student') || groups.includes('students') || groups.includes('estudiantes')) return 'student'
  }

  return null
}

// ¿Es token de admin?
export function esTokenAdmin(token: string | null): boolean {
  if (!token) return false
  if (!tokenValido(token)) return false
  const rol = obtenerRolDeToken(token)
  return rol === 'admin'
}

// ¿Es token de estudiante?
export function esTokenEstudiante(token: string | null): boolean {
  if (!token) return false
  if (!tokenValido(token)) return false
  const rol = obtenerRolDeToken(token)
  return rol === 'student' || rol === 'estudiante'
}

// Token de admin del localStorage
export function obtenerTokenAdmin(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token_admin")
}

// Guarda token de admin
export function guardarTokenAdmin(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("token_admin", token)
}

// Limpia tokens de admin
export function limpiarTokenAdmin() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token_admin")
  localStorage.removeItem("refresh_token_admin")
}

// Refresh token de admin
export function obtenerRefreshTokenAdmin(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token_admin")
}

// Guarda refresh token de admin
export function guardarRefreshTokenAdmin(refreshToken: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("refresh_token_admin", refreshToken)
}

// Token de estudiante del localStorage
export function obtenerTokenEstudiante(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token_estudiante")
}

// Guarda token de estudiante
export function guardarTokenEstudiante(token: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("token_estudiante", token)
}

// Limpia tokens de estudiante
export function limpiarTokenEstudiante() {
  if (typeof window === "undefined") return
  localStorage.removeItem("token_estudiante")
  localStorage.removeItem("refresh_token_estudiante")
}

// Refresh token de estudiante
export function obtenerRefreshTokenEstudiante(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("refresh_token_estudiante")
}

// Guarda refresh token de estudiante
export function guardarRefreshTokenEstudiante(refreshToken: string) {
  if (typeof window === "undefined") return
  localStorage.setItem("refresh_token_estudiante", refreshToken)
}

// Intenta refrescar el token (primero estudiante, luego admin)
async function intentarRefreshToken(): Promise<boolean> {
  try {
    let refresh = obtenerRefreshTokenEstudiante()
    if (refresh && await refreshGenerico(refresh, "estudiante")) return true
    refresh = obtenerRefreshTokenAdmin()
    if (refresh && await refreshGenerico(refresh, "admin")) return true
    return false
  } catch (e) {
    console.error("Error refrescando token:", e)
    return false
  }
}

// Hace el refresh del token según el tipo de usuario
async function refreshGenerico(refreshToken: string, tipo: "admin" | "estudiante"): Promise<boolean> {
  const resp = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  if (!resp.ok) return false
  let data: any
  try {
    data = await resp.json()
  } catch {
    return false
  }
  if (!data?.token) return false
  if (tipo === "admin") {
    guardarTokenAdmin(data.token)
    if (data.refresh_token) guardarRefreshTokenAdmin(data.refresh_token)
  } else {
    guardarTokenEstudiante(data.token)
    if (data.refresh_token) guardarRefreshTokenEstudiante(data.refresh_token)
  }
  return true
}

// Stats públicas
export async function obtenerStatsPublicas() {
  return apiFetch("/stats")
}

// Lista de categorías
export async function obtenerCategorias() {
  return apiFetch("/categories")
}

// URL base para usar en otros archivos
export const API_BASE_URL = API_BASE

// Checa si la API está configurada
export function isApiConfigured(): boolean {
  return Boolean(API_BASE && API_BASE.length > 0);
}

// Info de configuración de la API
export function getApiInfo() {
  return {
    baseUrl: API_BASE,
    configured: isApiConfigured(),
    environment: process.env.NODE_ENV,
  };
}
