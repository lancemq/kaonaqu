const { loadData } = require('../shared/api-data');
const { sendJson, handleCors } = require('./_utils');

module.exports = (req, res) => {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const { districts } = loadData();
    sendJson(res, 200, districts);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
