import * as cdk from "aws-cdk-lib";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

interface ApiStackProps extends cdk.StackProps {
  nlb: elbv2.NetworkLoadBalancer;
}

export class APIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const vpcLink = new apigateway.VpcLink(this, "VpcLink", {
      targets: [props.nlb],
    });

    const restApi = new apigateway.RestApi(this, "RestApi", {
      restApiName: "ECommerceAPI",
    });

    this.createProductsResource(restApi, props, vpcLink);
  }

  private createProductsResource(
    restApi: apigateway.RestApi,
    props: ApiStackProps,
    vpcLink: apigateway.VpcLink
  ) {
    // /products
    const productsResource = restApi.root.addResource("products");

    // GET /products
    productsResource.addMethod(
      "GET",
      new apigateway.Integration({
        type: apigateway.IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "GET",
        uri: `http://${props.nlb.loadBalancerDnsName}:8080/api/products`,
        options: {
          vpcLink: vpcLink,
          connectionType: apigateway.ConnectionType.VPC_LINK,
        },
      })
    );

    // POST /products
    productsResource.addMethod(
      "POST",
      new apigateway.Integration({
        type: apigateway.IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "POST",
        uri: `http://${props.nlb.loadBalancerDnsName}:8080/api/products`,
        options: {
          vpcLink: vpcLink,
          connectionType: apigateway.ConnectionType.VPC_LINK,
        },
      })
    );

    // /products/{id}
    const productIdResource = productsResource.addResource("{id}");
    const productIdIntegrationParameters = {
      "integration.request.path.id": "method.request.path.id",
    };
    const productIdMethodParameters = {
      "method.request.path.id": true,
    };

    // GET /products/{id}
    productIdResource.addMethod(
      "GET",
      new apigateway.Integration({
        type: apigateway.IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "GET",
        uri: `http://${props.nlb.loadBalancerDnsName}:8080/api/products/{id}`,
        options: {
          vpcLink: vpcLink,
          connectionType: apigateway.ConnectionType.VPC_LINK,
          requestParameters: productIdIntegrationParameters,
        },
      }),
      {
        requestParameters: productIdMethodParameters,
      }
    );

    // PUT /products/{id}
    productIdResource.addMethod(
      "PUT",
      new apigateway.Integration({
        type: apigateway.IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "PUT",
        uri: `http://${props.nlb.loadBalancerDnsName}:8080/api/products/{id}`,
        options: {
          vpcLink: vpcLink,
          connectionType: apigateway.ConnectionType.VPC_LINK,
          requestParameters: productIdIntegrationParameters,
        },
      }),
      {
        requestParameters: productIdMethodParameters,
      }
    );

    // DELETE /products/{id}
    productIdResource.addMethod(
      "DELETE",
      new apigateway.Integration({
        type: apigateway.IntegrationType.HTTP_PROXY,
        integrationHttpMethod: "DELETE",
        uri: `http://${props.nlb.loadBalancerDnsName}:8080/api/products/{id}`,
        options: {
          vpcLink: vpcLink,
          connectionType: apigateway.ConnectionType.VPC_LINK,
          requestParameters: productIdIntegrationParameters,
        },
      }),
      {
        requestParameters: productIdMethodParameters,
      }
    );
  }
}
