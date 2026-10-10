-- Coral Hotel Database Schema (قاعدة بيانات فندق كورال - السودان)
-- متوافقة مع XAMPP / MySQL / MariaDB

CREATE DATABASE IF NOT EXISTS `coral_hotel` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `coral_hotel`;

-- 1. جدول الفروع (Branches)
DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name_ar` VARCHAR(150) NOT NULL,
  `name_en` VARCHAR(150) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `city` VARCHAR(100) NOT NULL,
  `description` TEXT NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `address` VARCHAR(255) NOT NULL,
  `rating` DECIMAL(2,1) DEFAULT 4.9,
  `rooms_count` INT DEFAULT 120,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول الغرف والأجنحة (Rooms)
DROP TABLE IF EXISTS `rooms`;
CREATE TABLE `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `room_type` VARCHAR(50) NOT NULL,
  `price_per_night` DECIMAL(10,2) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 2,
  `beds` VARCHAR(50) NOT NULL DEFAULT 'سرير كينج مزدوج',
  `size_sqm` INT NOT NULL DEFAULT 45,
  `view_type` VARCHAR(100) NOT NULL DEFAULT 'إطلالة بانورامية',
  `image` VARCHAR(500) NOT NULL,
  `amenities` TEXT NOT NULL,
  `status` ENUM('available', 'booked', 'maintenance') DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول العروض الترويجية (Offers)
DROP TABLE IF EXISTS `offers`;
CREATE TABLE `offers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `branch_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `description` TEXT NOT NULL,
  `discount_percent` INT NOT NULL,
  `badge` VARCHAR(50) NOT NULL,
  `original_price` DECIMAL(10,2) NOT NULL,
  `offer_price` DECIMAL(10,2) NOT NULL,
  `image` VARCHAR(500) NOT NULL,
  `valid_until` DATE NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول الحجوزات (Bookings)
DROP TABLE IF EXISTS `bookings`;
CREATE TABLE `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_ref` VARCHAR(50) NOT NULL UNIQUE,
  `branch_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `guest_name` VARCHAR(150) NOT NULL,
  `guest_phone` VARCHAR(50) NOT NULL,
  `guest_email` VARCHAR(100) NOT NULL,
  `guest_national_id` VARCHAR(50) NOT NULL,
  `check_in` DATE NOT NULL,
  `check_out` DATE NOT NULL,
  `total_nights` INT NOT NULL,
  `total_price` DECIMAL(10,2) NOT NULL,
  `payment_method` ENUM('bankak', 'card', 'cash_hotel') DEFAULT 'bankak',
  `payment_status` ENUM('paid', 'pending', 'failed') DEFAULT 'paid',
  `booking_status` ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'confirmed',
  `special_requests` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول المعاملات المالية (Payments)
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `booking_ref` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL,
  `transaction_id` VARCHAR(100) NOT NULL UNIQUE,
  `sender_account` VARCHAR(100) NULL,
  `payment_status` ENUM('success', 'pending', 'failed') DEFAULT 'success',
  `receipt_note` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. جدول سجل النشاطات الإدارية (Activities Log)
DROP TABLE IF EXISTS `activities`;
CREATE TABLE `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action_type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `details` TEXT NOT NULL,
  `branch_name` VARCHAR(100) NULL,
  `icon` VARCHAR(50) DEFAULT 'bell',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. جدول المشرفين ومدراء النظام (Admins)
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إدخال البيانات الأولية للفروع (البحر الأحمر، كسلا، نهر النيل)
INSERT INTO `branches` (`id`, `code`, `name_ar`, `name_en`, `state`, `city`, `description`, `image`, `phone`, `email`, `address`, `rating`, `rooms_count`) VALUES
(1, 'red-sea', 'فندق كورال بورتسودان (البحر الأحمر)', 'Coral Hotel Port Sudan (Red Sea)', 'البحر الأحمر', 'بورتسودان', 'إطلالة خلابة ومباشرة على ساحل البحر الأحمر وشعب المرجان، مع خدمات 5 نجوم، حوض سباحة أولمبي مطل على البحر، ومطعم المأكولات البحرية الطازجة.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', '+249 123 456 781', 'portsudan@coralhotels-sd.com', 'شارع الكورنيش الرئيسي، بورتسودان، ولاية البحر الأحمر', 4.9, 140),
(2, 'kassala', 'فندق كورال كسلا (عروس الشرق)', 'Coral Hotel Kassala', 'كسلا', 'كسلا', 'تجربة سياحية فريدة في أحضان الطبيعة بإطلالة ساحرة ومباشرة على جبال التوتيل وبساتين القاش، تجمع بين كرم الضيافة الشرقية والتصاميم الفندقية الحديثة.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', '+249 123 456 782', 'kassala@coralhotels-sd.com', 'طريق التوتيل السياحي، حي الختمية، كسلا', 4.8, 95),
(3, 'river-nile', 'فندق كورال نهر النيل (عطبرة والدامر)', 'Coral Hotel River Nile', 'نهر النيل', 'عطبرة - الدامر', 'موقع استراتيجي رائع على ضفاف نهر النيل الخالد، واحة من الهدوء والفخامة مع شاليهات نيلية مميزة وحدائق غناء وقاعات اجتماعات ومؤتمرات كبرى.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', '+249 123 456 783', 'rivernile@coralhotels-sd.com', 'شارع النيل الدائري، كورنيش النيل، ولاية نهر النيل', 4.9, 110);

