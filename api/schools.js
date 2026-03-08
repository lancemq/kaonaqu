const { handleApiRequest } = require('../shared/api-router');
const { parseJsonBody, sendJson, handleCors } = require('./_utils');

module.exports = async (req, res) => {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const body = req.method === 'GET' || req.method === 'DELETE' ? null : await parseJsonBody(req);
    const result = await handleApiRequest({
      method: req.method,
      pathname: '/api/schools',
      query: req.query || {},
      body
    });
    sendJson(res, result.statusCode, result.payload);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
};
