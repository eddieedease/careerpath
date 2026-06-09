<?php
require_once 'db.php';

header('Content-Type: application/json');

$family = isset($_GET['family']) && $_GET['family'] === 'facility' ? 'facility' : 'care';

try {
    // 1. Fetch paths of requested family
    $pathStmt = $pdo->prepare("SELECT from_node_id AS `from`, to_node_id AS `to`, timeframe FROM paths WHERE family = ?");
    $pathStmt->execute([$family]);
    $paths = $pathStmt->fetchAll();

    // 2. Fetch nodes of requested family
    $nodeStmt = $pdo->prepare("SELECT * FROM nodes WHERE family = ?");
    $nodeStmt->execute([$family]);
    $dbNodes = $nodeStmt->fetchAll();

    // 3. Find referenced nodes that are not in the fetched nodes list
    $fetchedNodeIds = array_column($dbNodes, 'id');
    $referencedNodeIds = [];
    foreach ($paths as $path) {
        $referencedNodeIds[] = $path['from'];
        $referencedNodeIds[] = $path['to'];
    }
    $referencedNodeIds = array_unique($referencedNodeIds);
    $missingNodeIds = array_diff($referencedNodeIds, $fetchedNodeIds);

    // 4. Fetch missing referenced nodes (cross-family)
    if (!empty($missingNodeIds)) {
        $placeholders = implode(',', array_fill(0, count($missingNodeIds), '?'));
        $missingStmt = $pdo->prepare("SELECT * FROM nodes WHERE id IN ($placeholders)");
        $missingStmt->execute(array_values($missingNodeIds));
        $missingNodes = $missingStmt->fetchAll();
        $dbNodes = array_merge($dbNodes, $missingNodes);
    }

    $nodes = [];
    foreach ($dbNodes as $row) {
        $nodes[] = [
            'id' => $row['id'],
            'family' => $row['family'],
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
