<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['from']) || empty($input['to']) || empty($input['family'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: from, to, family']);
    exit(0);
}

$from = trim($input['from']);
$to = trim($input['to']);
$family = trim($input['family']);
$timeframe = isset($input['timeframe']) ? trim($input['timeframe']) : '';

try {
    // 1. Verify that both from and to nodes exist in the nodes table
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM nodes WHERE id = ? AND family = ?");
    
    $checkStmt->execute([$from, $family]);
    $fromExists = $checkStmt->fetchColumn() > 0;

    $checkStmt->execute([$to, $family]);
    $toExists = $checkStmt->fetchColumn() > 0;

    if (!$fromExists || !$toExists) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Bad Request',
            'message' => "Both source node ($from) and target node ($to) must exist in the family '$family' database."
        ]);
        exit(0);
    }

    // 2. Insert or update
    $stmt = $pdo->prepare("
        INSERT INTO paths (
            family, from_node_id, to_node_id, timeframe
        ) VALUES (
            :family, :from, :to, :timeframe
        ) ON DUPLICATE KEY UPDATE
            timeframe = :timeframe2
    ");
    $stmt->execute([
        'family' => $family,
        'from' => $from,
        'to' => $to,
        'timeframe' => $timeframe,
        'timeframe2' => $timeframe
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Path saved successfully.']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to save path',
        'message' => $e->getMessage()
    ]);
}
