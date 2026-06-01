<?php
require_once 'db.php';

header('Content-Type: application/json');

try {
    // 1. Recreate Tables
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    $pdo->exec("DROP TABLE IF EXISTS paths;");
    $pdo->exec("DROP TABLE IF EXISTS nodes;");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    $pdo->exec("
        CREATE TABLE nodes (
            id VARCHAR(100) PRIMARY KEY,
            family VARCHAR(20) NOT NULL,
            label VARCHAR(255) NOT NULL,
            department VARCHAR(255) DEFAULT '',
            level VARCHAR(255) DEFAULT '',
            salary VARCHAR(50) DEFAULT '',
            description TEXT,
            requirements TEXT,
            irregularity VARCHAR(100) DEFAULT '',
            roles VARCHAR(50) DEFAULT '',
            werkenbijlink TEXT,
            careNonCare VARCHAR(50) DEFAULT '',
            careCluster VARCHAR(100) DEFAULT '',
            pioLink TEXT,
            isRole TINYINT(1) DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE paths (
            id INT AUTO_INCREMENT PRIMARY KEY,
            family VARCHAR(20) NOT NULL,
            from_node_id VARCHAR(100) NOT NULL,
            to_node_id VARCHAR(100) NOT NULL,
            timeframe VARCHAR(100) DEFAULT '',
            UNIQUE KEY unique_path (from_node_id, to_node_id, family),
            FOREIGN KEY (from_node_id) REFERENCES nodes(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (to_node_id) REFERENCES nodes(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    echo json_encode(['status' => 'success', 'message' => 'Tables created successfully. Starting data migration...']) . "\n";

    // 2. Helper to insert Nodes
    $nodeStmt = $pdo->prepare("
        INSERT IGNORE INTO nodes (
            id, family, label, department, level, salary, description, requirements,
            irregularity, roles, werkenbijlink, careNonCare, careCluster, pioLink, isRole
        ) VALUES (
            :id, :family, :label, :department, :level, :salary, :description, :requirements,
            :irregularity, :roles, :werkenbijlink, :careNonCare, :careCluster, :pioLink, :isRole
        )
    ");

    // 3. Helper to insert Paths
    $pathStmt = $pdo->prepare("
        INSERT IGNORE INTO paths (
            family, from_node_id, to_node_id, timeframe
        ) VALUES (
            :family, :from, :to, :timeframe
        )
    ");

    $migratedNodes = 0;
    $migratedPaths = 0;

    // Define families and their respective source JSON paths (inside container)
    $families = [
        'care' => [
            'nodes' => '/var/www/html/json_data/career-nodes.json',
            'paths' => '/var/www/html/json_data/career-paths.json'
        ],
        'facility' => [
            'nodes' => '/var/www/html/json_data/career-nodes_fac.json',
            'paths' => '/var/www/html/json_data/career-paths_fac.json'
        ]
    ];

    foreach ($families as $familyName => $sources) {
        // Nodes Migration
        if (file_exists($sources['nodes'])) {
            $nodesJson = json_decode(file_get_contents($sources['nodes']), true);
            $nodeList = $nodesJson['nodes'] ?? [];

            foreach ($nodeList as $node) {
                // Ensure requirements is stored as a semicolon separated list string
                $reqs = $node['requirements'] ?? '';
                if (is_array($reqs)) {
                    $reqs = implode('; ', $reqs);
                }

                $isRoleValue = 0;
                if (isset($node['isRole'])) {
                    $isRoleValue = ($node['isRole'] === true || $node['isRole'] === 'ja' || $node['isRole'] === 'true' || $node['isRole'] === 1) ? 1 : 0;
                } else if (isset($node['roles'])) {
                    // Fallback to roles property (excluding BAZ nodes which are functions)
                    $isRoleValue = ($node['roles'] === 'ja' && strpos($node['id'], 'baz') === false) ? 1 : 0;
                }

                $nodeStmt->execute([
                    'id' => $node['id'],
                    'family' => $familyName,
                    'label' => $node['label'] ?? '',
                    'department' => $node['department'] ?? '',
                    'level' => $node['level'] ?? '',
                    'salary' => $node['salary'] ?? '',
                    'description' => $node['description'] ?? '',
                    'requirements' => $reqs,
                    'irregularity' => $node['irregularity'] ?? '',
                    'roles' => $node['roles'] ?? 'nee',
                    'werkenbijlink' => $node['werkenbijlink'] ?? '',
                    'careNonCare' => $node['Care/non care'] ?? $node['careNonCare'] ?? '',
                    'careCluster' => $node['Care cluster'] ?? $node['careCluster'] ?? '',
                    'pioLink' => $node['Link naar PIO werkenbij (ter bespreking)'] ?? $node['pioLink'] ?? '',
                    'isRole' => $isRoleValue
                ]);
                $migratedNodes++;
            }
        } else {
            echo json_encode(['status' => 'warning', 'message' => "Source nodes file for family '$familyName' not found at: {$sources['nodes']}"]) . "\n";
        }

        // Paths Migration
        if (file_exists($sources['paths'])) {
            $pathsJson = json_decode(file_get_contents($sources['paths']), true);
            $pathList = $pathsJson['paths'] ?? [];

            foreach ($pathList as $path) {
                // Double check that both from and to nodes exist before inserting path
                $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM nodes WHERE id = ?");
                $checkStmt->execute([$path['from']]);
                $fromExists = $checkStmt->fetchColumn() > 0;

                $checkStmt->execute([$path['to']]);
                $toExists = $checkStmt->fetchColumn() > 0;

                if ($fromExists && $toExists) {
                    $pathStmt->execute([
                        'family' => $familyName,
                        'from' => $path['from'],
                        'to' => $path['to'],
                        'timeframe' => $path['timeframe'] ?? ''
                    ]);
                    $migratedPaths++;
                } else {
                    // Skip paths referencing missing nodes, outputting warning
                    error_log("Skipping path '{$path['from']}' -> '{$path['to']}' because one or both nodes do not exist.");
                }
            }
        } else {
            echo json_encode(['status' => 'warning', 'message' => "Source paths file for family '$familyName' not found at: {$sources['paths']}"]) . "\n";
        }
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Migration completed successfully!',
        'nodes_migrated' => $migratedNodes,
        'paths_migrated' => $migratedPaths
    ]) . "\n";

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Migration failed: ' . $e->getMessage()
    ]) . "\n";
}
