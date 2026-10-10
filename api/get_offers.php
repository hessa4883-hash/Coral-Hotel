<?php
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->query("SELECT o.*, b.name_ar as branch_name, b.state as branch_state 
                         FROM `offers` o 
                         LEFT JOIN `branches` b ON o.branch_id = b.id 
                         WHERE o.is_active = 1 
                         ORDER BY o.id ASC");
    $offers = $stmt->fetchAll();

    sendResponse(true, $offers, "تم جلب العروض بنجاح");
} catch (Exception $e) {
    sendResponse(false, null, "خطأ أثناء جلب العروض: " . $e->getMessage(), 500);
}
