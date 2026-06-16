import * as cdk from "aws-cdk-lib";
import { Logicistics3PLStack } from "../lib/3pl-stack";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

const deployEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT || "534640013755",
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new Logicistics3PLStack(app, "Mock3PLLogistics-stack", {
  env: deployEnv,
  tags: {
    Project: "Mock3PLSystem",
    Environment: "Development",
    ManagedBy: "AWS-CDK"
  }
})

new PipelineStack(app, "Mock3PL-Pipeline-Stack", {
  env: deployEnv,
  tags: { Project: "Mock3PLSystem", Environment: "CI-CD", ManagedBy: "AWS-CDK" }
});