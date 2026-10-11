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

$required = ['branch_id', 'room_id', 'guest_name', 'guest_phone', 'check_in', 'check_out', 'total_price'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        sendResponse(false, null, "الحقل المطلوب مفقود: $field", 400);
    }
}

try {
    $pdo->beginTransaction();

    $bookingRef = 'CR-' . rand(100000, 999999);

    $branch_id = (int)$data['branch_id'];
    $room_id = (int)$data['room_id'];
    $guest_name = trim($data['guest_name']);
    $guest_phone = trim($data['guest_phone']);
    $guest_email = trim($data['guest_email'] ?? '');
    $residency_type = trim($data['residency_type'] ?? 'local');
    $guest_national_id = trim($data['guest_national_id'] ?? '');
    $guest_passport = trim($data['guest_passport'] ?? '');
    $nationality = trim($data['nationality'] ?? 'سوداني');
    $check_in = trim($data['check_in']);
    $check_out = trim($data['check_out']);
    $total_nights = (int)($data['total_nights'] ?? 1);
    $currency = trim($data['currency'] ?? 'SDG');
    $total_price = (float)$data['total_price'];
    $payment_method = trim($data['payment_method'] ?? 'bankak');
    $special_requests = trim($data['special_requests'] ?? '');

    $stmt = $pdo->prepare("INSERT INTO `bookings` 
        (`booking_ref`, `branch_id`, `room_id`, `guest_name`, `guest_phone`, `guest_email`, `residency_type`, `guest_national_id`, `guest_passport`, `nationality`, `check_in`, `check_out`, `total_nights`, `currency`, `total_price`, `payment_method`, `payment_status`, `booking_status`, `special_requests`) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'confirmed', ?)");
    
    $stmt->execute([
        $bookingRef, $branch_id, $room_id, $guest_name, $guest_phone, $guest_email,
        $residency_type, $guest_national_id, $guest_passport, $nationality,
        $check_in, $check_out, $total_nights, $currency, $total_price,
        $payment_method, $special_requests
    ]);

    $booking_id = $pdo->lastInsertId();

    // جلب اسم الفرع والغرفة
    $bStmt = $pdo->prepare("SELECT name_ar FROM `branches` WHERE id = ?");
    $bStmt->execute([$branch_id]);
    $branchName = $bStmt->fetchColumn() ?: 'فندق كورال';

    $rStmt = $pdo->prepare("SELECT title FROM `rooms` WHERE id = ?");
    $rStmt->execute([$room_id]);
    $roomTitle = $rStmt->fetchColumn() ?: 'غرفة فندقية';

    // تسجيل في الأنشطة
    $actStmt = $pdo->prepare("INSERT INTO `activities` (`action_type`, `title`, `details`, `branch_name`, `icon`) VALUES (?, ?, ?, ?, ?)");
    $actStmt->execute([
        'booking_new',
        "حجز جديد مؤكد ($bookingRef)",
        "النزيل $guest_name ($nationality) قام بحجز $roomTitle في $branchName بقيمة " . number_format($total_price) . " $currency.",
        $branchName,
        'calendar-check'
    ]);

    // تسجيل رسالة البريد الإلكتروني في جدول الرسائل
    $emailSubject = "تأكيد حجزك في فندق كورال السودان - رقم الحجز: $bookingRef";
    $emailBody = "مرحباً $guest_name، تم تأكيد حجزك في $branchName برقم مرجعي: $bookingRef. تاريخ الوصول: $check_in. المبلغ: " . number_format($total_price) . " $currency.";
    $emailStmt = $pdo->prepare("INSERT INTO `emails_log` (`booking_ref`, `recipient_name`, `recipient_email`, `subject`, `body_html`) VALUES (?, ?, ?, ?, ?)");
    $emailStmt->execute([$bookingRef, $guest_name, $guest_email, $emailSubject, $emailBody]);

    $pdo->commit();

    sendResponse(true, [
        "booking_id" => $booking_id,
        "booking_ref" => $bookingRef,
        "guest_name" => $guest_name,
        "guest_phone" => $guest_phone,
        "guest_email" => $guest_email,
        "branch_name" => $branchName,
        "room_title" => $roomTitle,
        "check_in" => $check_in,
        "check_out" => $check_out,
        "total_nights" => $total_nights,
        "currency" => $currency,
        "total_price" => $total_price,
        "payment_method" => $payment_method,
        "booking_status" => "confirmed"
    ], "تم إنشاء وتأكيد الحجز بنجاح وإرسال رسالة التأكيد");

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, null, "فشل إنشاء الحجز: " . $e->getMessage(), 500);
}
