import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import * as path from 'path';

export interface EventsStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
  table: dynamodb.Table;
}

export class EventsStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;
  public readonly notificationTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: EventsStackProps) {
    super(scope, id, props);

    const { config, table } = props;

    // EventBridge Bus personalizado
    this.eventBus = new events.EventBus(this, 'EventBus', {
      eventBusName: `${config.resourcePrefix}-EventBus`,
    });

    // SNS Topic para notificaciones
    this.notificationTopic = new sns.Topic(this, 'NotificationTopic', {
      topicName: config.notifications.snsTopicName,
      displayName: 'SkillsForge Notifications',
    });

    // Suscripción de email para admin
    this.notificationTopic.addSubscription(
      new subs.EmailSubscription(config.notifications.adminEmail)
    );

    // Lambda para procesar eventos
    const eventProcessorLambda = new lambda.Function(this, 'EventProcessor', {
      functionName: `${config.resourcePrefix}-EventProcessor`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'events/processor.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend-services/functions')),
      timeout: cdk.Duration.seconds(60),
      environment: {
        TABLE_NAME: table.tableName,
        ENVIRONMENT: config.environment,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Process events from EventBridge',
    });

    table.grantReadData(eventProcessorLambda);
    this.notificationTopic.grantPublish(eventProcessorLambda);

    // Regla: WORKSHOP_CREATED
    new events.Rule(this, 'WorkshopCreatedRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['skillsforge.workshops'],
        detailType: ['WORKSHOP_CREATED'],
      },
      targets: [new targets.LambdaFunction(eventProcessorLambda)],
    });

    // Regla: STUDENT_REGISTERED
    new events.Rule(this, 'StudentRegisteredRule', {
      eventBus: this.eventBus,
      eventPattern: {
        source: ['skillsforge.registrations'],
        detailType: ['STUDENT_REGISTERED'],
      },
      targets: [new targets.LambdaFunction(eventProcessorLambda)],
    });

    // Dead Letter Queue (DLQ) para eventos fallidos
    const dlq = new sqs.Queue(this, 'EventDLQ', {
      queueName: `${config.resourcePrefix}-EventDLQ`,
      retentionPeriod: cdk.Duration.days(14),
      encryption: sqs.QueueEncryption.KMS_MANAGED,
    });

    // Alarma DLQ para monitorear mensajes fallidos
    const dlqAlarm = new cloudwatch.Alarm(this, 'DLQAlarm', {
      metric: dlq.metricApproximateNumberOfMessagesVisible(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmDescription: 'Alert when messages appear in DLQ',
    });

    // Enviar alarma DLQ al SNS topic
    dlqAlarm.addAlarmAction(new actions.SnsAction(this.notificationTopic));

    // Lambda para recordatorios de talleres
    const reminderLambda = new lambda.Function(this, 'ReminderLambda', {
      functionName: `${config.resourcePrefix}-WorkshopReminder`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'events/reminder.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend-services/functions')),
      timeout: cdk.Duration.seconds(120),
      environment: {
        TABLE_NAME: table.tableName,
        SNS_TOPIC_ARN: this.notificationTopic.topicArn,
        ENVIRONMENT: config.environment,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'Send workshop reminders 24h before start',
      deadLetterQueue: dlq,
    });

    table.grantReadWriteData(reminderLambda);
    this.notificationTopic.grantPublish(reminderLambda);

    // EventBridge Scheduler - Ejecuta cada hora para checkear reminders
    const scheduleRole = new cdk.aws_iam.Role(this, 'SchedulerRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('scheduler.amazonaws.com'),
    });

    reminderLambda.grantInvoke(scheduleRole);

    new scheduler.CfnSchedule(this, 'ReminderSchedule', {
      name: `${config.resourcePrefix}-ReminderSchedule`,
      description: 'Check and send workshop reminders every hour',
      flexibleTimeWindow: {
        mode: 'OFF',
      },
      scheduleExpression: 'rate(1 hour)',
      target: {
        arn: reminderLambda.functionArn,
        roleArn: scheduleRole.roleArn,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'EventBusName', {
      value: this.eventBus.eventBusName,
      description: 'EventBridge bus name',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: this.notificationTopic.topicArn,
      description: 'SNS notification topic ARN',
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: dlq.queueUrl,
      description: 'Dead Letter Queue URL',
    });
  }
}
