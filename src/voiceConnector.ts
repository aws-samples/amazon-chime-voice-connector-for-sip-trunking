import { Stack } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as chime from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';

interface VoiceConnectorProps {
  asteriskEip: ec2.CfnEIP;
}
export class VoiceConnector extends Construct {
  public readonly pstnVoiceConnectorArn: string;
  public readonly pstnVoiceConnectorPhone: string;
  public readonly pstnVoiceConnectorId: string;

  constructor(scope: Construct, id: string, props: VoiceConnectorProps) {
    super(scope, id);

    const phoneNumber = new chime.ChimePhoneNumber(
      this,
      'voiceConnectorPhoneNumber',
      {
        phoneState: 'IL',
        phoneCountry: chime.PhoneCountry.US,
        phoneProductType: chime.PhoneProductType.VC,
        phoneNumberType: chime.PhoneNumberType.LOCAL,
      },
    );

    const pstnVoiceConnector = new chime.ChimeVoiceConnector(
      this,
      'pstnVoiceConnector',
      {
        termination: {
          terminationCidrs: [`${props.asteriskEip.ref}/32`],
          callingRegions: ['US'],
        },
        origination: [
          {
            host: props.asteriskEip.ref,
            port: 5060,
            protocol: chime.Protocol.UDP,
            priority: 1,
            weight: 1,
          },
        ],
        encryption: false,
      },
    );

    phoneNumber.associateWithVoiceConnector(pstnVoiceConnector);
    this.pstnVoiceConnectorArn = `arn:aws:chime:${Stack.of(this).region}:${
      Stack.of(this).account
    }:vc/${pstnVoiceConnector.voiceConnectorId}`;
    this.pstnVoiceConnectorId = pstnVoiceConnector.voiceConnectorId;
    this.pstnVoiceConnectorPhone = phoneNumber.phoneNumber;
  }
}
