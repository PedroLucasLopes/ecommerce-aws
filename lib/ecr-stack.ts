import * as cdk from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";

export class EcrStack extends cdk.Stack {
  readonly productServiceRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.productServiceRepository = new ecr.Repository(this, "ProductService", {
      repositoryName: "products-service",
      imageTagMutability: ecr.TagMutability.IMMUTABLE, // Não consegue subir imagens Docker com a mesma tag
      emptyOnDelete: true, // Se apagar o recurso, apagar as imagens também
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Se a Stack for apagada, esse recurso também será apagado
    });
  }
}
