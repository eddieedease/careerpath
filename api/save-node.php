<?php
require_once 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['id']) || empty($input['label']) || empty($input['family'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: id, label, family']);
    exit(0);
}

$id = trim($input['id']);
$label = trim($input['label']);
$family = trim($input['family']);
$originalId = isset($input['originalId']) ? trim($input['originalId']) : '';

$department = isset($input['department']) ? trim($input['department']) : '';
$level = isset($input['level']) ? trim($input['level']) : '';
$salary = isset($input['salary']) ? trim($input['salary']) : '';
$description = isset($input['description']) ? trim($input['description']) : '';
$requirements = isset($input['requirements']) ? trim($input['requirements']) : '';
$irregularity = isset($input['irregularity']) ? trim($input['irregularity']) : '';
$roles = isset($input['roles']) ? trim($input['roles']) : 'nee';
$werkenbijlink = isset($input['werkenbijlink']) ? trim($input['werkenbijlink']) : '';
$careNonCare = isset($input['careNonCare']) ? trim($input['careNonCare']) : '';
$careCluster = isset($input['careCluster']) ? trim($input['careCluster']) : '';
$pioLink = isset($input['pioLink']) ? trim($input['pioLink']) : '';
$isRole = isset($input['isRole']) && ($input['isRole'] === true || $input['isRole'] === 1 || $input['isRole'] === 'true' || $input['isRole'] === 'ja') ? 1 : 0;

try {
    // If originalId is specified and different from the new ID, we perform a key update
    if (!empty($originalId) && $originalId !== $id) {
        // 1. Verify new ID does not conflict with another existing node (unless it is itself)
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM nodes WHERE id = ? AND id != ?");
        $checkStmt->execute([$id, $originalId]);
        if ($checkStmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'Conflict', 'message' => "The new node ID '$id' is already in use by another function."]);
            exit(0);
        }

        // 2. Perform the update (cascading to paths table)
        $stmt = $pdo->prepare("
            UPDATE nodes SET
                id = :id,
                label = :label,
                department = :department,
                level = :level,
                salary = :salary,
                description = :description,
                requirements = :requirements,
                irregularity = :irregularity,
                roles = :roles,
                werkenbijlink = :werkenbijlink,
                careNonCare = :careNonCare,
                careCluster = :careCluster,
                pioLink = :pioLink,
                isRole = :isRole
            WHERE id = :originalId AND family = :family
        ");
        $stmt->execute([
            'id' => $id,
            'label' => $label,
            'department' => $department,
            'level' => $level,
            'salary' => $salary,
            'description' => $description,
            'requirements' => $requirements,
            'irregularity' => $irregularity,
            'roles' => $roles,
            'werkenbijlink' => $werkenbijlink,
            'careNonCare' => $careNonCare,
            'careCluster' => $careCluster,
            'pioLink' => $pioLink,
            'isRole' => $isRole,
            'originalId' => $originalId,
            'family' => $family
        ]);
        
        echo json_encode(['status' => 'success', 'message' => 'Node updated successfully (ID changed).', 'id' => $id]);
    } else {
        // Normal save (Insert or Update without ID changes)
        $stmt = $pdo->prepare("
            INSERT INTO nodes (
                id, family, label, department, level, salary, description, requirements,
                irregularity, roles, werkenbijlink, careNonCare, careCluster, pioLink, isRole
            ) VALUES (
                :id, :family, :label, :department, :level, :salary, :description, :requirements,
                :irregularity, :roles, :werkenbijlink, :careNonCare, :careCluster, :pioLink, :isRole
            ) ON DUPLICATE KEY UPDATE
                label = :label2,
                department = :department2,
                level = :level2,
                salary = :salary2,
                description = :description2,
                requirements = :requirements2,
                irregularity = :irregularity2,
                roles = :roles2,
                werkenbijlink = :werkenbijlink2,
                careNonCare = :careNonCare2,
                careCluster = :careCluster2,
                pioLink = :pioLink2,
                isRole = :isRole2
        ");
        $stmt->execute([
            'id' => $id,
            'family' => $family,
            'label' => $label,
            'department' => $department,
            'level' => $level,
            'salary' => $salary,
            'description' => $description,
            'requirements' => $requirements,
            'irregularity' => $irregularity,
            'roles' => $roles,
            'werkenbijlink' => $werkenbijlink,
            'careNonCare' => $careNonCare,
            'careCluster' => $careCluster,
            'pioLink' => $pioLink,
            'isRole' => $isRole,
            'label2' => $label,
            'department2' => $department,
            'level2' => $level,
            'salary2' => $salary,
            'description2' => $description,
            'requirements2' => $requirements,
            'irregularity2' => $irregularity,
            'roles2' => $roles,
            'werkenbijlink2' => $werkenbijlink,
            'careNonCare2' => $careNonCare,
            'careCluster2' => $careCluster,
            'pioLink2' => $pioLink,
            'isRole2' => $isRole
        ]);
        
        echo json_encode(['status' => 'success', 'message' => 'Node saved successfully.', 'id' => $id]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to save node',
        'message' => $e->getMessage()
    ]);
}
