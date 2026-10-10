<?php
require_once __DIR__ . '/db.php';

try {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    if ($limit <= 0 || $limit > 100) $limit = 20;

    $stmt = $pdo->prepare("SELECT * FROM `activities` ORDER BY `id` DESC LIMIT ?");
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $activities = $stmt->fetchAll();

    sendResponse(true, $activities, "تم جلب سجل النشاطات بنجاح");
} catch (Exception $e) {
    sendResponse(false, null, "خطأ أثناء جلب النشاطات: " . $e->getMessage(), 500);
}
