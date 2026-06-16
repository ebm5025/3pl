import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class Logicistics3PLStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const frontendBucket = new s3.Bucket(this,"Angular3PLBucket", {
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true
        });

        const inventoryTable = new dynamodb.Table(this, "InventoryTable", {
            partitionKey: {name: "sku", type: dynamodb.AttributeType.STRING},
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

        inventoryTable.grantReadWriteData(inventoryLambda);
    }
}