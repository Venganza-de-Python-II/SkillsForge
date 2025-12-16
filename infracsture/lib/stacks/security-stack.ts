import * as cdk from 'aws-cdk-lib';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

export interface SecurityStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

/**
 * Stack de seguridad con WAF y Secrets Manager
 * 
 * Características:
 * - WAF para CloudFront (us-east-1)
 * - WAF para API Gateway (regional)
 * - Reglas de rate limiting
 * - Protección contra ataques comunes
 * - Secrets Manager para credenciales
 */
export class SecurityStack extends cdk.Stack {
  public readonly cloudfrontWebAcl: wafv2.CfnWebACL;
  public readonly regionalWebAcl: wafv2.CfnWebACL;
  public readonly adminSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const { config } = props;

    if (config.waf.enabled) {
      // WAF para CloudFront (debe estar en us-east-1)
      this.cloudfrontWebAcl = new wafv2.CfnWebACL(this, 'CloudFrontWebACL', {
        name: `${config.resourcePrefix}-CloudFront-WAF`,
        scope: 'CLOUDFRONT',
        defaultAction: { allow: {} },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `${config.resourcePrefix}-CloudFront-WAF`,
        },
        customResponseBodies: {
          'rate-limit-response': {
            contentType: 'APPLICATION_JSON',
            content: '{"message":"Too Many Requests","code":429}'
          }
        },
        rules: [
          // Rate limiting por IP
          {
            name: 'RateLimitRule',
            priority: 1,
            statement: {
              rateBasedStatement: {
                limit: config.waf.rateLimit,
                aggregateKeyType: 'IP',
              },
            },
            action: {
              block: {
                customResponse: {
                  responseCode: 429,
                  customResponseBodyKey: 'rate-limit-response',
                },
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
          // Reglas administradas de AWS
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 2,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
                excludedRules: [],
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesCommonRuleSet',
            },
          },
          // Reglas administradas de AWS - Entradas Maliciosas Conocidas
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 3,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          // Reglas administradas de AWS - Inyección SQL
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 4,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesSQLiRuleSet',
            },
          },
        ],
      });

      // WAF Regional para API Gateway
      this.regionalWebAcl = new wafv2.CfnWebACL(this, 'RegionalWebACL', {
        name: `${config.resourcePrefix}-Regional-WAF`,
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `${config.resourcePrefix}-Regional-WAF`,
        },
        customResponseBodies: {
          'rate-limit-response': {
            contentType: 'APPLICATION_JSON',
            content: '{"message":"Too Many Requests","code":429}'
          }
        },
        rules: [
          // Rate limiting por IP
          {
            name: 'ApiRateLimitRule',
            priority: 1,
            statement: {
              rateBasedStatement: {
                limit: config.waf.rateLimit,
                aggregateKeyType: 'IP',
              },
            },
            action: {
              block: {
                customResponse: {
                  responseCode: 429,
                  customResponseBodyKey: 'rate-limit-response',
                },
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'ApiRateLimitRule',
            },
          },
          // Reglas administradas de AWS
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 2,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesCommonRuleSet',
            },
          },
        ],
      });
    }

    // Secrets Manager para credenciales de admin
    this.adminSecret = new secretsmanager.Secret(this, 'AdminSecret', {
      secretName: `${config.resourcePrefix}/admin-credentials`,
      description: 'Admin user credentials for SkillsForge',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'admin',
        }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludePunctuation: true,
      },
    });

    // Secret para JWT signing key
    const jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: `${config.resourcePrefix}/jwt-secret`,
      description: 'JWT signing secret key',
      generateSecretString: {
        passwordLength: 64,
        excludePunctuation: true,
      },
    });

    // Outputs
    if (config.waf.enabled) {
      new cdk.CfnOutput(this, 'CloudFrontWebACLArn', {
        value: this.cloudfrontWebAcl.attrArn,
        description: 'CloudFront WAF Web ACL ARN',
        exportName: `${config.resourcePrefix}-CloudFrontWafArn`,
      });

      new cdk.CfnOutput(this, 'RegionalWebACLArn', {
        value: this.regionalWebAcl.attrArn,
        description: 'Regional WAF Web ACL ARN',
        exportName: `${config.resourcePrefix}-RegionalWafArn`,
      });
    }

    new cdk.CfnOutput(this, 'AdminSecretArn', {
      value: this.adminSecret.secretArn,
      description: 'Admin credentials secret ARN',
      exportName: `${config.resourcePrefix}-AdminSecretArn`,
    });

    new cdk.CfnOutput(this, 'JwtSecretArn', {
      value: jwtSecret.secretArn,
      description: 'JWT secret ARN',
      exportName: `${config.resourcePrefix}-JwtSecretArn`,
    });
  }
}
