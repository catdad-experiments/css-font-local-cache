const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const { expect } = require('chai');
const getPort = require('get-port');
const safe = require('safe-await');

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

const convert = async (args, stdin) => {
  const proc = spawn(process.execPath, [binPath, ...args], { stdio: 'pipe' });

  let err;

  proc.on('error', e => {
    err = e;
  });

  const [exitCode, stdout, stderr] = await Promise.all([
    once(proc, 'exit'),
    read(proc.stdout),
    read(proc.stderr),
    (() => proc.stdin.end(stdin))()
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
    cssSpec(css => convert([], css));
  });

  describe('when given a url for css as an argument', () => {
    let port, requests, server;

    const base64 = (data, mime) => `data:${mime};charset=utf-8;base64,${Buffer.from(data).toString('base64')}`;

    before(async () => {
      port = await getPort();

      server = http.createServer((req, res) => {
        const data = requests[req.url];

        if (!data) {
          res.writeHead(404);
          res.end();

          return;
        }

        res.writeHead(data.status || 200, data.headers || {});
        res.end(data.body);
      });

      await new Promise(r => server.listen(port, () => r()));
    });

    after(async () => {
      await new Promise(r => server.close(() => r()));
    });

    beforeEach(async () => {
      requests = {};
    });

    it('requests the css and then transforms the fonts in @font-face', async () => {
      const fontname = '/font-1.woff2';
      const fontbody = 'this is not a real font but it is fine';
      const mime = 'font/not-really';

      const css = `@font-face {
  font-family: 'Fake Font';
  src: url(http://localhost:${port}${fontname}) format('woff2');
}`;

      requests['/input.css'] = {
        body: css
      };

      requests[fontname] = {
        body: fontbody,
        headers: {
          'content-type': mime
        }
      };

      const result = await convert([`http://localhost:${port}/input.css`], '');

      expect(result).to.equal(`@font-face {
  font-family: 'Fake Font';
  src: url(${base64(fontbody, mime)}) format('woff2');
}`);
    });

    it('errors if the css cannot be fetched', async () => {
      const url = `http://localhost:${port}/missing.css`;
      const [err] = await safe(convert([url], ''));

      expect(err).to.be.an.instanceOf(Error)
        .and.to.have.property('message', `failed to fetch "${url}": 404 Not Found`);
    });

    it('prefers the url over css provided through stdin', async () => {
      const fontname = '/font-1.woff2';
      const fontbody = 'this is not a real font but it is fine';
      const mime = 'font/not-really';

      const cssRequest = `@font-face {
  font-family: 'Fake Font';
  src: url(http://localhost:${port}${fontname}) format('woff2');
}`;

      const cssStream = `@font-face {
  font-family: 'Will Not Be Used';
  src: url(http://localhost:${port}${fontname}) format('woff2');
}`;

      requests['/input.css'] = {
        body: cssRequest
      };

      requests[fontname] = {
        body: fontbody,
        headers: {
          'content-type': mime
        }
      };

      const result = await convert([`http://localhost:${port}/input.css`], cssStream);

      expect(result).to.equal(`@font-face {
  font-family: 'Fake Font';
  src: url(${base64(fontbody, mime)}) format('woff2');
}`);
    });
  });
});
