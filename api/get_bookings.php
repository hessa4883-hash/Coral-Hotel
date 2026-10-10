<?php
require_once __DIR__ . '/db.php';

try {
    $ref = isset($_GET['ref']) ? trim($_GET['ref']) : '';
    $phone = isset($_GET['phone']) ? trim($_GET['phone']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $branch_id = isset($_GET['branch_id']) ? (int)$_GET['branch_id'] : 0;

    $sql = "SELECT b.*, br.name_ar as branch_name, br.state as branch_state, r.title as room_title, r.room_type, r.image as room_image 
            FROM `bookings` b 
            JOIN `branches` br ON b.branch_id = br.id 
            JOIN `rooms` r ON b.room_id = r.id 
            WHERE 1=1";
    $params = [];

    if (!empty($ref)) {
        $sql .= " AND b.booking_ref = ?";
        $params[] = $ref;
    }

    if (!empty($phone)) {
        $sql .= " AND b.guest_phone LIKE ?";
        $params[] = "%$phone%";
    }

    if (!empty($status) && $status !== 'all') {
        $sql .= " AND b.booking_status = ?";
        $params[] = $status;
    }

    if ($branch_id > 0) {
        $sql .= " AND b.branch_id = ?";
        $params[] = $branch_id;
    }

    $sql .= " ORDER BY b.id DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $bookings = $stmt->fetchAll();

    sendResponse(true, $bookings, "تم جلب الحجوزات بنجاح");
} catch (Exception $e) {
    sendResponse(false, null, "خطأ أثناء جلب الحجوزات: " . $e->getMessage(), 500);
}
