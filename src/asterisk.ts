import { Stack, Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface AsteriskProps {
  asteriskEip: ec2.CfnEIP;
  pstnVoiceConnectorArn: string;
  pstnVoiceConnectorPhone: string;
  pstnVoiceConnectorId: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  asteriskRole: iam.Role;
}
export class Asterisk extends Construct {
  public instanceId: string;

  constructor(scope: Construct, id: string, props: AsteriskProps) {
    super(scope, id);

    const ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.ARM_64,
    });

    const ec2Instance = new ec2.Instance(this, 'Instance', {
      vpc: props.vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T4G,
        ec2.InstanceSize.MEDIUM,
      ),
      machineImage: ami,
      init: ec2.CloudFormationInit.fromConfigSets({
        configSets: {
          default: ['install', 'config'],
        },
        configs: {
          install: new ec2.InitConfig([
            ec2.InitFile.fromObject('/etc/config.json', {
              PSTNVoiceConnector: `${props.pstnVoiceConnectorId}.voiceconnector.chime.aws`,
              PSTNVoiceConnectorPhone: props.pstnVoiceConnectorPhone,
              IP: props.asteriskEip.ref,
              REGION: Stack.of(this).region,
            }),
            ec2.InitFile.fromFileInline(
              '/etc/install.sh',
              './resources/asteriskConfig/install.sh',
            ),
            ec2.InitCommand.shellCommand('chmod +x /etc/install.sh'),
            ec2.InitCommand.shellCommand('cd /tmp'),
            ec2.InitCommand.shellCommand(
              '/etc/install.sh 2>&1 | tee /var/log/asterisk_install.log',
            ),
          ]),
          config: new ec2.InitConfig([
            ec2.InitFile.fromFileInline(
              '/etc/asterisk/pjsip.conf',
              './resources/asteriskConfig/pjsip.conf',
            ),
            ec2.InitFile.fromFileInline(
              '/etc/asterisk/asterisk.conf',
              './resources/asteriskConfig/asterisk.conf',
            ),
            ec2.InitFile.fromFileInline(
              '/etc/asterisk/http.conf',
              './resources/asteriskConfig/http.conf',
            ),
            ec2.InitFile.fromFileInline(
              '/etc/asterisk/rtp.conf',
              './resources/asteriskConfig/rtp.conf',
            ),
            ec2.InitFile.fromFileInline(
              '/etc/asterisk/logger.conf',
              './resources/asteriskConfig/logger.conf',
            ),
            ec2.InitFile.fromFileInline(
              '/etc/asterisk/extensions.conf',
              './resources/asteriskConfig/extensions.conf',
            ),
            ec2.InitFile.fromFileInline(
              '/etc/asterisk/modules.conf',
              './resources/asteriskConfig/modules.conf',
            ),
            ec2.InitFile.fromFileInline(
              '/etc/config_asterisk.sh',
              './resources/asteriskConfig/config_asterisk.sh',
            ),
            ec2.InitCommand.shellCommand('chmod +x /etc/config_asterisk.sh'),
            ec2.InitCommand.shellCommand('/etc/config_asterisk.sh'),
          ]),
        },
      }),
      initOptions: {
        timeout: Duration.minutes(20),
        includeUrl: true,
        includeRole: true,
        printLog: true,
      },
      securityGroup: props.securityGroup,
      role: props.asteriskRole,
    });

    new ec2.CfnEIPAssociation(this, 'EIP Association', {
      eip: props.asteriskEip.ref,
      instanceId: ec2Instance.instanceId,
    });

    this.instanceId = ec2Instance.instanceId;
  }
}
