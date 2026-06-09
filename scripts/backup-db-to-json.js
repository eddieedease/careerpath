const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE_URL = 'http://localhost:8000';
const DATA_DIR = path.join(__dirname, '../src/assets/data');

const filesConfig = {
  care: {
    nodes: path.join(DATA_DIR, 'career-nodes.json'),
    paths: path.join(DATA_DIR, 'career-paths.json')
  },
  facility: {
    nodes: path.join(DATA_DIR, 'career-nodes_fac.json'),
    paths: path.join(DATA_DIR, 'career-paths_fac.json')
  }
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Request failed with status code ${res.statusCode}`));
        return;
      }
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(rawData));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runBackup() {
  console.log('Starting database to JSON backup...');
  
  for (const family of ['care', 'facility']) {
    try {
      const url = `${API_BASE_URL}/get-data.php?family=${family}`;
      console.log(`Fetching ${family} data from ${url}...`);
      
      const data = await fetchJson(url);
      
      // Map node keys back to their original JSON names for backward compatibility
      const mappedNodes = (data.nodes || [])
        .filter(node => node.family === family)
        .map(node => {
        const item = {
          id: node.id,
          label: node.label,
          department: node.department,
          level: node.level,
          salary: node.salary,
          description: node.description,
          requirements: node.requirements,
          irregularity: node.irregularity,
          roles: node.roles || 'nee',
          werkenbijlink: node.werkenbijlink,
          "Care/non care": node.careNonCare || '',
          "Care cluster": node.careCluster || '',
          "Link naar PIO werkenbij (ter bespreking)": node.pioLink || ''
        };
        
        // Only keep isRole if it is explicitly set
        if (node.isRole) {
          item.isRole = true;
        }
        
        return item;
      });

      const nodesPath = filesConfig[family].nodes;
      const pathsPath = filesConfig[family].paths;

      // Write nodes JSON
      fs.writeFileSync(nodesPath, JSON.stringify({ nodes: mappedNodes }, null, 2), 'utf8');
      console.log(`Saved: ${nodesPath} (${mappedNodes.length} nodes)`);

      // Write paths JSON
      const mappedPaths = (data.paths || []).map(path => ({
        from: path.from,
        to: path.to,
        timeframe: path.timeframe || ''
      }));
      fs.writeFileSync(pathsPath, JSON.stringify({ paths: mappedPaths }, null, 2), 'utf8');
      console.log(`Saved: ${pathsPath} (${mappedPaths.length} paths)`);

    } catch (err) {
      console.error(`Error backing up family '${family}':`, err.message);
      console.error('Make sure the Docker environment is running (`docker-compose up -d`)');
      process.exit(1);
    }
  }
  
  console.log('Backup completed successfully!');
}

runBackup();
