<?php
require_once __DIR__ . '/db.php';

try {
    $stmt = $pdo->query("SELECT * FROM `branches` ORDER BY `id` ASC");
    $branches = $stmt->fetchAll();

    // إرفاق عدد الغرف المتاحة لكل فرع
    foreach ($branches as &$branch) {
        $countStmt = $pdo->prepare("SELECT COUNT(*) as available_count FROM `rooms` WHERE `branch_id` = ? AND `status` = 'available'");
        $countStmt->execute([$branch['id']]);
        $res = $countStmt->fetch();
        $branch['available_rooms'] = (int)($res['available_count'] ?? 0);
    }

    sendResponse(true, $branches, "تم جلب الفروع بنجاح");
} catch (Exception $e) {
    sendResponse(false, null, "خطأ أثناء جلب الفروع: " . $e->getMessage(), 500);
}
