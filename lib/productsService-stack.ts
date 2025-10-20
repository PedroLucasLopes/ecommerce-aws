import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Construct } from "constructs";

interface ProductsServiceStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  alb: elbv2.ApplicationLoadBalancer;
  nlb: elbv2.NetworkLoadBalancer;
  repository: ecr.Repository;
}

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ProductsServiceStackProps) {
    super(scope, id, props);

    const productsDdb = new dynamodb.Table(this, "Products", {
      tableName: "products",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        cpu: 512,
        memoryLimitMiB: 1024,
        family: "productsservice",
      }
    );
    productsDdb.grantReadWriteData(taskDefinition.taskRole);

    const logGroup = new logs.LogGroup(this, "LogGroup", {
      logGroupName: "ProductsService",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const logDriver = new ecs.AwsLogDriver({
      logGroup: logGroup,
      streamPrefix: "ProductsService",
    });

    taskDefinition.addContainer("ProductsServiceContainer", {
      image: ecs.ContainerImage.fromEcrRepository(
        props.repository,
        process.env.IMAGE_TAG
      ),
      containerName: "products-service",
      logging: logDriver,
      portMappings: [
        {
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        PRODUCTS_DDB: productsDdb.tableName,
      }
    });

    const albListener = props.alb.addListener("ProductsServiceAlbListener", {
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      open: true,
    });

    const nlbListener = props.nlb.addListener("ProductsServiceNlbListener", {
      port: 8080,
      protocol: elbv2.Protocol.TCP,
    });

    const service = new ecs.FargateService(this, "ProductsService", {
      serviceName: "ProductsService",
      cluster: props.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      // DO NOT DO THIS IN PRODUCTION ENVIRONMENT!!!
      //assignPublicIp: true <- Deixa as rotas publicas quando não tem natGateway
    });

    props.repository.grantPull(taskDefinition.taskRole);
    service.connections.securityGroups[0].addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(8080)
    );

    nlbListener.addTargets("ProductsServiceNlbTarget", {
      targetGroupName: "productsServiceNlb",
      port: 8080,
      protocol: elbv2.Protocol.TCP,
      targets: [
        service.loadBalancerTarget({
          containerName: "products-service",
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        }),
      ],
    });

    albListener.addTargets("ProductsServiceAlbTarget", {
      targetGroupName: "productsServiceAlb",
      port: 8080,
      targets: [service],
      protocol: elbv2.ApplicationProtocol.HTTP,
      deregistrationDelay: cdk.Duration.seconds(30), // Especifica quanto tempo o ALB deve desregistrar um serviço que não está respondendo via mecanismo de teste de sanidade
      healthCheck: {
        interval: cdk.Duration.minutes(1),
        enabled: true,
        port: process.env.PORT,
        timeout: cdk.Duration.seconds(10),
        path: "/health",
        healthyHttpCodes: "200",
      },
    });
  }
}
