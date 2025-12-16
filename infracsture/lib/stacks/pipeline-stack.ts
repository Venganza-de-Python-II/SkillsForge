import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

export interface PipelineStackProps extends cdk.StackProps {
    config: EnvironmentConfig;
}

/**
 * Stack de CI/CD con AWS CodePipeline
 * 
 * Características:
 * - CodeCommit como source (puede cambiarse a GitHub)
 * - CodeBuild para tests y build
 * - CDK deploy automático
 * - Aprobación manual para prod
 * - Notificaciones SNS
 */
export class PipelineStack extends cdk.Stack {
    public readonly pipeline: codepipeline.Pipeline;
    public readonly repository: codecommit.Repository;

    constructor(scope: Construct, id: string, props: PipelineStackProps) {
        super(scope, id, props);

        const { config } = props;

        // SNS Topic para notificaciones de pipeline
        const pipelineTopic = new sns.Topic(this, 'PipelineTopic', {
            topicName: `${config.resourcePrefix}-PipelineNotifications`,
            displayName: 'SkillsForge Pipeline Notifications',
        });

        pipelineTopic.addSubscription(
            new subs.EmailSubscription(config.notifications.adminEmail)
        );

        // CodeCommit Repository
        this.repository = new codecommit.Repository(this, 'Repository', {
            repositoryName: `${config.resourcePrefix}-repo`,
            description: 'SkillsForge source code repository',
        });

        // Artifact stores
        const sourceOutput = new codepipeline.Artifact('SourceOutput');
        const buildOutput = new codepipeline.Artifact('BuildOutput');

        // CodeBuild Project para tests y deploy
        const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
            projectName: `${config.resourcePrefix}-Build`,
            description: 'Build and deploy SkillsForge',
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.SMALL,
                privileged: true, // Para Docker si es necesario
            },
            environmentVariables: {
                ENVIRONMENT: {
                    value: config.environment,
                },
                AWS_DEFAULT_REGION: {
                    value: config.region,
                },
            },
            buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
            cache: codebuild.Cache.local(codebuild.LocalCacheMode.SOURCE),
        });

        // Permisos para CodeBuild
        buildProject.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                'cloudformation:*',
                'iam:*',
                's3:*',
                'lambda:*',
                'apigateway:*',
                'cognito-idp:*',
                'dynamodb:*',
                'events:*',
                'sns:*',
                'cloudwatch:*',
                'logs:*',
                'wafv2:*',
                'secretsmanager:*',
                'cloudfront:*',
                'codedeploy:*',
                'sts:AssumeRole',
            ],
            resources: ['*'],
        }));

        // Pipeline principal
        this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
            pipelineName: `${config.resourcePrefix}-Pipeline`,
            restartExecutionOnUpdate: true,
            stages: [
                // Stage 1: Source
                {
                    stageName: 'Source',
                    actions: [
                        new codepipeline_actions.CodeCommitSourceAction({
                            actionName: 'CodeCommit',
                            repository: this.repository,
                            branch: config.environment === 'prod' ? 'main' : 'dev',
                            output: sourceOutput,
                            trigger: codepipeline_actions.CodeCommitTrigger.EVENTS,
                        }),
                    ],
                },
                // Stage 2: Test & Build
                {
                    stageName: 'TestAndBuild',
                    actions: [
                        new codepipeline_actions.CodeBuildAction({
                            actionName: 'TestAndDeploy',
                            project: buildProject,
                            input: sourceOutput,
                            outputs: [buildOutput],
                        }),
                    ],
                },
            ],
        });

        // Para PROD: agregar aprobación manual
        if (config.environment === 'prod') {
            this.pipeline.addStage({
                stageName: 'ApprovalStage',
                placement: {
                    justAfter: this.pipeline.stage('TestAndBuild'),
                },
                actions: [
                    new codepipeline_actions.ManualApprovalAction({
                        actionName: 'ApproveProduction',
                        notificationTopic: pipelineTopic,
                        additionalInformation: 'Please review and approve deployment to production',
                    }),
                ],
            });

            // Stage final de deploy a prod (después de aprobación)
            this.pipeline.addStage({
                stageName: 'DeployToProduction',
                placement: {
                    justAfter: this.pipeline.stage('ApprovalStage'),
                },
                actions: [
                    new codepipeline_actions.CodeBuildAction({
                        actionName: 'DeployProd',
                        project: buildProject,
                        input: sourceOutput,
                    }),
                ],
            });
        }

        // Notificaciones de éxito/fallo
        this.pipeline.onStateChange('PipelineStateChange', {
            target: new cdk.aws_events_targets.SnsTopic(pipelineTopic),
        });

        // Outputs
        new cdk.CfnOutput(this, 'RepositoryCloneUrl', {
            value: this.repository.repositoryCloneUrlHttp,
            description: 'CodeCommit repository clone URL (HTTP)',
            exportName: `${config.resourcePrefix}-RepoUrl`,
        });

        new cdk.CfnOutput(this, 'PipelineName', {
            value: this.pipeline.pipelineName,
            description: 'CodePipeline name',
            exportName: `${config.resourcePrefix}-PipelineName`,
        });

        new cdk.CfnOutput(this, 'PipelineConsoleUrl', {
            value: `https://${config.region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${this.pipeline.pipelineName}/view`,
            description: 'Pipeline console URL',
        });
    }
}
