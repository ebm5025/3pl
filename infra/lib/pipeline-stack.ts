import * as cdk from "aws-cdk-lib";
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const sourceOutput = new codepipeline.Artifact();
        const buildOutput = new codepipeline.Artifact();

        const sourceAction = new codepipeline_actions.CodeStarConnectionsSourceAction({
            actionName: "GitHub_source",
            owner: "ebm5025",
            connectionArn: "arn:aws:codeconnections:us-east-1:534640013755:connection/f7533c2a-07a3-4aa0-98b2-fea51595c3f1",
            output: sourceOutput,
            repo: "3pl",
            branch: "main",
            triggerOnPush: true
        });

        const pipelineProject = new codebuild.PipelineProject(this, "3PLBuildProject", {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                computeType: codebuild.ComputeType.MEDIUM,
            }
        })

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