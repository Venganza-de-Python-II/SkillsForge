// Constantes de configuración de la app

// Config de la API
export const API_CONFIG = {
  // URL del backend (AWS API Gateway)
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://qt6hwpaad0.execute-api.us-east-1.amazonaws.com/dev',
  TIMEOUT: 30000, // 30 segundos
  MAX_RETRIES: 3,
} as const;

// Config de auth
export const AUTH_CONFIG = {
  TOKEN_KEY: 'auth_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'user_data',
  TOKEN_EXPIRY: 3600000, // 1 hora en ms
} as const;

// Tipos de usuarios
export const USER_ROLES = {
  ADMIN: 'admin',
  STUDENT: 'estudiante',
  INSTRUCTOR: 'instructor',
} as const;

// Estados posibles de un taller
export const WORKSHOP_STATUS = {
  DRAFT: 'borrador',
  PUBLISHED: 'publicado',
  COMPLETED: 'completado',
  CANCELLED: 'cancelado',
} as const;

// Estados de inscripción
export const REGISTRATION_STATUS = {
  PENDING: 'pendiente',
  CONFIRMED: 'confirmado',
  CANCELLED: 'cancelado',
  ATTENDED: 'asistio',
  NO_SHOW: 'no_asistio',
} as const;

// Rutas de la app
export const ROUTES = {
  HOME: '/',
  LOGIN: '/estudiantes/login',
  ADMIN_LOGIN: '/admin/login',
  WORKSHOPS: '/estudiantes/talleres',
  MY_REGISTRATIONS: '/estudiantes/mis-registros',
  REGISTER: '/estudiantes/registro',
  ADMIN_DASHBOARD: '/admin',
  ADMIN_STUDENTS: '/admin/estudiantes',
} as const;

// Paginación
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
} as const;

// Mensajes de error
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error del servidor. Por favor, intenta más tarde.',
  VALIDATION_ERROR: 'Por favor, verifica los datos ingresados.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
} as const;

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  LOGIN: 'Inicio de sesión exitoso',
  REGISTER: 'Registro exitoso',
  UPDATE: 'Actualización exitosa',
  DELETE: 'Eliminación exitosa',
  WORKSHOP_CREATED: 'Taller creado exitosamente',
  REGISTRATION_SUCCESS: 'Inscripción realizada exitosamente',
  REGISTRATION_CANCELLED: 'Inscripción cancelada exitosamente',
} as const;
