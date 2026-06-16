import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from "aws-cdk-lib/aws-apigateway"
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as ssm from "aws-cdk-lib/aws-ssm";
import { Construct } from 'constructs';

export class Logicistics3PLStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const frontendBucket = new s3.Bucket(this, "Angular3PLBucket", {
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });

        new ssm.StringParameter(this, 'BucketNameParam', {
            parameterName: '/3pl/frontend-bucket-name',
            stringValue: frontendBucket.bucketName,
        });


        const inventoryTable = new dynamodb.Table(this, "InventoryTable", {
            partitionKey: { name: "sku", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });

        const inventoryLambda = new lambda.Function(this, "InventoryLambda", {
            runtime: lambda.Runtime.NODEJS_24_X,
            code: lambda.Code.fromAsset("../backend/dist"),
            handler: "index.handler",
            environment: {
                TABLE_NAME: inventoryTable.tableName
            }
        })

        const inventoryApi = new apigw.LambdaRestApi(this, "InventoryApi", {
            handler: inventoryLambda,
            proxy: true
        })

        // 2. OAC-backed S3 origin (modern replacement for OAI)
        const distribution = new cloudfront.Distribution(this, 'Mock3PLDistribution', {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket as s3.IBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
            },
            additionalBehaviors: {
                // Proxy /api/* to API Gateway, bypassing cache
                '/api/*': {
                    origin: new origins.HttpOrigin(`${api.restApiId}.execute-api.${this.region}.amazonaws.com`),
                    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
                    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                },
            },
            // Required for Angular client-side routing
            errorResponses: [
                { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
                { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
            ],
            defaultRootObject: 'index.html',
        });

        new ssm.StringParameter(this, 'DistributionIdParam', {
            parameterName: '/3pl/cloudfront-dist-id',
            stringValue: distribution.distributionId,
        });

        new cdk.CfnOutput(this, 'CloudFrontUrl', {
            value: `https://${distribution.distributionDomainName}`,
            description: 'CloudFront Distribution URL',
        });

        inventoryTable.grantReadWriteData(inventoryLambda);
    }
}