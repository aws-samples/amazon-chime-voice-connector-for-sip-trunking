import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  PriceClass,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { LoadBalancerV2Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Bucket, BucketEncryption, ObjectOwnership } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

interface DistributionResourcesProps {
  applicationLoadBalancer: ApplicationLoadBalancer;
}
export class DistributionResources extends Construct {
  public distribution: Distribution;

  constructor(scope: Construct, id: string, props: DistributionResourcesProps) {
    super(scope, id);

    const distributionLoggingBucket = new Bucket(
      this,
      'DistributionLoggingBucket',
      {
        publicReadAccess: false,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: BucketEncryption.S3_MANAGED,
        objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
      },
    );

    this.distribution = new Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new LoadBalancerV2Origin(props.applicationLoadBalancer, {
          httpPort: 80,
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
      },
      additionalBehaviors: {
        '/ws': {
          origin: new LoadBalancerV2Origin(props.applicationLoadBalancer, {
            httpPort: 8088,
            protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
          }),
          viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
          cachePolicy: CachePolicy.CACHING_DISABLED,
          allowedMethods: AllowedMethods.ALLOW_ALL,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
        },
      },
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_100,
      logBucket: distributionLoggingBucket,
      enableLogging: true,
    });
  }
}
