import { EnvironmentConfig } from './types';

/**
 * Configuración para entorno de producción
 */
export const prodConfig: EnvironmentConfig = {
  environment: 'prod',
  region: process.env.AWS_REGION || 'us-east-1',
  account: process.env.AWS_ACCOUNT_ID,
  resourcePrefix: 'SkillsForge-Prod',
  
  tags: {
    Project: 'SkillsForge',
    Environment: 'Production',
    ManagedBy: 'CDK',
    CostCenter: 'Production',
    Compliance: 'Required',
  },
  
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST',
    pointInTimeRecovery: true, // Backup automático
    removalPolicy: 'RETAIN', // No eliminar en prod
  },
  
  lambda: {
    runtime: 'python3.11',
    timeout: 30,
    memorySize: 1024,
    reservedConcurrentExecutions: 100,
    tracing: true,
  },
  
  apiGateway: {
    throttle: {
      rateLimit: 1000,
      burstLimit: 2000,
    },
    caching: true,
    cacheTtl: 300,
  },
  
  cognito: {
    domainPrefix: process.env.COGNITO_DOMAIN_PREFIX || 'skillsforge-prod',
    passwordPolicy: {
      minLength: 12,
      requireLowercase: true,
      requireUppercase: true,
      requireDigits: true,
      requireSymbols: true,
    },
    mfaConfiguration: 'OPTIONAL',
  },
  
  cloudfront: {
    priceClass: 'PriceClass_All', // Global
    minTtl: 0,
    defaultTtl: 86400,
    maxTtl: 31536000,
    domainName: process.env.DOMAIN_NAME,
    certificateArn: process.env.CERTIFICATE_ARN,
  },
  
  notifications: {
    adminEmail: process.env.ADMIN_EMAIL || 'admin@skillsforge.com',
    sesVerifiedEmail: process.env.SES_VERIFIED_EMAIL || 'noreply@skillsforge.com',
    snsTopicName: 'SkillsForge-Prod-Notifications',
  },
  
  monitoring: {
    alarmEmail: process.env.ALARM_EMAIL || 'alerts@skillsforge.com',
    logRetentionDays: 90,
    enableXRay: true,
    enableDetailedMetrics: true,
  },
  
  waf: {
    enabled: true,
    rateLimit: 10000,
    ipWhitelist: process.env.IP_WHITELIST?.split(','),
  },
};
