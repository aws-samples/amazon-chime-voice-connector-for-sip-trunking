const { awscdk } = require('projen');
const { JobPermission } = require('projen/lib/github/workflows-model');
const { UpgradeDependenciesSchedule } = require('projen/lib/javascript');

const AUTOMATION_TOKEN = 'PROJEN_GITHUB_TOKEN';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.83.0',
  license: 'MIT-0',
  author: 'Court Schuett',
  copyrightOwner: 'Amazon.com, Inc.',
  authorAddress: 'https://aws.amazon.com',
  appEntrypoint: 'amazon-chime-voice-connector-for-sip-trunking.ts',
  tsconfig: { include: ['src/resources/server/assets/site/**/*.ts?'] },
  eslintOptions: { ignorePatterns: ['src/resources/server/assets/site/**'] },
  projenrcTs: true,
  jest: false,
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      schedule: UpgradeDependenciesSchedule.WEEKLY,
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
  devDeps: ['esbuild'],
  deps: ['cdk-amazon-chime-resources', 'dotenv'],
});

const upgradeSite = project.github.addWorkflow('upgrade-site');
upgradeSite.on({ schedule: [{ cron: '0 5 * * 1' }], workflowDispatch: {} });
upgradeSite.addJobs({
  upgradeSite: {
    runsOn: ['ubuntu-latest'],
    name: 'upgrade-site',
    permissions: {
      actions: JobPermission.WRITE,
      contents: JobPermission.READ,
      idToken: JobPermission.WRITE,
    },
    steps: [
      { uses: 'actions/checkout@v3' },
      {
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v3',
        with: {
          'node-version': '18',
        },
      },
      {
        run: 'yarn install --check-files --frozen-lockfile',
        workingDirectory: 'src/resources/server/assets/site',
      },
      {
        run: 'yarn upgrade',
        workingDirectory: 'src/resources/server/assets/site',
      },
      {
        name: 'Create Pull Request',
        uses: 'peter-evans/create-pull-request@v4',
        with: {
          'token': '${{ secrets.' + AUTOMATION_TOKEN + ' }}',
          'commit-message': 'chore: upgrade site',
          'branch': 'auto/projen-upgrade',
          'title': 'chore: upgrade site',
          'body': 'This PR upgrades site',
          'labels': 'auto-merge, auto-approve',
          'author': 'github-actions <github-actions@github.com>',
          'committer': 'github-actions <github-actions@github.com>',
          'signoff': true,
        },
      },
    ],
  },
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
