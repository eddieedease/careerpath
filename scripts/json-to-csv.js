const fs = require('fs');
const path = require('path');

const nodesPath = path.join(__dirname, '../src/assets/data/career-nodes.json');
const pathsPath = path.join(__dirname, '../src/assets/data/career-paths.json');
const nodesCsvPath = path.join(__dirname, '../src/assets/data/nodes.csv');
const pathsCsvPath = path.join(__dirname, '../src/assets/data/paths.csv');

function toCsv(data, columns) {
    const header = columns.join(',');
    const rows = data.map(item => {
        return columns.map(col => {
            let val = item[col] || '';
            if (Array.isArray(val)) {
                val = val.join(';');
            }
            // Escape quotes and wrap in quotes if contains comma or quote
            val = String(val).replace(/"/g, '""');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                val = `"${val}"`;
            }
            return val;
        }).join(',');
    });
    return [header, ...rows].join('\n');
}

try {
    // Convert Nodes
    if (fs.existsSync(nodesPath)) {
        const nodesData = JSON.parse(fs.readFileSync(nodesPath, 'utf8')).nodes;
        // Derive columns from data or use fixed list (fixed is safer for order)
        const nodesColumns = ['id', 'label', 'department', 'level', 'salary', 'description', 'requirements'];
        fs.writeFileSync(nodesCsvPath, toCsv(nodesData, nodesColumns));
        console.log('nodes.csv created');
    } else {
        console.warn('career-nodes.json not found');
    }

    // Convert Paths
    if (fs.existsSync(pathsPath)) {
        const pathsData = JSON.parse(fs.readFileSync(pathsPath, 'utf8')).paths;
        const pathsColumns = ['from', 'to', 'timeframe'];
        fs.writeFileSync(pathsCsvPath, toCsv(pathsData, pathsColumns));
        console.log('paths.csv created');
    } else {
        console.warn('career-paths.json not found');
    }
} catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
}
