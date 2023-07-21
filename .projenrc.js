const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.83.0',
  license: 'MIT-0',
  author: 'Court Schuett',
  copyrightOwner: 'Amazon.com, Inc.',
  authorAddress: 'https://aws.amazon.com',
  appEntrypoint: 'amazon-chime-voice-connector-for-sip-trunking.ts',
  tsconfig: { include: ['src/resources/server/assets/site/**/*.ts?'] },
  eslintOptions: { ignorePatterns: ['src/resources/server/assets/site/**'] },
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['schuettc'],
  },
  autoApproveUpgrades: true,
  projenUpgradeSecret: 'PROJEN_GITHUB_TOKEN',
  defaultReleaseBranch: 'main',
  name: 'amazon-chime-voice-connector-for-sip-trunking',
  eslintOptions: { ignorePatterns: ['resources/**'] },
  devDeps: ['esbuild'],
  deps: ['cdk-amazon-chime-resources', 'dotenv'],
});

const common_exclude = [
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
  'dependabot.yml',
  '.DS_Store',
  '.yalc',
];
project.addTask('launch', {
  exec: 'yarn && yarn projen && yarn build && yarn cdk bootstrap && yarn cdk deploy --require-approval never',
});
project.gitignore.exclude(...common_exclude);
project.synth();
