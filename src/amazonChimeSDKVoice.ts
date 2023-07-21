import { CfnEIP } from 'aws-cdk-lib/aws-ec2';
import {
  ChimePhoneNumber,
  PhoneCountry,
  PhoneProductType,
  PhoneNumberType,
  ChimeVoiceConnector,
  Protocol,
} from 'cdk-amazon-chime-resources';
import { Construct } from 'constructs';
interface VoiceConnectorProps {
  asteriskEip: CfnEIP;
}
export class AmazonChimeSDKVoiceResources extends Construct {
  public readonly voiceConnector: ChimeVoiceConnector;
  public readonly phoneNumber: ChimePhoneNumber;

  constructor(scope: Construct, id: string, props: VoiceConnectorProps) {
    super(scope, id);

    const phoneNumber = new ChimePhoneNumber(
      this,
      'voiceConnectorPhoneNumber',
      {
        phoneState: 'IL',
        phoneCountry: PhoneCountry.US,
        phoneProductType: PhoneProductType.VC,
        phoneNumberType: PhoneNumberType.LOCAL,
      },
    );

    const pstnVoiceConnector = new ChimeVoiceConnector(
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
            protocol: Protocol.UDP,
            priority: 1,
            weight: 1,
          },
        ],
        encryption: false,
      },
    );

    phoneNumber.associateWithVoiceConnector(pstnVoiceConnector);
    this.voiceConnector = pstnVoiceConnector;
    this.phoneNumber = phoneNumber;
  }
}
