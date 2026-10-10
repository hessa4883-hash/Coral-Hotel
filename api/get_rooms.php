<?php
require_once __DIR__ . '/db.php';

try {
    $branch_id = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : 0;
    $room_type = isset($_GET['room_type']) ? trim($_GET['room_type']) : '';

    $sql = "SELECT r.*, b.name_ar as branch_name, b.state as branch_state 
            FROM `rooms` r 
            JOIN `branches` b ON r.branch_id = b.id 
            WHERE 1=1";
    $params = [];

    if ($branch_id > 0) {
        $sql .= " AND r.branch_id = ?";
        $params[] = $branch_id;
    }

    if (!empty($room_type) && $room_type !== 'all') {
        $sql .= " AND r.room_type = ?";
        $params[] = $room_type;
    }

    $sql .= " ORDER BY r.price_per_night ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rooms = $stmt->fetchAll();

    sendResponse(true, $rooms, "تم جلب الغرف بنجاح");
} catch (Exception $e) {
    sendResponse(false, null, "خطأ أثناء جلب الغرف: " . $e->getMessage(), 500);
}
