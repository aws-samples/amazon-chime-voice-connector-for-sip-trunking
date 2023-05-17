import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VPC, Asterisk, VoiceConnector } from '.';

export class VoiceConnectorForSIPTrunking extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const vpc = new VPC(this, 'VPC');
    const voiceConnector = new VoiceConnector(this, 'VoiceConnector', {
      asteriskEip: vpc.asteriskEip,
    });
    const asterisk = new Asterisk(this, 'Asterisk', {
      asteriskEip: vpc.asteriskEip,
      pstnVoiceConnectorArn: voiceConnector.pstnVoiceConnectorArn,
      pstnVoiceConnectorPhone: voiceConnector.pstnVoiceConnectorPhone,
      pstnVoiceConnectorId: voiceConnector.pstnVoiceConnectorId,
      vpc: vpc.vpc,
      securityGroup: vpc.securityGroup,
      asteriskRole: vpc.asteriskRole,
    });

    new CfnOutput(this, 'PSTN VoiceConnector ARN', {
      value: voiceConnector.pstnVoiceConnectorArn,
    });

    new CfnOutput(this, 'ssmCommand', {
      value: `aws ssm start-session --target ${asterisk.instanceId}`,
    });

    new CfnOutput(this, 'voiceConnectorPhone', {
      value: voiceConnector.pstnVoiceConnectorPhone,
    });

    new CfnOutput(this, 'sipuri', {
      value: 'agent@' + vpc.asteriskEip.ref,
    });
    new CfnOutput(this, 'password', { value: asterisk.instanceId });
    new CfnOutput(this, 'websocket', {
      value: 'ws://' + vpc.asteriskEip.ref + ':8088/ws',
    });

    new CfnOutput(this, 'VoiceConnectorId', {
      value: voiceConnector.pstnVoiceConnectorId,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1',
};

const app = new App();

new VoiceConnectorForSIPTrunking(app, 'SIPTrunking', { env: devEnv });

app.synth();
