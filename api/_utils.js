function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, {});
    return true;
  }

  return false;
}

async function parseJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

module.exports = {
  parseJsonBody,
  sendJson,
  handleCors
};
