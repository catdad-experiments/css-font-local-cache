const css = require('css');

const getLocalSrc = async src => {
  const rules = [];

  for (const rule of src.split(',')) {
      const match = rule.trim().match(/^url\(['"]?([^)]+)['"]?\)(.+)?/);

      if (match) {
          const [, url, suffix] = match;
          rules.push(`url(${url})${suffix}`);
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
