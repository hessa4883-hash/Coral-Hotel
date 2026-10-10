<?php
require_once __DIR__ . '/db.php';

try {
    // إجمالي الحجوزات
    $totalBookings = (int)$pdo->query("SELECT COUNT(*) FROM `bookings`")->fetchColumn();

    // إجمالي الإيرادات
    $totalRevenue = (float)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM `payments` WHERE `payment_status` = 'success'")->fetchColumn();

    // عدد النزلاء الحاليين (المؤكدين أو المسجلين)
    $activeGuests = (int)$pdo->query("SELECT COUNT(*) FROM `bookings` WHERE `booking_status` IN ('confirmed', 'checked_in')")->fetchColumn();

    // عدد الغرف المتاحة
    $totalRooms = (int)$pdo->query("SELECT COUNT(*) FROM `rooms`")->fetchColumn();
    $availableRooms = (int)$pdo->query("SELECT COUNT(*) FROM `rooms` WHERE `status` = 'available'")->fetchColumn();

    // إحصائيات حسب الفرع
    $branchStatsStmt = $pdo->query("
        SELECT b.id, b.name_ar, b.state,
               COUNT(bk.id) as bookings_count,
               COALESCE(SUM(bk.total_price), 0) as branch_revenue
        FROM `branches` b
        LEFT JOIN `bookings` bk ON b.id = bk.branch_id
        GROUP BY b.id, b.name_ar, b.state
    ");
    $branchStats = $branchStatsStmt->fetchAll();

    // نسبة الإشغال التقديرية
    $occupancyRate = $totalRooms > 0 ? round((($totalRooms - $availableRooms) / $totalRooms) * 100, 1) : 68;

    sendResponse(true, [
        "total_bookings" => $totalBookings,
        "total_revenue" => $totalRevenue,
        "active_guests" => $activeGuests,
        "total_rooms" => $totalRooms,
        "available_rooms" => $availableRooms,
        "occupancy_rate" => $occupancyRate,
        "branch_stats" => $branchStats
    ], "تم جلب الإحصائيات بنجاح");
} catch (Exception $e) {
    sendResponse(false, null, "خطأ أثناء جلب الإحصائيات: " . $e->getMessage(), 500);
}
