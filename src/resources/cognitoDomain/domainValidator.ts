/* eslint-disable import/no-extraneous-dependencies */
import { PreSignUpTriggerHandler } from 'aws-lambda';

const allowedDomain = process.env.ALLOWED_DOMAIN || '';

export const handler: PreSignUpTriggerHandler = async (event, _, callback) => {
  console.log(`Event: ${JSON.stringify(event)}`);
  console.log(`Allowed Domain: ${allowedDomain}`);
  console.log(`Allowed Domain Length: ${allowedDomain.length}`);
  try {
    const userEmailDomain = event.request.userAttributes.email.split('@')[1];
    console.log(`UserEmailDomain: ${userEmailDomain}`);
    if (userEmailDomain === allowedDomain || allowedDomain.length <= 1) {
      callback(null, event);
    } else {
      throw new Error(
        `Cannot authenticate users from domains different from ${allowedDomain}`,
      );
    }
  } catch (error) {
    const errorObj: Error =
      error instanceof Error ? error : new Error(String(error));
    callback(errorObj, event);
  }
};
