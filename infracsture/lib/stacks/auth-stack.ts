import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

export interface AuthStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

/**
 * Stack de autenticación con Amazon Cognito
 * 
 * Características:
 * - User Pool para estudiantes y administradores
 * - Atributos personalizados (role: student|admin)
 * - Políticas de contraseña configurables
 * - MFA opcional
 */
export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const { config } = props;

    // User Pool principal
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${config.resourcePrefix}-UserPool`,

      // Atributos de sign-in
      signInAliases: {
        email: true,
        username: false,
      },

      // Atributos estándar requeridos
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        fullname: {
          required: true,
          mutable: true,
        },
      },

      // Atributos personalizados
      customAttributes: {
        role: new cognito.StringAttribute({
          minLen: 5,
          maxLen: 10,
          mutable: true,
        }),
      },

      // Política de contraseñas
      passwordPolicy: {
        minLength: config.cognito.passwordPolicy.minLength,
        requireLowercase: config.cognito.passwordPolicy.requireLowercase,
        requireUppercase: config.cognito.passwordPolicy.requireUppercase,
        requireDigits: config.cognito.passwordPolicy.requireDigits,
        requireSymbols: config.cognito.passwordPolicy.requireSymbols,
        tempPasswordValidity: cdk.Duration.days(3),
      },

      // MFA
      mfa: config.cognito.mfaConfiguration === 'REQUIRED'
        ? cognito.Mfa.REQUIRED
        : config.cognito.mfaConfiguration === 'OPTIONAL'
          ? cognito.Mfa.OPTIONAL
          : cognito.Mfa.OFF,

      mfaSecondFactor: {
        sms: true,
        otp: true,
      },

      // Verificación de cuenta
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },

      // Emails de verificación
      userVerification: {
        emailSubject: 'Verifica tu cuenta en SkillsForge',
        emailBody: 'Gracias por registrarte en SkillsForge. Tu código de verificación es {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },

      // Invitación de usuarios
      userInvitation: {
        emailSubject: 'Invitación a SkillsForge',
        emailBody: 'Has sido invitado a SkillsForge. Tu usuario es {username} y tu contraseña temporal es {####}',
      },

      // Recuperación de cuenta
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // Política de eliminación
      removalPolicy: config.environment === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // App Client para la aplicación web
    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `${config.resourcePrefix}-WebClient`,

      // Flujos de autenticación
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
        adminUserPassword: true,
      },

      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          'http://localhost:3000/callback',
          'https://localhost:3000/callback',
        ],
        logoutUrls: [
          'http://localhost:3000',
          'https://localhost:3000',
        ],
      },

      // Tokens
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),

      // Prevenir secreto de cliente (para apps públicas)
      generateSecret: false,

      // Atributos de lectura/escritura
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          emailVerified: true,
          fullname: true,
        })
        .withCustomAttributes('role'),

      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          fullname: true,
        })
        .withCustomAttributes('role'),
    });

    // Dominio de Cognito para Hosted UI
    this.userPoolDomain = new cognito.UserPoolDomain(this, 'UserPoolDomain', {
      userPool: this.userPool,
      cognitoDomain: {
        domainPrefix: config.cognito.domainPrefix,
      },
    });

    // Grupos de usuarios
    const adminGroup = new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Admins',
      description: 'Administrators with full access',
      precedence: 1,
    });

    const studentGroup = new cognito.CfnUserPoolGroup(this, 'StudentGroup', {
      userPoolId: this.userPool.userPoolId,
      groupName: 'Students',
      description: 'Students with limited access',
      precedence: 10,
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${config.resourcePrefix}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${config.resourcePrefix}-UserPoolArn`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito App Client ID',
      exportName: `${config.resourcePrefix}-ClientId`,
    });

    // Export Provider Name for cross-stack references (required by CDK)
    new cdk.CfnOutput(this, 'UserPoolProviderName', {
      value: this.userPool.userPoolProviderName,
      description: 'Cognito User Pool Provider Name',
      exportName: `${this.stackName}:ExportsOutputFnGetAttUserPool6BA7E5F2ProviderNameA3E1F80D`,
    });

    new cdk.CfnOutput(this, 'UserPoolDomainUrl', {
      value: `https://${config.cognito.domainPrefix}.auth.${config.region}.amazoncognito.com`,
      description: 'Cognito Hosted UI URL',
    });

    new cdk.CfnOutput(this, 'AdminGroupName', {
      value: adminGroup.groupName || 'Admins',
      description: 'Admin group name',
    });

    new cdk.CfnOutput(this, 'StudentGroupName', {
      value: studentGroup.groupName || 'Students',
      description: 'Student group name',
    });
  }
}