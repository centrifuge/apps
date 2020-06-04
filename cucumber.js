// cucumber.js
let common = [
    '--require-module ts-node/register', // Load TypeScript module
    '--require features/support/**/*.ts', // Load step definitions
    // `--format ${
    //   process.env.CI || !process.stdout.isTTY ? 'progress' : 'progress-bar'
    // }`,
    '--parallel 0',
  ].join(' ');

  module.exports = {
    default: common,
  };
