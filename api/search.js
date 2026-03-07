const { loadData, searchSchools } = require('../shared/api-data');
const { sendJson, handleCors } = require('./_utils');

module.exports = (req, res) => {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const { schools } = loadData();
    const query = req.query?.q || '';
    sendJson(res, 200, searchSchools(schools, query));
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
