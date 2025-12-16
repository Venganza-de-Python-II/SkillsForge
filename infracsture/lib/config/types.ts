/**
 * Configuración de entorno para la infraestructura
 */
export interface EnvironmentConfig {
  /** Nombre del entorno (dev, prod) */
  environment: 'dev' | 'prod';

  /** Región de AWS */
  region: string;

  /** ID de cuenta de AWS */
  account?: string;

  /** Prefijo para nombres de recursos */
  resourcePrefix: string;

  /** Tags comunes para todos los recursos */
  tags: Record<string, string>;

  /** Configuración de DynamoDB */
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
    pointInTimeRecovery: boolean;
    removalPolicy: 'DESTROY' | 'RETAIN' | 'SNAPSHOT';
  };

  /** Configuración de Lambda */
  lambda: {
    runtime: string;
    timeout: number;
    memorySize: number;
    reservedConcurrentExecutions?: number;
    tracing: boolean;
  };

  /** Configuración de API Gateway */
  apiGateway: {
    throttle: {
      rateLimit: number;
      burstLimit: number;
    };
    caching: boolean;
    cacheTtl: number;
  };

  /** Configuración de Cognito */
  cognito: {
    domainPrefix: string;
    passwordPolicy: {
      minLength: number;
      requireLowercase: boolean;
      requireUppercase: boolean;
      requireDigits: boolean;
      requireSymbols: boolean;
    };
    mfaConfiguration: 'OFF' | 'OPTIONAL' | 'REQUIRED';
  };

  /** Configuración de CloudFront */
  cloudfront: {
    priceClass: string;
    minTtl: number;
    defaultTtl: number;
    maxTtl: number;
    domainName?: string;
    certificateArn?: string;
  };

  /** Configuración de notificaciones */
  notifications: {
    adminEmail: string;
    sesVerifiedEmail?: string;
    snsTopicName: string;
  };

  /** Configuración de monitoreo */
  monitoring: {
    alarmEmail: string;
    logRetentionDays: number;
    enableXRay: boolean;
    enableDetailedMetrics: boolean;
  };

  /** Configuración de WAF */
  waf: {
    enabled: boolean;
    rateLimit: number;
    ipWhitelist?: string[];
  };

  /** Configuración de CI/CD */
  cicd?: {
    enabled: boolean;
    repositoryName?: string;
    branchName?: string;
  };
}
