<?php
// إعدادات الاتصال بقاعدة بيانات فندق كورال في XAMPP
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "127.0.0.1";
$port = "3306";
$db_name = "coral_hotel";
$username = "root";
$password = ""; // الافتراضي في XAMPP يكون بدون كلمة مرور

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db_name;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // محاولة الاتصال بدون اسم قاعدة البيانات لمعرفة ما إذا كانت القاعدة تحتاج لإنشاء
    try {
        $temp_pdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $username, $password);
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "DatabaseNotFound",
            "message" => "قاعدة البيانات 'coral_hotel' غير موجودة حالياً. يمكنك إنشاؤها تلقائياً بزيارة الرابط: api/setup_db.php أو استيراد ملف coral_hotel.sql في phpMyAdmin.",
            "details" => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit();
    } catch (PDOException $e2) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "ConnectionFailed",
            "message" => "تعذر الاتصال بخادم MySQL في XAMPP. يرجى التأكد من تشغيل Apache و MySQL في لوحة تحكم XAMPP.",
            "details" => $e2->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// دالة مساعدة لإرجاع الرد بصيغة JSON
function sendResponse($success, $data = null, $message = "", $code = 200) {
    http_response_code($code);
    echo json_encode([
        "success" => $success,
        "message" => $message,
        "data" => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
