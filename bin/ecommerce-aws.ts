#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EcrStack } from "../lib/ecr-stack";
import { VpcStack } from "../lib/vpc-stack";
import { ClusterStack } from "../lib/cluster-stack";
import { LoadBalancerStack } from "../lib/lb-stack";
import { ProductsServiceStack } from "../lib/productsService-stack";
import { APIStack } from "../lib/api-stack";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const tagsInfra = {
  cost: "ECommerceInfra",
  team: "InfraTech",
};

// Container Definition Component
const ecrStack = new EcrStack(app, "Ecr", {
  env: env,
  tags: tagsInfra,
});

// Security Gateway Component
const vpcStack = new VpcStack(app, "Vpc", {
  env: env,
  tags: tagsInfra,
});

const loadBalancerStack = new LoadBalancerStack(app, "LoadBalancer", {
  env: env,
  tags: tagsInfra,
  vpc: vpcStack.vpc,
});
loadBalancerStack.addDependency(vpcStack);

// Cluster ECS Component
const clusterStack = new ClusterStack(app, "Cluster", {
  env: env,
  tags: tagsInfra,
  vpc: vpcStack.vpc,
});
clusterStack.addDependency(vpcStack);

const tagsProductsService = {
  cost: "ProductsService",
  team: "InfraTech",
};

const productsServiceStack = new ProductsServiceStack(app, "ProductsService", {
  tags: tagsProductsService,
  env: env,
  alb: loadBalancerStack.alb,
  nlb: loadBalancerStack.nlb,
  cluster: clusterStack.cluster,
  vpc: vpcStack.vpc,
  repository: ecrStack.productServiceRepository,
});
productsServiceStack.addDependency(loadBalancerStack);
productsServiceStack.addDependency(clusterStack);
productsServiceStack.addDependency(vpcStack);
productsServiceStack.addDependency(ecrStack);

const apiStack = new APIStack(app, "API", {
  tags: tagsInfra,
  env: env,
  nlb: loadBalancerStack.nlb,
});
apiStack.addDependency(loadBalancerStack);
apiStack.addDependency(productsServiceStack);
