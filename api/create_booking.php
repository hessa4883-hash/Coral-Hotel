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

// التحقق من الحقول الأساسية
$required = ['branch_id', 'room_id', 'guest_name', 'guest_phone', 'check_in', 'check_out', 'total_price'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        sendResponse(false, null, "الحقل المطلوب مفقود: $field", 400);
    }
}

try {
    $pdo->beginTransaction();

    // توليد رقم مرجعي فريد
    $bookingRef = 'CR-' . rand(100000, 999999);

    $branch_id = (int)$data['branch_id'];
    $room_id = (int)$data['room_id'];
    $guest_name = trim($data['guest_name']);
    $guest_phone = trim($data['guest_phone']);
    $guest_email = trim($data['guest_email'] ?? '');
    $guest_national_id = trim($data['guest_national_id'] ?? '');
    $check_in = trim($data['check_in']);
    $check_out = trim($data['check_out']);
    $total_nights = (int)($data['total_nights'] ?? 1);
    $total_price = (float)$data['total_price'];
    $payment_method = trim($data['payment_method'] ?? 'bankak');
    $special_requests = trim($data['special_requests'] ?? '');

    // إدراج الحجز
    $stmt = $pdo->prepare("INSERT INTO `bookings` 
        (`booking_ref`, `branch_id`, `room_id`, `guest_name`, `guest_phone`, `guest_email`, `guest_national_id`, `check_in`, `check_out`, `total_nights`, `total_price`, `payment_method`, `payment_status`, `booking_status`, `special_requests`) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'confirmed', ?)");
    
    $stmt->execute([
        $bookingRef, $branch_id, $room_id, $guest_name, $guest_phone, $guest_email,
        $guest_national_id, $check_in, $check_out, $total_nights, $total_price,
        $payment_method, $special_requests
    ]);

    $booking_id = $pdo->lastInsertId();

    // إدراج الدفعة
    $txnId = 'TXN-' . strtoupper(substr($payment_method, 0, 3)) . '-' . rand(100000, 999999);
    $senderAcc = $data['sender_account'] ?? ($payment_method === 'bankak' ? 'حساب بنكك للمستخدم' : 'بطاقة مصرفية');
    
    $payStmt = $pdo->prepare("INSERT INTO `payments` 
        (`booking_id`, `booking_ref`, `amount`, `payment_method`, `transaction_id`, `sender_account`, `payment_status`, `receipt_note`) 
        VALUES (?, ?, ?, ?, ?, ?, 'success', ?)");
    
    $methodNameAr = $payment_method === 'bankak' ? 'تطبيق بنكك' : ($payment_method === 'card' ? 'بطاقة بنكية' : 'دفع إلكتروني');
    $payStmt->execute([
        $booking_id, $bookingRef, $total_price, $payment_method, $txnId, $senderAcc,
        "تم الدفع بنجاح عبر $methodNameAr"
    ]);

    // جلب اسم الفرع والغرفة لتسجيل النشاط
    $bStmt = $pdo->prepare("SELECT name_ar FROM `branches` WHERE id = ?");
    $bStmt->execute([$branch_id]);
    $branchName = $bStmt->fetchColumn() ?: 'أحد فروع كورال';

    $rStmt = $pdo->prepare("SELECT title FROM `rooms` WHERE id = ?");
    $rStmt->execute([$room_id]);
    $roomTitle = $rStmt->fetchColumn() ?: 'غرفة فندقية';

    // تسجيل النشاط
    $actStmt = $pdo->prepare("INSERT INTO `activities` (`action_type`, `title`, `details`, `branch_name`, `icon`) VALUES (?, ?, ?, ?, ?)");
    $actStmt->execute([
        'booking_new',
        "حجز جديد مؤكد ($bookingRef)",
        "النزيل $guest_name قام بحجز $roomTitle في $branchName بقيمة " . number_format($total_price) . " ج.س عبر $methodNameAr.",
        $branchName,
        'calendar-check'
    ]);

    $pdo->commit();

    sendResponse(true, [
        "booking_id" => $booking_id,
        "booking_ref" => $bookingRef,
        "transaction_id" => $txnId,
        "guest_name" => $guest_name,
        "guest_phone" => $guest_phone,
        "branch_name" => $branchName,
        "room_title" => $roomTitle,
        "check_in" => $check_in,
        "check_out" => $check_out,
        "total_nights" => $total_nights,
        "total_price" => $total_price,
        "payment_method" => $payment_method,
        "payment_status" => "paid",
        "booking_status" => "confirmed"
    ], "تم إنشاء وتأكيد الحجز بنجاح ودفع المبلغ بالكامل");

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    sendResponse(false, null, "فشل إنشاء الحجز: " . $e->getMessage(), 500);
}
