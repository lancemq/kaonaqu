#!/usr/bin/env node

/**
 * 考哪去 - 上海中考信息平台
 * Web Server for Shanghai Middle School Admission Information
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const WEB_DIR = path.join(__dirname);
const DATA_DIR = path.join(__dirname, '..', 'data');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

// Load data files
let districtsData = {};
let schoolsData = {};
let policiesData = {};

try {
  districtsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'districts.json'), 'utf8'));
  schoolsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'schools.json'), 'utf8'));
  policiesData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'admission-policies.json'), 'utf8'));
} catch (error) {
  console.error('Error loading data files:', error.message);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle API endpoints
  if (pathname.startsWith('/api/')) {
    handleAPIRequest(req, res, parsedUrl);
    return;
  }

  // Handle static files
  let filePath = path.join(WEB_DIR, pathname === '/' ? 'index.html' : pathname.substring(1));
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    
    // Read and serve file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

function handleAPIRequest(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname;
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  try {
    switch (pathname) {
      case '/api/districts':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(districtsData));
        break;
        
      case '/api/schools':
        const district = parsedUrl.query.district;
        if (district) {
          const filteredSchools = schoolsData.filter(school => school.district === district);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(filteredSchools));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(schoolsData));
        }
        break;
        
      case '/api/policies':
        const policyDistrict = parsedUrl.query.district;
        if (policyDistrict) {
          const filteredPolicies = policiesData.filter(policy => policy.district === policyDistrict);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(filteredPolicies));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(policiesData));
        }
        break;
        
      case '/api/search':
        const query = parsedUrl.query.q || '';
        const searchResults = schoolsData.filter(school => 
          school.name.toLowerCase().includes(query.toLowerCase()) ||
          school.district.toLowerCase().includes(query.toLowerCase())
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(searchResults));
        break;
        
      default:
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
    }
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

server.listen(PORT, () => {
  console.log(`考哪去 - 上海中考信息平台`);
  console.log(`==================================`);
  console.log(`🚀 Web Server running at http://localhost:${PORT}`);
  console.log(`📊 数据包含: ${Object.keys(districtsData).length}个区, ${schoolsData.length}所学校, ${policiesData.length}条政策`);
  console.log(`📁 项目目录: ${path.join(__dirname, '..')}`);
  console.log(`💡 提示: 按 Ctrl+C 停止服务器`);
  console.log(`==================================`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已停止');
    process.exit(0);
  });
});