/* eslint-disable import/no-extraneous-dependencies */
import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { config } from 'dotenv';
import {
  VPCResources,
  DistributionResources,
  ServerResources,
  AmazonChimeSDKVoiceResources,
  CognitoResources,
} from '.';

config();

interface VoiceConnectorForSIPTrunkingProps extends StackProps {
  logLevel: string;
  sshPubKey: string;
  allowedDomain?: string;
}

export class VoiceConnectorForSIPTrunking extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: VoiceConnectorForSIPTrunkingProps,
  ) {
    super(scope, id, props);

    const vpcResources = new VPCResources(this, 'VPC');
    const amazonChimeSDKVoiceResources = new AmazonChimeSDKVoiceResources(
      this,
      'VoiceConnector',
      {
        asteriskEip: vpcResources.serverEip,
      },
    );

    const cognitoResources = new CognitoResources(this, 'Cognito', {
      allowedDomain: props.allowedDomain || '',
    });

    const distributionResources = new DistributionResources(
      this,
      'DistributionResources',
      {
        applicationLoadBalancer: vpcResources.applicationLoadBalancer,
      },
    );

    const serverResources = new ServerResources(this, 'Asterisk', {
      serverEip: vpcResources.serverEip,
      voiceConnector: amazonChimeSDKVoiceResources.voiceConnector,
      phoneNumber: amazonChimeSDKVoiceResources.phoneNumber,
      vpc: vpcResources.vpc,
      voiceSecurityGroup: vpcResources.voiceSecurityGroup,
      albSecurityGroup: vpcResources.albSecurityGroup,
      sshSecurityGroup: vpcResources.sshSecurityGroup,
      logLevel: props.logLevel,
      sshPubKey: props.sshPubKey,
      applicationLoadBalancer: vpcResources.applicationLoadBalancer,
      distribution: distributionResources.distribution,
      userPool: cognitoResources.userPool,
      userPoolClient: cognitoResources.userPoolClient,
      userPoolRegion: cognitoResources.userPoolRegion,
      identityPool: cognitoResources.identityPool,
    });

    new CfnOutput(this, 'DistributionUrl', {
      value: `https://${distributionResources.distribution.domainName}/`,
    });

    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${serverResources.instanceId}`,
    });

    new CfnOutput(this, 'sshCommand', {
      value: `ssh ubuntu@${vpcResources.serverEip.ref}`,
    });

    new CfnOutput(this, 'phoneNumber', {
      value: amazonChimeSDKVoiceResources.phoneNumber.phoneNumber,
    });

    new CfnOutput(this, 'voiceConnectorId', {
      value: amazonChimeSDKVoiceResources.voiceConnector.voiceConnectorId,
    });

    new CfnOutput(this, 'setVoiceConnectorId', {
      value: `export VOICECONNECTORID=${amazonChimeSDKVoiceResources.voiceConnector.voiceConnectorId}`,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const stackProps = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  sshPubKey: process.env.SSH_PUB_KEY || ' ',
  allowedDomain: process.env.ALLOWED_DOMAIN || ' ',
};

const app = new App();

new VoiceConnectorForSIPTrunking(app, 'VoiceConnectorForSIPTrunking', {
  ...stackProps,
  env: devEnv,
});

app.synth();
