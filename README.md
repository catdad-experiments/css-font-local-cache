# css-font-local-cache

[![github actions test][github-actions-test.svg]][github-actions-test.link]
[![npm downloads][npm-downloads.svg]][npm.link]
[![npm version][npm-version.svg]][npm.link]

[github-actions-test.link]: https://github.com/catdad-experiments/css-font-local-cache/actions?query=workflow%3Atest
[github-actions-test.svg]: https://github.com/catdad-experiments/css-font-local-cache/workflows/test/badge.svg
[npm-downloads.svg]: https://img.shields.io/npm/dm/css-font-local-cache.svg
[npm.link]: https://www.npmjs.com/package/css-font-local-cache
[npm-version.svg]: https://img.shields.io/npm/v/css-font-local-cache.svg

Allow using fonts linked in your CSS offline by enconding them in base64 into the CSS itself.  I use this for offline-first Electron apps, but you can use it for whatever you want.

## Install

```bash
npm install css-font-local-cache
```

## API

```javascript
const { promises: fs } = require('fs');
const cssFontCache = require('css-font-local-cache');

(async () => {
  const input = await fs.readFile('./css-with-links.css', 'utf8');
  const output = await cssFontCache(input);
  await fs.writeFile('./css-with-base64-fonts.css', output);
})();
```

## CLI

Encode CSS you already have on disk:

```bash
npx css-font-local-cache < css-with-links.css > css-with-base64-fonts.css
```

Encode CSS from a remote location:

```bash
npx css-font-loca-cache http://example.com/my-css > css-with-base64-fontd.css
```
