const fs = require('fs');
const path = require('path');

// Paths
const dataDir = path.join(__dirname, '../src/assets/data');
const nodesCsvPath = path.join(dataDir, 'nodes.csv');
const pathsCsvPath = path.join(dataDir, 'paths.csv');
const nodesJsonPath = path.join(dataDir, 'career-nodes.json');
const pathsJsonPath = path.join(dataDir, 'career-paths.json');

// Helper to parse CSV line respecting quotes
function parseCsvLine(line) {
    const chars = line.split('');
    const fields = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (char === '"') {
            if (insideQuotes && chars[i + 1] === '"') {
                // Escaped quote
                currentField += '"';
                i++;
            } else {
                // Toggle quotes
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // End of field
            fields.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }
    fields.push(currentField);
    return fields;
}

function parseCsv(content) {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    const header = parseCsvLine(lines[0]).map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (values.length !== header.length) {
            // Handle last empty line if split created it or malformed
            continue;
        }
        const obj = {};
        header.forEach((col, index) => {
            obj[col] = values[index];
        });
        data.push(obj);
    }
    return data;
}

try {
    console.log('Reading CSV files...');
    const nodesRaw = fs.readFileSync(nodesCsvPath, 'utf8');
    const pathsRaw = fs.readFileSync(pathsCsvPath, 'utf8');

    const nodesData = parseCsv(nodesRaw);
    const pathsData = parseCsv(pathsRaw);

    // Process Nodes
    const nodes = nodesData.map(row => {
        // Requirements is a semicolon separated list
        const requirements = row.requirements
            ? row.requirements.split(';').map(r => r.trim()).filter(r => r)
            : [];

        return {
            id: row.id,
            label: row.label,
            department: row.department,
            level: row.level,
            description: row.description,
            requirements: requirements,
            salary: row.salary
        };
    });

    // Valid IDs for integrity check
    const validIds = new Set(nodes.map(n => n.id));

    // Process Paths
    const paths = [];
    pathsData.forEach((row, index) => {
        if (!validIds.has(row.from)) {
            console.warn(`Warning [Row ${index + 2}]: Path 'from' ID "${row.from}" not found in nodes.`);
        }
        if (!validIds.has(row.to)) {
            console.warn(`Warning [Row ${index + 2}]: Path 'to' ID "${row.to}" not found in nodes.`);
        }

        paths.push({
            from: row.from,
            to: row.to,
            timeframe: row.timeframe
        });
    });

    // Write JSON
    fs.writeFileSync(nodesJsonPath, JSON.stringify({ nodes }, null, 2));
    fs.writeFileSync(pathsJsonPath, JSON.stringify({ paths }, null, 2));

    console.log(`Successfully updated JSON files.`);
    console.log(`Processed ${nodes.length} nodes and ${paths.length} paths.`);

} catch (err) {
    console.error('Error updating data:', err);
    process.exit(1);
}
