/**
 * Configuración centralizada de la aplicación
 */

/**
 * Configuración de la API
 */
export const API_CONFIG = {
  /**
   * URL base de la API
   * En desarrollo: Variable de entorno o fallback local
   * En producción: Debe estar definida en NEXT_PUBLIC_API_URL
   */
  baseUrl: process.env.NEXT_PUBLIC_API_URL || '',
  
  /**
   * Timeout para requests (ms)
   */
  timeout: 30000,
  
  /**
   * Número máximo de reintentos
   */
  maxRetries: 3,
  
  /**
   * Habilitar logs de debug
   */
  debug: process.env.NODE_ENV === 'development',
} as const;

/**
 * Configuración de Cognito
 */
export const COGNITO_CONFIG = {
  /**
   * ID del User Pool de Cognito
   */
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
  
  /**
   * ID del cliente de la aplicación
   */
  clientId: process.env.NEXT_PUBLIC_CLIENT_ID || '',
  
  /**
   * Región de AWS
   */
  region: process.env.NEXT_PUBLIC_REGION || 'us-east-1',
} as const;

/**
 * Configuración de la aplicación
 */
export const APP_CONFIG = {
  /**
   * Nombre de la aplicación
   */
  name: 'SkillsForge',
  
  /**
   * Versión de la aplicación
   */
  version: '2.0.0',
  
  /**
   * Entorno actual
   */
  environment: process.env.NODE_ENV || 'development',
  
  /**
   * URL base de la aplicación
   */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'),
} as const;

/**
 * Validar configuración requerida
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // En producción, validar que todas las variables estén definidas
  if (process.env.NODE_ENV === 'production') {
    if (!API_CONFIG.baseUrl) {
      errors.push('NEXT_PUBLIC_API_URL no está definida');
    }
    if (!COGNITO_CONFIG.userPoolId) {
      errors.push('NEXT_PUBLIC_USER_POOL_ID no está definida');
    }
    if (!COGNITO_CONFIG.clientId) {
      errors.push('NEXT_PUBLIC_CLIENT_ID no está definida');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Obtener configuración de la API con validación
 */
export function getApiConfig() {
  if (!API_CONFIG.baseUrl) {
    console.warn(
      '⚠️  NEXT_PUBLIC_API_URL no está definida. ' +
      'Por favor configura las variables de entorno.'
    );
  }
  
  return API_CONFIG;
}

/**
 * Obtener configuración de Cognito con validación
 */
export function getCognitoConfig() {
  const validation = validateConfig();
  
  if (!validation.valid && process.env.NODE_ENV === 'production') {
    console.error('❌ Configuración inválida:', validation.errors);
  }
  
  return COGNITO_CONFIG;
}
