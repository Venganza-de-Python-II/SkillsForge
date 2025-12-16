import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

export interface DataStackProps extends cdk.StackProps {
  config: EnvironmentConfig;
}

/**
 * Stack de base de datos con DynamoDB
 * 
 * Diseño de tabla única:
 * - PK: Partition Key (WORKSHOP#<id> | USER#<id>)
 * - SK: Sort Key (META | REG#<userId>)
 * - GSI1: Para consultas por fecha (GSI1PK=WORKSHOP#ALL, GSI1SK=startAt)
 * - GSI2: Para consultas por categoría (GSI2PK=CATEGORY#<cat>, GSI2SK=startAt)
 */
export class DataStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Tabla principal con diseño single-table
    this.table = new dynamodb.Table(this, 'WorkshopsTable', {
      tableName: `${config.resourcePrefix}-Workshops`,
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: config.dynamodb.billingMode === 'PAY_PER_REQUEST'
        ? dynamodb.BillingMode.PAY_PER_REQUEST
        : dynamodb.BillingMode.PROVISIONED,
      
      // Backup y recuperación
      pointInTimeRecovery: config.dynamodb.pointInTimeRecovery,
      
      // Política de eliminación
      removalPolicy: config.dynamodb.removalPolicy === 'DESTROY'
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      
      // Encriptación en reposo
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      
      // Stream para EventBridge
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      
      // Time to Live para expiración automática
      timeToLiveAttribute: 'ttl',
    });

    // GSI1: Consultas por fecha (todos los talleres ordenados por fecha)
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI2: Consultas por categoría
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: {
        name: 'GSI2PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI2SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI3: Consultas por estudiante (mis inscripciones)
    this.table.addGlobalSecondaryIndex({
      indexName: 'GSI3',
      partitionKey: {
        name: 'GSI3PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI3SK',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Auto-scaling para modo PROVISIONED (si aplica)
    if (config.dynamodb.billingMode === 'PROVISIONED') {
      const readScaling = this.table.autoScaleReadCapacity({
        minCapacity: 5,
        maxCapacity: 100,
      });
      readScaling.scaleOnUtilization({
        targetUtilizationPercent: 70,
      });

      const writeScaling = this.table.autoScaleWriteCapacity({
        minCapacity: 5,
        maxCapacity: 100,
      });
      writeScaling.scaleOnUtilization({
        targetUtilizationPercent: 70,
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB table name',
      exportName: `${config.resourcePrefix}-TableName`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: 'DynamoDB table ARN',
      exportName: `${config.resourcePrefix}-TableArn`,
    });

    new cdk.CfnOutput(this, 'TableStreamArn', {
      value: this.table.tableStreamArn || 'N/A',
      description: 'DynamoDB table stream ARN',
    });
  }
}
