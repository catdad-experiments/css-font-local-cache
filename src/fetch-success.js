const fetch = require('node-fetch');

module.exports = async (url, reqHeaders = {}) => {
  const res = await fetch(url, { headers: reqHeaders });

  if (!res.ok) {
    throw new Error(`failed to fetch "${url}": ${res.status} ${res.statusText}`);
  }

  const body = await res.buffer();
  const { status, statusText, headers } = res;

  return { status, statusText, headers, body };
};
