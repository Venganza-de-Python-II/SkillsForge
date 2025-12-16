#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { getConfig } from '../lib/config';
import { DataStack } from '../lib/stacks/data-stack';
import { AuthStack } from '../lib/stacks/auth-stack';
import { ApiStack } from '../lib/stacks/api-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';
import { EventsStack } from '../lib/stacks/events-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { SecurityStack } from '../lib/stacks/security-stack';
import { PipelineStack } from '../lib/stacks/pipeline-stack';

// Cargar variables de entorno
dotenv.config();

const app = new cdk.App();

// Obtener configuración del entorno
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';
const config = getConfig(environment);

console.log(`Desplegando SkillsForge en entorno: ${config.environment}`);
console.log(`Región: ${config.region}`);

// Configuración de cuenta y región
const env = {
  account: config.account || process.env.CDK_DEFAULT_ACCOUNT,
  region: config.region || process.env.CDK_DEFAULT_REGION,
};

// Tags comunes para todos los stacks
const commonTags = config.tags;

/**
 * Stack 1: Seguridad (WAF, Secrets Manager)
 * Debe desplegarse primero para que otros stacks usen los secretos
 */
const securityStack = new SecurityStack(app, `${config.resourcePrefix}-SecurityStack`, {
  env,
  config,
  description: 'Security resources: WAF, Secrets Manager, IAM policies',
});

/**
 * Stack 2: Base de Datos (DynamoDB)
 * Tabla única con diseño PK/SK + GSI
 */
const dataStack = new DataStack(app, `${config.resourcePrefix}-DataStack`, {
  env,
  config,
  description: 'Data layer: DynamoDB table with GSI indexes',
});

/**
 * Stack 3: Autenticación (Cognito)
 * User Pool para estudiantes y administradores
 */
const authStack = new AuthStack(app, `${config.resourcePrefix}-AuthStack`, {
  env,
  config,
  description: 'Authentication: Cognito User Pool and App Client',
});

/**
 * Stack 4: API (API Gateway + Lambda)
 * REST API con Cognito Authorizer
 */
const apiStack = new ApiStack(app, `${config.resourcePrefix}-ApiStack`, {
  env,
  config,
  table: dataStack.table,
  userPool: authStack.userPool,
  userPoolClientId: authStack.userPoolClient.userPoolClientId,
  description: 'API layer: API Gateway, Lambda functions, Cognito Authorizer',
});

/**
 * Stack 5: Frontend (S3 + CloudFront)
 * Hosting estático con CDN
 */
const frontendStack = new FrontendStack(app, `${config.resourcePrefix}-FrontendStack`, {
  env,
  config,
  apiUrl: apiStack.apiUrl,
  userPoolId: authStack.userPool.userPoolId,
  userPoolClientId: authStack.userPoolClient.userPoolClientId,
  wafWebAcl: securityStack.cloudfrontWebAcl,
  description: 'Frontend: S3 bucket, CloudFront distribution with WAF',
});

/**
 * Stack 6: Eventos (EventBridge + SNS/SES)
 * Bus de eventos y notificaciones
 */
const eventsStack = new EventsStack(app, `${config.resourcePrefix}-EventsStack`, {
  env,
  config,
  table: dataStack.table,
  description: 'Events: EventBridge bus, SNS topics, SES configuration, Scheduler',
});

/**
 * Stack 7: Monitoreo (CloudWatch)
 * Logs, métricas, alarmas y dashboards
 */
const monitoringStack = new MonitoringStack(app, `${config.resourcePrefix}-MonitoringStack`, {
  env,
  config,
  api: apiStack.api,
  table: dataStack.table,
  distribution: frontendStack.distribution,
  lambdaFunctions: apiStack.lambdaFunctions,
  description: 'Monitoring: CloudWatch Logs, Metrics, Alarms, Dashboards, X-Ray',
});

// Aplicar tags comunes a todos los stacks
Object.entries(commonTags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value)
});

// Outputs globales (nota: los outputs de Cognito y API están en sus respectivos stacks para evitar duplicados)
new cdk.CfnOutput(securityStack, 'Environment', {
  value: config.environment,
  description: 'Deployment environment',
});

new cdk.CfnOutput(frontendStack, 'ApplicationUrl', {
  value: frontendStack.distributionDomainName,
  description: 'Main application URL',
  exportName: `${config.resourcePrefix}-AppUrl`,
});

/**
 * Stack 8: CI/CD Pipeline (CodePipeline) - Opcional
 * Pipeline automático con CodeCommit, CodeBuild y CodeDeploy
 * Solo se despliega si está habilitado en la configuración
 */
if (config.cicd && config.cicd.enabled) {
  new PipelineStack(app, `${config.resourcePrefix}-PipelineStack`, {
    env,
    config,
    description: 'CI/CD Pipeline: CodeCommit, CodeBuild, CodeDeploy',
  });
}

// Sintetizar la aplicación
app.synth();
