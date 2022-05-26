import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VoiceConnectorForSIPTrunking } from '../src/amazon-chime-voice-connector-for-sip-trunking';

test('Snapshot', () => {
  const app = new App();
  const stack = new VoiceConnectorForSIPTrunking(app, 'test', {});

  const template = Template.fromStack(stack);
  expect(template.toJSON()).toMatchSnapshot();
});
