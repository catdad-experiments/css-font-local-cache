# css-font-local-cache

Allow using fonts linked in your CSS offline by enconding them in base64 into the CSS itself.  I use this for offline-first Electron apps, but you can use it for whatever you want.

## Install

```bash
npm install css-font-loca-cache
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
