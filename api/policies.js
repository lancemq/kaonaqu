const { loadData, filterPolicies } = require('../shared/api-data');
const { sendJson, handleCors } = require('./_utils');

module.exports = async (req, res) => {
  if (handleCors(req, res)) {
    return;
  }

  try {
    const { policies } = await loadData();
    const districtId = req.query?.district || req.query?.districtId || null;
    sendJson(res, 200, filterPolicies(policies, districtId));
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
