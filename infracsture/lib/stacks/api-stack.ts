import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import * as path from 'path';

export interface ApiStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  table: dynamodb.Table;
  userPool: cognito.UserPool;
  userPoolClientId: string;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly apiUrl: string;
  public readonly lambdaFunctions: lambda.Function[];

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { config, table, userPool, userPoolClientId } = props;
    this.lambdaFunctions = [];

    // Lambda Layer compartido con dependencias
    const commonLayer = new lambda.LayerVersion(this, 'CommonLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend-services/shared')),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: 'Common dependencies for Lambda functions',
    });

    // Variables de entorno comunes
    const commonEnv = {
      TABLE_NAME: table.tableName,
      USER_POOL_ID: userPool.userPoolId,
      CLIENT_ID: userPoolClientId,
      ENVIRONMENT: config.environment,
      LOG_LEVEL: 'INFO',
      POWERTOOLS_SERVICE_NAME: 'SkillsForge',
    };

    // Función helper para crear Lambdas con blue/green deployment
    const createLambda = (name: string, handler: string, description: string) => {
      const fn = new lambda.Function(this, name, {
        functionName: `${config.resourcePrefix}-${name}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler,
        code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend-services/functions')),
        timeout: cdk.Duration.seconds(config.lambda.timeout),
        memorySize: config.lambda.memorySize,
        environment: commonEnv,
        layers: [commonLayer],
        tracing: config.lambda.tracing ? lambda.Tracing.ACTIVE : lambda.Tracing.DISABLED,
        logRetention: logs.RetentionDays.ONE_WEEK,
        description,
      });

      // Permisos DynamoDB
      table.grantReadWriteData(fn);

      // Blue/Green Deployment para producción
      if (config.environment === 'prod') {
        // Versión automática
        const version = fn.currentVersion;

        // Alias "live" para producción
        const alias = new lambda.Alias(this, `${name}Alias`, {
          aliasName: 'live',
          version: version,
          description: `Live alias for ${name}`,
        });

        // Alarma de errores para rollback automático
        const errorAlarm = new cloudwatch.Alarm(this, `${name}ErrorAlarm`, {
          metric: fn.metricErrors(),
          threshold: 5,
          evaluationPeriods: 2,
          comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
          alarmDescription: `Errors for ${name} Lambda`,
        });

        // CodeDeploy Deployment Group con Canary
        new codedeploy.LambdaDeploymentGroup(this, `${name}DeploymentGroup`, {
          alias: alias,
          deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,
          alarms: [errorAlarm],
          autoRollback: {
            failedDeployment: true,
            stoppedDeployment: true,
            deploymentInAlarm: true,
          },
        });
      }

      this.lambdaFunctions.push(fn);
      return fn;
    };

    // Lambda para endpoint raíz
    const rootLambda = createLambda('Root', 'root.handler', 'API root info');

    // Lambdas de autenticación
    const loginLambda = createLambda('Login', 'auth/login.handler', 'Admin login');
    const registerLambda = createLambda('Register', 'auth/register.handler', 'Student registration');
    const refreshLambda = createLambda('Refresh', 'auth/refresh.handler', 'Token refresh');

    // Lambdas de talleres
    const listWorkshopsLambda = createLambda('ListWorkshops', 'workshops/list.handler', 'List workshops');
    const getWorkshopLambda = createLambda('GetWorkshop', 'workshops/get.handler', 'Get workshop details');
    const createWorkshopLambda = createLambda('CreateWorkshop', 'workshops/create.handler', 'Create workshop');
    const updateWorkshopLambda = createLambda('UpdateWorkshop', 'workshops/update.handler', 'Update workshop');
    const deleteWorkshopLambda = createLambda('DeleteWorkshop', 'workshops/delete.handler', 'Delete workshop');
    
    // Lambdas de estadísticas y categorías
    const statsLambda = createLambda('Stats', 'workshops/stats.handler', 'Platform statistics');
    const categoriesLambda = createLambda('Categories', 'workshops/categories.handler', 'Workshop categories');

    // Lambdas de inscripciones
    const registerStudentLambda = createLambda('RegisterStudent', 'registrations/register.handler', 'Register to workshop');
    const unregisterStudentLambda = createLambda('UnregisterStudent', 'registrations/unregister.handler', 'Unregister from workshop');
    const listMyRegistrationsLambda = createLambda('ListMyRegistrations', 'registrations/list_mine.handler', 'List my registrations');

    // Lambda de Asistente IA con Bedrock
    const aiAssistantLambda = createLambda('AIAssistant', 'ai/assistant.handler', 'AI Assistant powered by Bedrock');
    
    // Permisos de Bedrock para el asistente IA
    aiAssistantLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
      ],
      resources: [
        'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0',
      ],
    }));

    // Permisos adicionales para Cognito
    [loginLambda, registerLambda, refreshLambda].forEach(fn => {
      fn.addToRolePolicy(new iam.PolicyStatement({
        actions: [
          'cognito-idp:AdminInitiateAuth',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminSetUserPassword',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminUpdateUserAttributes',
        ],
        resources: [userPool.userPoolArn],
      }));
    });

    // API Gateway
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: `${config.resourcePrefix}-API`,
      description: 'SkillsForge REST API',
      deployOptions: {
        stageName: config.environment,
        tracingEnabled: config.lambda.tracing,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingRateLimit: config.apiGateway.throttle.rateLimit,
        throttlingBurstLimit: config.apiGateway.throttle.burstLimit,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
        exposeHeaders: ['Content-Type', 'X-Amzn-RequestId'],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Gateway Responses para errores 4XX y 5XX con headers CORS
    // Esto es CRÍTICO para que los errores del authorizer incluyan CORS headers
    this.api.addGatewayResponse('Default4XX', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    this.api.addGatewayResponse('Default5XX', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    this.api.addGatewayResponse('Unauthorized', {
      type: apigateway.ResponseType.UNAUTHORIZED,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    this.api.addGatewayResponse('ExpiredToken', {
      type: apigateway.ResponseType.EXPIRED_TOKEN,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'",
        'Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
      },
    });

    // Cognito Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
      cognitoUserPools: [userPool],
      authorizerName: 'CognitoAuthorizer',
      identitySource: 'method.request.header.Authorization',
    });

    // Endpoint de información de la API (público)
    const apiInfo = this.api.root.addResource('api', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    apiInfo.addMethod('GET', new apigateway.LambdaIntegration(rootLambda));

    // Endpoints públicos
    const auth = this.api.root.addResource('auth', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    auth.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(loginLambda));

    const estudiantes = auth.addResource('estudiantes', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    estudiantes.addResource('registro').addMethod('POST', new apigateway.LambdaIntegration(registerLambda));
    estudiantes.addResource('login').addMethod('POST', new apigateway.LambdaIntegration(loginLambda));

    auth.addResource('refresh').addMethod('POST', new apigateway.LambdaIntegration(refreshLambda));

    // Endpoints de talleres
    const workshops = this.api.root.addResource('workshops', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    workshops.addMethod('GET', new apigateway.LambdaIntegration(listWorkshopsLambda));
    workshops.addMethod('POST', new apigateway.LambdaIntegration(createWorkshopLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const workshop = workshops.addResource('{id}', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    workshop.addMethod('GET', new apigateway.LambdaIntegration(getWorkshopLambda));
    workshop.addMethod('PUT', new apigateway.LambdaIntegration(updateWorkshopLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    workshop.addMethod('DELETE', new apigateway.LambdaIntegration(deleteWorkshopLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const register = workshop.addResource('register', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    register.addMethod('POST', new apigateway.LambdaIntegration(registerStudentLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    register.addMethod('DELETE', new apigateway.LambdaIntegration(unregisterStudentLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Endpoints de inscripciones
    const registrations = this.api.root.addResource('registrations', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    registrations.addResource('me').addMethod('GET', new apigateway.LambdaIntegration(listMyRegistrationsLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // Endpoint de estadísticas (público)
    const stats = this.api.root.addResource('stats', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    stats.addMethod('GET', new apigateway.LambdaIntegration(statsLambda));

    // Endpoint de categorías (público)
    const categories = this.api.root.addResource('categories', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    categories.addMethod('GET', new apigateway.LambdaIntegration(categoriesLambda));

    // Endpoint de Asistente IA (requiere autenticación)
    const ai = this.api.root.addResource('ai', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
    });
    ai.addResource('assistant').addMethod('POST', new apigateway.LambdaIntegration(aiAssistantLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    this.apiUrl = this.api.url;

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'API Gateway URL',
      exportName: `${config.resourcePrefix}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
    });
  }
}
