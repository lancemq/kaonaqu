const fs = require('fs');
const path = require('path');

// API路由处理
const routes = {
  // 获取所有区域数据
  '/api/districts': () => {
    const data = fs.readFileSync(path.join(__dirname, '..', 'data', 'districts.json'), 'utf8');
    return JSON.parse(data);
  },
  
  // 获取所有学校数据
  '/api/schools': () => {
    const data = fs.readFileSync(path.join(__dirname, '..', 'data', 'schools.json'), 'utf8');
    return JSON.parse(data);
  },
  
  // 获取招生政策数据
  '/api/policies': () => {
    const data = fs.readFileSync(path.join(__dirname, '..', 'data', 'admission-policies.json'), 'utf8');
    return JSON.parse(data);
  },
  
  // 根据区域获取学校
  '/api/schools-by-district': (params) => {
    const district = params.district;
    const schoolsData = fs.readFileSync(path.join(__dirname, '..', 'data', 'schools.json'), 'utf8');
    const schools = JSON.parse(schoolsData);
    
    if (district) {
      return schools.filter(school => school.district === district);
    }
    return schools;
  },
  
  // 根据区域获取招生政策
  '/api/policies-by-district': (params) => {
    const district = params.district;
    const policiesData = fs.readFileSync(path.join(__dirname, '..', 'data', 'admission-policies.json'), 'utf8');
    const policies = JSON.parse(policiesData);
    
    if (district) {
      return policies.filter(policy => policy.district === district);
    }
    return policies;
  },
  
  // 搜索学校
  '/api/search-schools': (params) => {
    const query = params.q || '';
    const schoolsData = fs.readFileSync(path.join(__dirname, '..', 'data', 'schools.json'), 'utf8');
    const schools = JSON.parse(schoolsData);
    
    if (!query) {
      return schools;
    }
    
    return schools.filter(school => 
      school.name.toLowerCase().includes(query.toLowerCase()) ||
      school.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }
};

module.exports = { routes };