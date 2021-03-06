#!/usr/bin/env node

const UserAgents = require('user-agents');

const css = require('./src/css.js');
const fetch = require('./src/fetch-success.js');

const [,,cssUrl] = process.argv;

const readStdin = async () => {
  const result = [];

  for await (const chunk of process.stdin) {
    result.push(chunk);
  }

  return Buffer.concat(result);
};

const readUrl = async () => {
  const userAgent = new UserAgents(/Chrome/);

  const { body } = await fetch(cssUrl, {
    'user-agent': userAgent
  });

  return body.toString();
};

(async () => {
  const text = cssUrl ? await readUrl() : await readStdin();
  const result = await css(text.toString());

  // eslint-disable-next-line no-console
  console.log(result);
})().catch(e => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exitCode = 1;
});
