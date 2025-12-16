import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import * as path from 'path';

export interface FrontendStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  apiUrl: string;
  userPoolId: string;
  userPoolClientId: string;
  wafWebAcl?: wafv2.CfnWebACL;
}

export class FrontendStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;
  public readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id, props);

    const { config, apiUrl, userPoolId, userPoolClientId, wafWebAcl } = props;

    // S3 Bucket para frontend
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `${config.resourcePrefix.toLowerCase()}-frontend`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: config.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: config.environment !== 'prod',
    });

    // Origin Access Control para CloudFront
    const oac = new cloudfront.CfnOriginAccessControl(this, 'OAC', {
      originAccessControlConfig: {
        name: `${config.resourcePrefix}-OAC`,
        originAccessControlOriginType: 's3',
        signingBehavior: 'always',
        signingProtocol: 'sigv4',
      },
    });

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      priceClass: cloudfront.PriceClass[config.cloudfront.priceClass as keyof typeof cloudfront.PriceClass],
      webAclId: config.waf.enabled && wafWebAcl ? wafWebAcl.attrArn : undefined,
    });

    this.distributionDomainName = `https://${this.distribution.distributionDomainName}`;

    // Deploy del frontend (si existe la carpeta)
    const frontendPath = path.join(__dirname, '../../frontend-build');
    try {
      new s3deploy.BucketDeployment(this, 'DeployFrontend', {
        sources: [s3deploy.Source.asset(frontendPath)],
        destinationBucket: this.bucket,
        distribution: this.distribution,
        distributionPaths: ['/*'],
      });
    } catch (e) {
      console.warn('⚠️  Frontend build folder not found. Skipping deployment.');
    }

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Frontend S3 bucket name',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distributionDomainName,
      description: 'CloudFront distribution domain name',
      exportName: `${config.resourcePrefix}-DistributionDomain`,
    });

    new cdk.CfnOutput(this, 'FrontendConfig', {
      value: JSON.stringify({
        apiUrl,
        userPoolId,
        userPoolClientId,
        region: config.region,
      }),
      description: 'Frontend configuration (inject into build)',
    });
  }
}
