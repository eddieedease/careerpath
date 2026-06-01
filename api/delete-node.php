<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['id']) || empty($input['family'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: id, family']);
    exit(0);
}

$id = trim($input['id']);
$family = trim($input['family']);

try {
    $stmt = $pdo->prepare("DELETE FROM nodes WHERE id = ? AND family = ?");
    $stmt->execute([$id, $family]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'message' => "Node '$id' and its associated paths were successfully deleted."]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not Found', 'message' => "Node '$id' in family '$family' was not found."]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to delete node',
        'message' => $e->getMessage()
    ]);
}
