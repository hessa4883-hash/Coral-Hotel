<?php
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, "طريقة الطلب غير صالحة، مطلوب POST", 405);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    $data = $_POST;
}

$booking_id = (int)($data['booking_id'] ?? 0);
$new_status = trim($data['booking_status'] ?? '');

$allowed = ['confirmed', 'checked_in', 'checked_out', 'cancelled'];
if (!$booking_id || !in_array($new_status, $allowed)) {
    sendResponse(false, null, "بيانات غير صالحة أو حالة غير مسموح بها", 400);
}

try {
    // جلب بيانات الحجز
    $stmt = $pdo->prepare("SELECT b.*, br.name_ar as branch_name FROM `bookings` b JOIN `branches` br ON b.branch_id = br.id WHERE b.id = ?");
    $stmt->execute([$booking_id]);
    $booking = $stmt->fetch();

    if (!$booking) {
        sendResponse(false, null, "الحجز غير موجود", 404);
    }

    $updateStmt = $pdo->prepare("UPDATE `bookings` SET `booking_status` = ? WHERE `id` = ?");
    $updateStmt->execute([$new_status, $booking_id]);

    $statusNames = [
        'confirmed' => 'مؤكد',
        'checked_in' => 'تم تسجيل الوصول (Check-in)',
        'checked_out' => 'تم تسجيل المغادرة (Check-out)',
        'cancelled' => 'ملغي'
    ];
    $statusText = $statusNames[$new_status] ?? $new_status;

    // تسجيل في الأنشطة
    $actStmt = $pdo->prepare("INSERT INTO `activities` (`action_type`, `title`, `details`, `branch_name`, `icon`) VALUES (?, ?, ?, ?, ?)");
    $actStmt->execute([
        'status_update',
        "تحديث حالة الحجز ({$booking['booking_ref']})",
        "تم تغيير حالة حجز النزيل {$booking['guest_name']} إلى '$statusText'.",
        $booking['branch_name'],
        'refresh-cw'
    ]);

    sendResponse(true, ["booking_id" => $booking_id, "booking_status" => $new_status], "تم تحديث حالة الحجز بنجاح");
} catch (Exception $e) {
    sendResponse(false, null, "خطأ أثناء تحديث حالة الحجز: " . $e->getMessage(), 500);
}
