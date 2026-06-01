<?php
require_once 'db.php';

header('Content-Type: application/json');

$family = isset($_GET['family']) && $_GET['family'] === 'facility' ? 'facility' : 'care';

try {
    // 1. Fetch nodes
    $nodeStmt = $pdo->prepare("SELECT * FROM nodes WHERE family = ?");
    $nodeStmt->execute([$family]);
    $dbNodes = $nodeStmt->fetchAll();

    $nodes = [];
    foreach ($dbNodes as $row) {
        $nodes[] = [
            'id' => $row['id'],
            'label' => $row['label'],
            'department' => $row['department'],
            'level' => $row['level'],
            'salary' => $row['salary'],
            'description' => $row['description'],
            'requirements' => $row['requirements'],
            'irregularity' => $row['irregularity'],
            'roles' => $row['roles'],
            'werkenbijlink' => $row['werkenbijlink'],
            'careNonCare' => $row['careNonCare'],
            'careCluster' => $row['careCluster'],
            'pioLink' => $row['pioLink'],
            'isRole' => (bool)$row['isRole']
        ];
    }

    // 2. Fetch paths
    $pathStmt = $pdo->prepare("SELECT from_node_id AS `from`, to_node_id AS `to`, timeframe FROM paths WHERE family = ?");
    $pathStmt->execute([$family]);
    $paths = $pathStmt->fetchAll();

    echo json_encode([
        'nodes' => $nodes,
        'paths' => $paths
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to fetch career data',
        'message' => $e->getMessage()
    ]);
}
