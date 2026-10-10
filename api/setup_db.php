<?php
// معالج التثبيت التلقائي لقاعدة بيانات فندق كورال في XAMPP
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/html; charset=UTF-8");

$host = "127.0.0.1";
$port = "3306";
$username = "root";
$password = "";

$sqlFile = __DIR__ . '/../coral_hotel.sql';

?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تثبيت قاعدة بيانات فندق كورال - XAMPP</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Cairo', sans-serif; background: #0b1329; color: #fff; padding: 40px 20px; text-align: center; }
        .card { max-width: 650px; margin: auto; background: #152244; padding: 30px; border-radius: 16px; border: 1px solid #d4af37; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        h1 { color: #d4af37; font-size: 26px; margin-bottom: 10px; }
        p { color: #cbd5e1; line-height: 1.8; }
        .btn { display: inline-block; background: linear-gradient(135deg, #d4af37, #b8860b); color: #000; padding: 12px 30px; border-radius: 30px; text-decoration: none; font-weight: bold; margin-top: 20px; cursor: pointer; border: none; font-size: 16px; }
        .btn:hover { background: #ffd700; }
        .status-box { text-align: right; background: #0b1329; padding: 20px; border-radius: 10px; margin-top: 20px; border: 1px solid #334155; font-family: monospace; direction: ltr; max-height: 250px; overflow-y: auto; color: #10b981; }
        .success-badge { display: inline-block; padding: 8px 16px; background: #065f46; color: #34d399; border-radius: 20px; font-weight: bold; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🏢 تهيئة قاعدة بيانات فندق كورال (XAMPP)</h1>
        <p>هذه الصفحة تقوم بقراءة ملف <code>coral_hotel.sql</code> وإنشاء الجداول والبيانات الأولية لفروع البحر الأحمر، كسلا، ونهر النيل تلقائياً.</p>

        <?php
        if (isset($_POST['install']) || isset($_GET['auto'])) {
            try {
                $pdo = new PDO("mysql:host=$host;port=$port;charset=utf8mb4", $username, $password, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);

                if (!file_exists($sqlFile)) {
                    throw new Exception("الملف coral_hotel.sql غير موجود في المجلد الرئيسي!");
                }

                $sql = file_get_contents($sqlFile);
                $pdo->exec($sql);

                echo '<div class="success-badge">✅ تم إنشاء وتثبيت قاعدة البيانات بنجاح!</div>';
                echo '<p>تم استيراد الجداول (الفروع، الغرف، العروض، الحجوزات، المدفوعات، سجل النشاطات) بنجاح.</p>';
                echo '<div class="status-box">Database coral_hotel created successfully.<br>Tables imported and initial data seeded.</div>';
                echo '<a href="../index.html" class="btn" style="margin-left: 10px;">الذهاب إلى شاشة النزيل</a>';
                echo '<a href="../admin.html" class="btn">الذهاب إلى لوحة الإدارة</a>';
            } catch (Exception $e) {
                echo '<div style="background: #7f1d1d; color: #fca5a5; padding: 15px; border-radius: 10px; margin-top: 15px;">';
                echo '<strong>❌ حدث خطأ أثناء التثبيت:</strong><br>' . htmlspecialchars($e->getMessage());
                echo '</div>';
            }
        } else {
            echo '<form method="POST">';
            echo '<button type="submit" name="install" value="1" class="btn">اضغط هنا لإنشاء قاعدة البيانات الآن</button>';
            echo '</form>';
        }
        ?>
    </div>
</body>
</html>
