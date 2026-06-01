<?php
// CORS Headers - Required for Angular development server (port 4200) to communicate with API (port 8000)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Password");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Handle preflight OPTIONS request
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Database Configuration (env variables loaded from Docker Compose)
$host = getenv('DB_HOST') ?: 'db';
$dbname = getenv('DB_NAME') ?: 'careerpath';
$username = getenv('DB_USER') ?: 'career_user';
$password = getenv('DB_PASS') ?: 'career_pass';

// Admin Authentication Configuration
$adminPassword = getenv('ADMIN_PASSWORD') ?: 'admin123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // Return structured JSON error for connection failure
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'Database connection failed',
        'message' => $e->getMessage()
    ]);
    exit(1);
}

// Authenticate modifications (POST/PUT/DELETE requests)
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $token = '';
    
    // Retrieve case-insensitive header
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'x-admin-password') {
                $token = $value;
                break;
            }
        }
    }
    
    if (empty($token) && isset($_SERVER['HTTP_X_ADMIN_PASSWORD'])) {
        $token = $_SERVER['HTTP_X_ADMIN_PASSWORD'];
    }

    if ($token !== $adminPassword) {
        header('Content-Type: application/json');
        http_response_code(401);
        echo json_encode([
            'error' => 'Unauthorized',
            'message' => 'Ongeldig of ontbrekend beheerder wachtwoord.'
        ]);
        exit(0);
    }
}
