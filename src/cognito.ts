import { RemovalPolicy, Duration, Stack } from 'aws-cdk-lib';
import {
  CfnIdentityPool,
  IUserPool,
  IUserPoolClient,
  UserPool,
  UserPoolClient,
  UserPoolClientIdentityProvider,
  CfnIdentityPoolRoleAttachment,
  AccountRecovery,
  Mfa,
} from 'aws-cdk-lib/aws-cognito';
import {
  IRole,
  Role,
  PolicyStatement,
  FederatedPrincipal,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';

export interface CognitoStackProps {
  readonly allowedDomain: string;
}

export class CognitoResources extends Construct {
  public readonly authenticatedRole: IRole;
  public readonly identityPool: CfnIdentityPool;
  public readonly userPool: IUserPool;
  public readonly userPoolClient: IUserPoolClient;
  public readonly userPoolRegion: string;

  constructor(scope: Construct, id: string, props: CognitoStackProps) {
    super(scope, id);

    const domainValidator = new NodejsFunction(this, 'domainValidator', {
      entry: 'src/resources/cognitoDomain/domainValidator.ts',
      runtime: Runtime.NODEJS_18_X,
      architecture: Architecture.ARM_64,
      timeout: Duration.seconds(60),
      environment: {
        ALLOWED_DOMAIN: props.allowedDomain,
      },
    });

    const userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${Stack.of(this).stackName}-UserPool`,
      removalPolicy: RemovalPolicy.DESTROY,
      signInCaseSensitive: false,
      selfSignUpEnabled: true,
      lambdaTriggers: {
        preSignUp: domainValidator,
      },
      signInAliases: {
        username: false,
        phone: false,
        email: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      autoVerify: { email: true, phone: false },
      keepOriginal: {
        email: true,
        phone: false,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      mfa: Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      userInvitation: {
        emailSubject:
          'Your Amazon Chime SDK SIP Trunking Demo temporary password',
        emailBody:
          'Your Amazon Chime SDK SIP Trunking Demo username is {username} and temporary password is {####}',
      },
      userVerification: {
        emailSubject:
          'Verify your new Amazon Chime SDK SIP Trunking Demo account',
        emailBody:
          'The verification code to your new Amazon Chime SDK SIP Trunking Demo account is {####}',
      },
    });

    const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: `${Stack.of(this).stackName}-UserPool`,
      userPool: userPool,
      generateSecret: false,
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
      authFlows: {
        userSrp: true,
        custom: true,
      },
      refreshTokenValidity: Duration.hours(1),
    });

    const identityPool = new CfnIdentityPool(this, 'cognitoIdentityPool', {
      identityPoolName: `${Stack.of(this).stackName}-IdentityPool`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: userPoolClient.userPoolClientId,
          providerName: userPool.userPoolProviderName,
        },
      ],
    });

    const unauthenticatedRole = new Role(
      this,
      'CognitoDefaultUnauthenticatedRole',
      {
        assumedBy: new FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            // eslint-disable-next-line quote-props
            'StringEquals': {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'unauthenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity',
        ),
      },
    );

    unauthenticatedRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['mobileanalytics:PutEvents', 'cognito-sync:*'],
        resources: ['*'],
      }),
    );

    const authenticatedRole = new Role(
      this,
      'CognitoDefaultAuthenticatedRole',
      {
        assumedBy: new FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            // eslint-disable-next-line quote-props
            'StringEquals': {
              'cognito-identity.amazonaws.com:aud': identityPool.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'authenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity',
        ),
      },
    );

    authenticatedRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'mobileanalytics:PutEvents',
          'cognito-sync:*',
          'cognito-identity:*',
        ],
        resources: ['*'],
      }),
    );

    new CfnIdentityPoolRoleAttachment(this, 'DefaultValid', {
      identityPoolId: identityPool.ref,
      roles: {
        unauthenticated: unauthenticatedRole.roleArn,
        authenticated: authenticatedRole.roleArn,
      },
    });

    this.authenticatedRole = authenticatedRole;
    this.identityPool = identityPool;
    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
    this.userPoolRegion = Stack.of(this).region;
  }
}
