const { loadData } = require('../shared/api-data');
const { sendJson, handleCors } = require('./_utils');

module.exports = async (req, res) => {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const { news } = await loadData();
    sendJson(res, 200, news);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
