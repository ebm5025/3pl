import * as cdk from "aws-cdk-lib";
import { Logicistics3PLStack } from "../lib/3pl-stack.js";

const app = new cdk.App();

const deployEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT || "",
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new Logicistics3PLStack(app, "3PLLogistics-stack", {
  env: deployEnv,
  tags: {
    Project: "Mock3PLSystem",
    Environment: "Development",
    ManagedBy: "AWS-CDK"
  }
})