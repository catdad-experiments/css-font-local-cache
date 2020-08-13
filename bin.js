#!/usr/bin/env node

const css = require('./src/css.js');

const readStdin = async () => {
  const result = [];

  for await (const chunk of process.stdin) {
    result.push(chunk);
  }

  return Buffer.concat(result);
};

(async () => {
  const text = await readStdin();
  const result = await css(text.toString());

  // eslint-disable-next-line no-console
  console.log(result);
})().catch(e => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
