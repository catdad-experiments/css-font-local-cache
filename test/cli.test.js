const path = require('path');
const { spawn } = require('child_process');

const cssSpec = require('./css-spec.js');
const { bin: binName } = require('../package.json');
const binPath = path.resolve(__dirname, '..', binName);

const read = async stream => {
  const content = [];

  for await (const chunk of stream) {
    content.push(chunk);
  }

  return Buffer.concat(content).toString();
};

const once = (ee, name) => new Promise(resolve => {
  ee.once(name, arg => resolve(arg));
});

const convert = async css => {
  const proc = spawn(process.execPath, [binPath], { stdio: 'pipe' });

  let err;

  proc.on('error', e => {
    err = e;
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    once(proc, 'exit'),
    read(proc.stdout),
    read(proc.stderr),
    (() => proc.stdin.end(css))()
  ]);

  if (err) {
    throw err;
  }

  if (exitCode === 0) {
    return stdout.trim();
  }

  // hack the error logged to stderr so that the spec helper can
  // validate it as an error object
  throw new Error(stderr.trim().split('\n')[0].trim().replace(/^Error: /, ''));
};

describe('CLI', () => {
  describe('when given css text through stdin', () => {
    cssSpec(convert);
  });
});
