import * as cdk from "aws-cdk-lib";
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from 'constructs';
import { Policy, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const sourceOutput = new codepipeline.Artifact();
        const buildOutput = new codepipeline.Artifact();

        const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
            actionName: "GitHub_source",
            owner: "ebm5025",
            connectionArn: "arn:aws:codeconnections:us-east-1:534640013755:connection/68a63c0e-98b9-4163-a795-5f8b9b17fc8f",
            output: sourceOutput,
            repo: "3pl",
            branch: "main",
            triggerOnPush: true
        });

        const bucketName = ssm.StringParameter.valueForStringParameter(
            this, '/3pl/frontend-bucket-name'
        );
        const distId = ssm.StringParameter.valueForStringParameter(
            this, '/3pl/cloudfront-dist-id'
        );

        const bucketNameLiteral = ssm.StringParameter.valueFromLookup(
            this, '/3pl/frontend-bucket-name'
        );
        const distIdLiteral = ssm.StringParameter.valueFromLookup(
            this, '/3pl/cloudfront-dist-id'
        );

        const pipelineProject = new codebuild.PipelineProject(this, "3PLBuildProject", {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.SMALL,
            },
            environmentVariables: {
                BUCKET_NAME: { value: bucketName },
                CLOUDFRONT_DIST_ID: { value: distId },
            },
        })

        new Policy(this, 'CodeBuildCDKPolicy', {
            statements: [
                new PolicyStatement({
                    actions: [
                        "sts:AssumeRole",
                        "ssm:GetParameter",
                    ],
                    resources: [
                        `arn:aws:iam::${this.account}:role/cdk-hnb659fds-deploy-role-${this.account}-${this.region}`,
                        `arn:aws:iam::${this.account}:role/cdk-hnb659fds-file-publishing-role-${this.account}-${this.region}`,
                        `arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/hnb659fds/version`
                    ]
                }),
                new PolicyStatement({
                    actions: [
                        "s3:ListBucket",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:GetObject"
                    ],
                    resources: [
                        `arn:aws:s3:::${bucketNameLiteral}`,
                        `arn:aws:s3:::${bucketNameLiteral}/*`
                    ]
                }),
                new PolicyStatement({
                    actions: ["cloudfront:CreateInvalidation"],
                    resources: [
                        `arn:aws:cloudfront::${this.account}:distribution/${distIdLiteral}`
                    ]
                })
            ]
        }).attachToRole(pipelineProject.role as Role);

        const buildAction = new codepipeline_actions.CodeBuildAction({
            actionName: "Build_Test_and_Deploy",
            project: pipelineProject,
            input: sourceOutput,
            outputs: [buildOutput]
        })

        new codepipeline.Pipeline(this, "3PL-CI-CD-Pipeline", {
            pipelineName: "3PL-CodeToCloud-Pipeline",
            stages: [
                {
                    stageName: "Source",
                    actions: [sourceAction]
                },
                {
                    stageName: "Build-and-Deploy",
                    actions: [buildAction]
                }
            ]
        })
    }
}