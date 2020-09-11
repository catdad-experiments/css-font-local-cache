const css = require('css');
const fetch = require('./fetch-success.js');

const getBase64Response = async url => {
  const { body, headers } = await fetch(url);

  const mime = headers.get('content-type');

  return `data:${mime};charset=utf-8;base64,${body.toString('base64')}`;
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
  let ast;

  try {
    ast = css.parse(text);
  } catch (err) {
    throw new Error('the provided text is not valid css');
  }

  for (const rule of ast.stylesheet.rules) {
    if (rule.type === 'font-face') {
      await mutateFontFace(rule);
    }
  }

  return css.stringify(ast);
};