-- إدخال الغرف لكل فرع
INSERT INTO `rooms` (`id`, `branch_id`, `title`, `room_type`, `price_per_night`, `capacity`, `beds`, `size_sqm`, `view_type`, `image`, `amenities`, `status`) VALUES
(1, 1, 'جناح المرجان الملكي (Royal Coral Suite)', 'suite', 185000.00, 3, 'سرير كينج ملكي مزدوج', 75, 'إطلالة مباشرة على مياه البحر الأحمر', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80', 'شرفة خاصة عريضة، جاكوزي خاص، إفطار فاخر مشمول، واي فاي فائق السرعة، صالة جلوس مستقلة، خدمة كونسيرج 24/7', 'available'),
(2, 1, 'غرفة ديلوكس بإطلالة بحرية (Deluxe Sea View)', 'deluxe', 120000.00, 2, 'سرير كينج أو سريرين مفردين', 45, 'إطلالة بحرية مفتوحة', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', 'تراس مطل على البحر، ماكينة قهوة نسبريسو، ميني بار، شاشة تلفزيون ذكية 55 بوصة، خدمة غرف على مدار الساعة', 'available'),
(3, 1, 'غرفة بريميوم عائلية (Premium Family Room)', 'family', 150000.00, 4, 'سريران كوين مزدوجان', 60, 'إطلالة على الحديقة والبحر', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', 'مساحة عائلية واسعة، سرير للأطفال متاح مجاناً، إفطار بوفيه مفتوح، واي فاي مجاني سريع', 'available'),

(4, 2, 'فيلا جبل التوتيل الفاخرة (Totil Mountain Villa)', 'villa', 210000.00, 4, 'سريران كينج منفصلان', 90, 'إطلالة بانورامية ساحرة على جبل التوتيل', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', 'حديقة خاصة مع جلسة شرقية، إطلالة جبلية خيالية، مسبح خاص، جلسة قهوة جبنة كسلاوية تقليدية، خدمة فندقية خاصة', 'available'),
(5, 2, 'جناح الختمية التراثي (Khatmiya Heritage Suite)', 'suite', 140000.00, 2, 'سرير كينج فاخر', 55, 'إطلالة على الطبيعة والخضرة', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80', 'طابع تراثي سوداني فاخر، شرفة واسعة، إفطار بلدي فاخر، أحدث وسائل الراحة والترفيه', 'available'),
(6, 2, 'غرفة ديلوكس كسلا (Deluxe Kassala)', 'deluxe', 95000.00, 2, 'سرير مزدوج مريح', 38, 'إطلالة على حدائق الفندق', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', 'إفطار مجاني، مكتب عمل، تكييف متطور، حمام رخامي متكامل، خدمة تنظيف يومية', 'available'),

(7, 3, 'شاليه النيل البانورامي (Nile Panorama Chalet)', 'chalet', 195000.00, 3, 'سرير كينج ماستر', 70, 'إطلالة مباشرة على مياه نهر النيل العذب', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', 'شرفة نيلية خاصة مع رصيف للقوارب، جاكوزي خارجي، جولة قارب نيلية مجانية، إفطار نيلى مميز', 'available'),
(8, 3, 'جناح الملتقى الرئاسي (Confluence Presidential Suite)', 'suite', 230000.00, 4, 'سريران ملكيان', 85, 'إطلالة على ملتقى النيل والغروب', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80', 'صالة استقبال ملكية، غرفة طعام خاصة، كونسيرج خاص، سيارة استقبال من محطة القطار والمطار مجاناً', 'available'),
(9, 3, 'غرفة رجال الأعمال النيلية (Executive Nile Room)', 'executive', 110000.00, 2, 'سرير كينج مريح', 42, 'إطلالة نيلية هادئة', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80', 'إنترنت فائق السرعة عبر الألياف، مكتب عمل تنفيذي، إمكانية استخدام قاعة الاجتماعات مجاناً لساعتين', 'available');

-- إدخال العروض الترويجية الحصرية
INSERT INTO `offers` (`id`, `branch_id`, `title`, `description`, `discount_percent`, `badge`, `original_price`, `offer_price`, `image`, `valid_until`, `is_active`) VALUES
(1, 1, 'عرض نسمات البحر الأحمر (إقامة 3 ليالٍ بسعر ليلتين)', 'استمتع بإجازة شاطئية استثنائية في بورتسودان مع إفطار مجاني وجولة غوص بين شعب المرجان مع خصم خاص.', 33, 'الأكثر طلباً', 360000.00, 240000.00, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', '2026-11-30', 1),
(2, 2, 'باقة استجمام كسلا وجبل التوتيل العائلية', 'عرض خاص للعائلات والأزواج يشمل الإقامة في فيلا جبل التوتيل مع جلسة قهوة تقليدية وعشاء فاخر وإطلالة خلابة.', 25, 'عرض خاص', 280000.00, 210000.00, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', '2026-12-15', 1),
(3, 3, 'باقة الهدوء النيلي الرومانسية (نهر النيل)', 'عطلة نهاية أسبوع رومانسية على ضفاف النيل في عطبرة تشمل جولة بالقارب عند الغروب وخصم 30% على جميع الوجبات والسبا.', 30, 'خصم 30%', 250000.00, 175000.00, 'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?auto=format&fit=crop&w=800&q=80', '2026-11-20', 1);

-- إدخال حجوزات تجريبية
INSERT INTO `bookings` (`id`, `booking_ref`, `branch_id`, `room_id`, `guest_name`, `guest_phone`, `guest_email`, `guest_national_id`, `check_in`, `check_out`, `total_nights`, `total_price`, `payment_method`, `payment_status`, `booking_status`, `special_requests`, `created_at`) VALUES
(1, 'CR-892104', 1, 1, 'محمد عبد الرحمن الشيخ', '+249 912 345 678', 'm.abdulrahman@gmail.com', '1029384756', '2026-10-15', '2026-10-18', 3, 555000.00, 'bankak', 'paid', 'confirmed', 'طابق علوي وإطلالة مباشرة على الشاطئ', '2026-10-09 14:20:00'),
(2, 'CR-892105', 2, 4, 'د. سارة عثمان التاج', '+249 999 123 456', 'sara.taj@hotmail.com', '1928374650', '2026-10-12', '2026-10-14', 2, 420000.00, 'card', 'paid', 'confirmed', 'تجهيز جلسة القهوة التراثية عند الوصول', '2026-10-10 09:15:00'),
(3, 'CR-892106', 3, 7, 'م. طارق إبراهيم أحمد', '+249 123 789 456', 'tariq.ibrahim@yahoo.com', '1827364520', '2026-10-20', '2026-10-22', 2, 390000.00, 'bankak', 'paid', 'confirmed', 'حجز جولة نيلية بالقارب الساعة 5 مساءً', '2026-10-10 11:30:00');

-- إدخال دفعات تجريبية
INSERT INTO `payments` (`id`, `booking_id`, `booking_ref`, `amount`, `payment_method`, `transaction_id`, `sender_account`, `payment_status`, `receipt_note`, `created_at`) VALUES
(1, 1, 'CR-892104', 555000.00, 'بنكك (Bankak)', 'TXN-BNK-883492', '2456789 (محمد الشيخ)', 'success', 'تم الدفع بنجاح عبر تطبيق بنكك - بنك الخرطوم', '2026-10-09 14:22:00'),
(2, 2, 'CR-892105', 420000.00, 'بطاقة فيزا (Visa Card)', 'TXN-CRD-492810', '**** 4129', 'success', 'تم التفويض الفوري عبر بوابة الدفع الآمنة', '2026-10-10 09:17:00'),
(3, 3, 'CR-892106', 390000.00, 'بنكك (Bankak)', 'TXN-BNK-991204', '1823901 (طارق أحمد)', 'success', 'تم الدفع بنجاح عبر تطبيق بنكك - بنك الخرطوم', '2026-10-10 11:32:00');

-- إدخال سجل النشاطات الحية
INSERT INTO `activities` (`id`, `action_type`, `title`, `details`, `branch_name`, `icon`, `created_at`) VALUES
(1, 'booking_new', 'حجز جديد مؤكد ودفع فوري', 'قام النزيل م. طارق إبراهيم بحجز شاليه النيل البانورامي (رقم المرجع: CR-892106) ودفع 390,000 ج.س عبر تطبيق بنكك.', 'فرع نهر النيل', 'calendar-check', '2026-10-10 11:32:00'),
(2, 'payment_success', 'عملية دفع ناجحة عبر فيزا', 'تمت معالجة دفعة بقيمة 420,000 ج.س للنزيلة د. سارة عثمان لحجز فيلا جبل التوتيل (CR-892105).', 'فرع كسلا', 'credit-card', '2026-10-10 09:17:00'),
(3, 'booking_new', 'حجز مؤكد في جناح المرجان', 'تم تأكيد حجز النزيل محمد عبد الرحمن الشيخ لمدة 3 ليالٍ في فرع البحر الأحمر.', 'فرع البحر الأحمر', 'hotel', '2026-10-09 14:22:00'),
(4, 'rate_update', 'تحديث عروض الموسم الجديد', 'تم تفعيل باقة استجمام كسلا وباقة نسمات البحر الأحمر ونسب الخصم الجديدة بنجاح.', 'جميع الفروع', 'tag', '2026-10-09 10:00:00');

-- إدخال مستخدم المدير الافتراضي (اسم المستخدم: admin | كلمة المرور: admin123)
INSERT INTO `admins` (`id`, `username`, `password`, `full_name`, `role`) VALUES
(1, 'admin', 'admin123', 'مدير عام فنادق كورال السودان', 'Super Admin');
