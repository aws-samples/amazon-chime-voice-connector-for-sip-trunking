import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VoiceConnectorForSIPTrunking } from '../src/amazon-chime-voice-connector-for-sip-trunking';

const stackProps = {
  logLevel: process.env.LOG_LEVEL || 'INFO',
  sshPubKey: process.env.SSH_PUB_KEY || ' ',
};

test('Snapshot', () => {
  const app = new App();
  const stack = new VoiceConnectorForSIPTrunking(app, 'test', {
    ...stackProps,
  });

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
