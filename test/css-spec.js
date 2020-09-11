const http = require('http');

const { expect } = require('chai');
const getPort = require('get-port');
const safe = require('safe-await');

module.exports = (convert) => {
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

  it('returns a css string with fonts in @font-face transformed', async () => {
    const fontname = '/font-1.woff2';
    const fontbody = 'this is not a real font but it is fine';
    const mime = 'font/not-really';

    const css = `@font-face {
  font-family: 'Fake Font';
  src: url(http://localhost:${port}${fontname}) format('woff2');
}`;

    requests[fontname] = {
      body: fontbody,
      headers: {
        'content-type': mime
      }
    };

    const result = await convert(css);

    expect(result).to.equal(`@font-face {
  font-family: 'Fake Font';
  src: url(${base64(fontbody, mime)}) format('woff2');
}`);
  });

  it('removes local font definitions when fetching the @font-face font', async () => {
    const fontname = '/font-1.woff2';
    const fontbody = 'this is not a real font but it is fine';
    const mime = 'font/not-really';

    const css = `@font-face {
  font-family: 'Fake Font';
  src: local('Fake Font Regular'), local('FakeFont-Regular'), url(http://localhost:${port}${fontname}) format('woff2');
}`;

    requests[fontname] = {
      body: fontbody,
      headers: {
        'content-type': mime
      }
    };

    const result = await convert(css);

    expect(result).to.equal(`@font-face {
  font-family: 'Fake Font';
  src: url(${base64(fontbody, mime)}) format('woff2');
}`);
  });

  it('returns the original css string if no @font-face is present', async () => {
    const css = `.a {
  display: block;
  height: 12;
}`;

    const result = await convert(css);

    expect(result).to.equal(css);
  });

  it('returns the original css string if @font-face elements do not contain fonts', async () => {
    const css = `@font-face {
  font-family: 'Fake Font';
  src: local('Fake Font Regular'), local('FakeFont-Regular');
}`;

    const result = await convert(css);

    expect(result).to.equal(css);
  });

  it('errors if it cannot fetch a defined font', async () => {
    const fontname = `/font-${Math.random()}.woff2`;

    const css = `@font-face {
  font-family: 'Fake Font';
  src: url(http://localhost:${port}${fontname}) format('woff2');
}`;

    const [err] = await safe(convert(css));

    expect(err).to.be.instanceOf(Error)
      .and.to.have.property('message', `failed to fetch "http://localhost:${port}${fontname}": 404 Not Found`);
  });
};
