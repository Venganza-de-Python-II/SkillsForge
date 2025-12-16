import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

export interface MonitoringStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  api: apigateway.RestApi;
  table: dynamodb.Table;
  distribution: cloudfront.Distribution;
  lambdaFunctions: lambda.Function[];
}

export class MonitoringStack extends cdk.Stack {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { config, api, table, distribution, lambdaFunctions } = props;

    // SNS Topic para alarmas
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `${config.resourcePrefix}-Alarms`,
      displayName: 'SkillsForge Alarms',
    });

    this.alarmTopic.addSubscription(
      new subs.EmailSubscription(config.monitoring.alarmEmail)
    );

    // Dashboard de CloudWatch
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `${config.resourcePrefix}-Dashboard`,
    });

    // Métricas de API Gateway
    const apiLatency = api.metricLatency({ period: cdk.Duration.minutes(5) });
    const apiCount = api.metricCount({ period: cdk.Duration.minutes(5) });
    const api4xxErrors = api.metricClientError({ period: cdk.Duration.minutes(5) });
    const api5xxErrors = api.metricServerError({ period: cdk.Duration.minutes(5) });

    // Alarma: API 5XX Errors
    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      metric: api5xxErrors,
      threshold: 10,
      evaluationPeriods: 2,
      alarmDescription: 'API Gateway 5XX errors exceeded threshold',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    api5xxAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));

    // Widgets del dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Requests',
        left: [apiCount],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Errors',
        left: [api4xxErrors, api5xxErrors],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'API Latency',
        left: [apiLatency],
        width: 24,
      })
    );

    // Métricas de Lambda
    lambdaFunctions.forEach((fn, index) => {
      const errors = fn.metricErrors({ period: cdk.Duration.minutes(5) });
      const duration = fn.metricDuration({ period: cdk.Duration.minutes(5) });

      const errorAlarm = new cloudwatch.Alarm(this, `Lambda${index}ErrorAlarm`, {
        metric: errors,
        threshold: 5,
        evaluationPeriods: 2,
        alarmDescription: `${fn.functionName} errors exceeded threshold`,
      });
      errorAlarm.addAlarmAction(new actions.SnsAction(this.alarmTopic));
    });

    // Outputs
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${config.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: this.alarmTopic.topicArn,
      description: 'Alarm SNS topic ARN',
    });
  }
}
