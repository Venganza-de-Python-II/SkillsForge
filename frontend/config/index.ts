/**
 * Exportación centralizada de configuraciones
 */

export * from './constants';

/**
 * Configuración de entorno
 */
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * Obtener configuración de la API
 */
export function getApiConfig() {
  return {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
  };
}

/**
 * Obtener configuración de AWS (si se usa)
 */
export function getAwsConfig() {
  return {
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
    userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
  };
}
