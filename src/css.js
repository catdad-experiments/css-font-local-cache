const css = require('css');
const fetch = require('node-fetch');
const FileType = require('file-type');

const getBase64Response = async url => {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`failed to fetch "${url}": ${res.status} ${res.statusText}`);
  }

  const buffer = await res.buffer();
  const { mime } = await FileType.fromBuffer(buffer);

  return `data:${mime};charset=utf-8;base64,${buffer.toString('base64')}`;
};

const getLocalSrc = async src => {
  const rules = [];

  for (const rule of src.split(',')) {
      const match = rule.trim().match(/^url\(['"]?([^)]+)['"]?\)(.+)?/);

      if (match) {
          const [, url, suffix] = match;
          rules.push(`url(${await getBase64Response(url)})${suffix}`);
      }
  }

  return rules.length ? rules.join(' ,') : src;
};

const mutateFontFace = async rule => {
  for (const declaration of rule.declarations) {
    if (declaration.property === 'src') {
      declaration.value = await getLocalSrc(declaration.value);
    }
  }
};

module.exports = async text => {
  const ast = css.parse(text);

  for (const rule of ast.stylesheet.rules) {
    if (rule.type === 'font-face') {
      await mutateFontFace(rule);
    }
  }

  return css.stringify(ast);
};
