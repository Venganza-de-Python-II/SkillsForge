import { EnvironmentConfig } from './types';

/**
 * Configuración para entorno de desarrollo
 */
export const devConfig: EnvironmentConfig = {
  environment: 'dev',
  region: process.env.AWS_REGION || 'us-east-1',
  account: process.env.AWS_ACCOUNT_ID,
  resourcePrefix: 'SkillsForge-Dev',
  
  tags: {
    Project: 'SkillsForge',
    Environment: 'Development',
    ManagedBy: 'CDK',
    CostCenter: 'Engineering',
  },
  
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST',
    pointInTimeRecovery: false,
    removalPolicy: 'DESTROY', // Permite eliminar en dev
  },
  
  lambda: {
    runtime: 'python3.11',
    timeout: 30,
    memorySize: 512,
    tracing: true,
  },
  
  apiGateway: {
    throttle: {
      rateLimit: 100,
      burstLimit: 200,
    },
    caching: false,
    cacheTtl: 300,
  },
  
  cognito: {
    domainPrefix: process.env.COGNITO_DOMAIN_PREFIX || 'skillsforge-dev',
    passwordPolicy: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireDigits: true,
      requireSymbols: false,
    },
    mfaConfiguration: 'OFF',
  },
  
  cloudfront: {
    priceClass: 'PriceClass_100', // Solo NA y Europa
    minTtl: 0,
    defaultTtl: 86400, // 1 día
    maxTtl: 31536000, // 1 año
  },
  
  notifications: {
    adminEmail: process.env.ADMIN_EMAIL || 'admin@skillsforge.local',
    sesVerifiedEmail: process.env.SES_VERIFIED_EMAIL,
    snsTopicName: 'SkillsForge-Dev-Notifications',
  },
  
  monitoring: {
    alarmEmail: process.env.ALARM_EMAIL || 'alerts@skillsforge.local',
    logRetentionDays: 7,
    enableXRay: true,
    enableDetailedMetrics: true,
  },
  
  waf: {
    enabled: true,
    rateLimit: 2000,
  },
};

