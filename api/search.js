const { handleApiRequest } = require('../shared/api-router');
const { sendJson, handleCors } = require('./_utils');

module.exports = async (req, res) => {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const result = await handleApiRequest({
      method: req.method,
      pathname: '/api/search',
      query: req.query || {}
    });
    sendJson(res, result.statusCode, result.payload);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message });
  }
};
