import * as cdk from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

interface ClusterStackProps extends cdk.StackProps {
  readonly vpc: ec2.Vpc;
}

export class ClusterStack extends cdk.Stack {
  readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props?: ClusterStackProps) {
    super(scope, id, props);

    this.cluster = new ecs.Cluster(this, "ECommerceCluster", {
      vpc: props?.vpc,
      clusterName: "ECommerce",
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
    });
  }
}
