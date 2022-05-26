import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class VPC extends Construct {
  public readonly asteriskEip: ec2.CfnEIP;
  public asteriskRole: iam.Role;
  public vpc: ec2.Vpc;
  public securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.asteriskEip = new ec2.CfnEIP(this, 'asteriskEip');

    this.vpc = new ec2.Vpc(this, 'VPC', {
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'AsteriskPublic',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    this.securityGroup = new ec2.SecurityGroup(this, 'AsteriskSecurityGroup', {
      vpc: this.vpc,
      description: 'Security Group for Asterisk Instance',
      allowAllOutbound: true,
    });
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('3.80.16.0/23'),
      ec2.Port.udp(5060),
      'Allow Chime Voice Connector Signaling Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('3.80.16.0/23'),
      ec2.Port.tcpRange(5060, 5061),
      'Allow Chime Voice Connector Signaling Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('99.77.253.0/24'),
      ec2.Port.udp(5060),
      'Allow Chime Voice Connector Signaling Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('99.77.253.0/24'),
      ec2.Port.tcpRange(5060, 5061),
      'Allow Chime Voice Connector Signaling Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('99.77.253.0/24'),
      ec2.Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Signaling Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('3.80.16.0/23'),
      ec2.Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Media Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('99.77.253.0/24'),
      ec2.Port.udpRange(5000, 65000),
      'Allow Chime Voice Connector Media Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('52.55.62.128/25'),
      ec2.Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('52.55.63.0/25'),
      ec2.Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('34.212.95.128/25'),
      ec2.Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4('34.223.21.0/25'),
      ec2.Port.udpRange(1024, 65535),
      'Allow Chime Voice Connector Media Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8088),
      'Allow Websocket Access',
    );
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'SSH Access',
    );

    this.asteriskRole = new iam.Role(this, 'asteriskEc2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore',
        ),
      ],
    });
  }
}
