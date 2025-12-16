import { EnvironmentConfig } from './types';
import { devConfig } from './dev';
import { prodConfig } from './prod';

/**
 * Obtiene la configuración según el entorno
 */
export function getConfig(environment?: string): EnvironmentConfig {
  const env = environment || process.env.ENVIRONMENT || 'dev';
  
  switch (env) {
    case 'prod':
    case 'production':
      return prodConfig;
    case 'dev':
    case 'development':
    default:
      return devConfig;
  }
}

export { EnvironmentConfig } from './types';
export { devConfig } from './dev';
export { prodConfig } from './prod';
