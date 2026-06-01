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

try {
    $stmt = $pdo->prepare("DELETE FROM paths WHERE from_node_id = ? AND to_node_id = ? AND family = ?");
    $stmt->execute([$from, $to, $family]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Path deleted successfully.']);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not Found', 'message' => 'Path connection not found.']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to delete path',
        'message' => $e->getMessage()
    ]);
}
