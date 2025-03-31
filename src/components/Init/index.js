const fsExtra = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const findUp = require('find-up');
const { prompt } = require('enquirer');
const packageJson = require('../../../package.json');

const ACTION = {
  CREATE_JAVASCRIPT_PROJECT_ACTION: {
    env: 'TRONBOX_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS',
    message: 'Create a sample project',
    project: 'javascript'
  },
  // CREATE_JAVASCRIPT_TRC20_PROJECT_ACTION: {
  //   env: 'TRONBOX_CREATE_JAVASCRIPT_TRC20_PROJECT_WITH_DEFAULTS',
  //   message: 'Create a TRC20 project',
  //   project: 'javascript-trc20'
  // },
  QUIT_ACTION: {
    message: 'Quit'
  }
};

// generated with the "colossal" font
function printAsciiLogo() {
  console.info(chalk.blue(`88888888888                       888888b.                    `));
  console.info(chalk.blue(`    888                           888  "88b                   `));
  console.info(chalk.blue(`    888                           888  .88P                   `));
  console.info(chalk.blue(`    888  888d888 .d88b.  88888b.  8888888K.   .d88b.  888  888`));
  console.info(chalk.blue(`    888  888P"  d88""88b 888 "88b 888  "Y88b d88""88b \`Y8bd8P'`));
  console.info(chalk.blue(`    888  888    888  888 888  888 888    888 888  888   X88K  `));
  console.info(chalk.blue(`    888  888    Y88..88P 888  888 888   d88P Y88..88P .d8""8b.`));
  console.info(chalk.blue(`    888  888     "Y88P"  888  888 8888888P"   "Y88P"  888  888`));
  console.info('');
}

function printWelcomeMessage() {
  console.info(chalk.cyan(`Welcome to TronBox v${packageJson.version}! Learn more at ${packageJson.homepage}`));
  console.info();
}

function showCreatedMessage() {
  console.info();
  console.info(chalk.green('Created successfully. Sweet!'));
  console.info();
  console.info('See the README.md file for some example commands you can run.');
  console.info();
  console.info('Happy building your amazing DApp!');
}

function showStarOnGitHubMessage() {
  console.info();
  console.info(chalk.cyan("If you're enjoying TronBox, please give us a star on GitHub!"));
  console.info();
  console.info(chalk.cyan(`   ${packageJson.repository.url.slice(0, -4)}`));
}

const getAction = async () => {
  if (process.env[ACTION.CREATE_JAVASCRIPT_PROJECT_ACTION.env] !== undefined) {
    return ACTION.CREATE_JAVASCRIPT_PROJECT_ACTION.message;
  }

  try {
    const actionResponse = await prompt([
      {
        name: 'action',
        type: 'select',
        message: 'What do you want to do?',
        initial: 0,
        choices: Object.values(ACTION).map(_ => {
          return {
            name: _.message
          };
        })
      }
    ]);

    return actionResponse.action;
  } catch (e) {
    if (e === '') {
      return ACTION.QUIT_ACTION.message;
    }

    throw e;
  }
};

const getAllFilesSync = dir => {
  const files = fsExtra.readdirSync(dir);
  let results = [];

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fsExtra.statSync(filePath);
    if (stat.isDirectory()) {
      results = [...results, ...getAllFilesSync(filePath)];
    } else {
      results.push(filePath);
    }
  });

  return results;
};

const copySampleProject = action => {
  const packageRoot = path.dirname(findUp.sync('package.json', { cwd: path.dirname(__filename) }));
  const sampleProjectName = Object.values(ACTION).find(_ => action === _.message).project;
  const sampleProjectPath = path.join(packageRoot, 'sample-projects', sampleProjectName);

  // relative paths to all the sample project files
  const sampleProjectFiles = getAllFilesSync(sampleProjectPath).map(file => path.relative(sampleProjectPath, file));

  const projectRoot = process.cwd();

  const existingFiles = fsExtra.readdirSync(projectRoot).filter(file => file !== '.DS_Store');
  if (existingFiles.length) {
    const errorMsg = 'This directory is not empty.\nPlease execute `tronbox init` in an empty directory.\n';
    console.info();
    console.info(chalk.red(errorMsg));
    process.exit();
  }

  // copy the files
  for (const file of sampleProjectFiles) {
    const sampleProjectFile = path.resolve(sampleProjectPath, file);
    const targetProjectFile = path.resolve(projectRoot, file);

    fsExtra.copySync(sampleProjectFile, targetProjectFile);
  }
};

const Init = {
  run: function (options, done) {
    printAsciiLogo();

    printWelcomeMessage();

    getAction()
      .then(action => {
        if (action === ACTION.QUIT_ACTION.message) {
          showStarOnGitHubMessage();
          done();
          return;
        }

        copySampleProject(action);

        showCreatedMessage();
        showStarOnGitHubMessage();
        done();
      })
      .catch(done);
  }
};

module.exports = Init;
