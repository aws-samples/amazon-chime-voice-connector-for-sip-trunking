import { Duration, Stack } from 'aws-cdk-lib';
import {
  Vpc,
  SecurityGroup,
  CfnEIP,
  Instance,
  MachineImage,
  InstanceType,
  InstanceClass,
  InstanceSize,
  CloudFormationInit,
  InitConfig,
  InitFile,
  InitCommand,
  CfnEIPAssociation,
  UserData,
} from 'aws-cdk-lib/aws-ec2';
import { Role } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface AsteriskProps {
  asteriskEip: CfnEIP;
  pstnVoiceConnectorArn: string;
  pstnVoiceConnectorPhone: string;
  pstnVoiceConnectorId: string;
  vpc: Vpc;
  securityGroup: SecurityGroup;
  asteriskRole: Role;
}
export class Asterisk extends Construct {
  public instanceId: string;

  constructor(scope: Construct, id: string, props: AsteriskProps) {
    super(scope, id);

    const parameterName =
      '/aws/service/canonical/ubuntu/server/jammy/stable/current/arm64/hvm/ebs-gp2/ami-id';
    const ubuntuAmiId = StringParameter.valueForStringParameter(
      this,
      parameterName,
    );

    const ubuntuAmi = MachineImage.genericLinux({
      'us-east-1': ubuntuAmiId,
    });

    const userData = UserData.forLinux();
    userData.addCommands(
      'apt-get update',
      'while fuser /var/lib/dpkg/lock >/dev/null 2>&1 ; do sleep 1 ; done',
      'mkdir -p /opt/aws/bin',
      'apt-get install -y python3-pip unzip jq asterisk',
      'pip3 install https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-py3-latest.tar.gz',
      'ln -s /root/aws-cfn-bootstrap-latest/init/ubuntu/cfn-hup /etc/init.d/cfn-hup',
      'ln -s /usr/local/bin/cfn-* /opt/aws/bin/',
      'curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"',
      'unzip -q awscliv2.zip',
      './aws/install',
    );

    const ec2Instance = new Instance(this, 'Instance', {
      vpc: props.vpc,
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MEDIUM),
      machineImage: ubuntuAmi,
      userData: userData,
      init: CloudFormationInit.fromConfigSets({
        configSets: {
          default: ['config'],
        },
        configs: {
          config: new InitConfig([
            InitFile.fromObject('/etc/config.json', {
              PSTNVoiceConnector: `${props.pstnVoiceConnectorId}.voiceconnector.chime.aws`,
              PSTNVoiceConnectorPhone: props.pstnVoiceConnectorPhone,
              IP: props.asteriskEip.ref,
              REGION: Stack.of(this).region,
            }),
            InitFile.fromFileInline(
              '/etc/asterisk/pjsip.conf',
              'src/resources/asteriskConfig/pjsip.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/asterisk.conf',
              'src/resources/asteriskConfig/asterisk.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/http.conf',
              'src/resources/asteriskConfig/http.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/rtp.conf',
              'src/resources/asteriskConfig/rtp.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/logger.conf',
              'src/resources/asteriskConfig/logger.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/extensions.conf',
              'src/resources/asteriskConfig/extensions.conf',
            ),
            InitFile.fromFileInline(
              '/etc/asterisk/modules.conf',
              'src/resources/asteriskConfig/modules.conf',
            ),
            InitFile.fromFileInline(
              '/etc/config_asterisk.sh',
              'src/resources/asteriskConfig/config_asterisk.sh',
            ),
            InitCommand.shellCommand('chmod +x /etc/config_asterisk.sh'),
            InitCommand.shellCommand('/etc/config_asterisk.sh'),
          ]),
        },
      }),
      initOptions: {
        timeout: Duration.minutes(5),
        includeUrl: true,
        includeRole: true,
        printLog: true,
      },
      securityGroup: props.securityGroup,
      role: props.asteriskRole,
    });

    new CfnEIPAssociation(this, 'EIP Association', {
      eip: props.asteriskEip.ref,
      instanceId: ec2Instance.instanceId,
    });

    this.instanceId = ec2Instance.instanceId;
  }
}
