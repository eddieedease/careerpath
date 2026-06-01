<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit(0);
}

// If the execution reaches here, it means the middleware authentication check in db.php passed successfully!
echo json_encode([
    'status' => 'success',
    'message' => 'Geautoriseerd.'
]);
