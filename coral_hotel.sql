-- Coral Hotel Database Schema (قاعدة بيانات فندق كورال - السودان)
-- متوافقة مع XAMPP / MySQL / MariaDB
-- الفروع: الخرطوم (المقر الرئيسي)، البحر الأحمر (بورتسودان)، كسلا، نهر النيل (عطبرة فقط)

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
  `residency_type` ENUM('local', 'foreign') DEFAULT 'local',
  `guest_national_id` VARCHAR(50) NULL,
  `guest_passport` VARCHAR(50) NULL,
  `nationality` VARCHAR(100) DEFAULT 'سوداني',
  `check_in` DATE NOT NULL,
  `check_out` DATE NOT NULL,
  `total_nights` INT NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'SDG',
  `total_price` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'bankak',
  `payment_status` ENUM('paid', 'pending', 'failed') DEFAULT 'paid',
  `booking_status` ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'confirmed',
  `special_requests` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول سجل رسائل البريد الإلكتروني التأكيدية (Emails Log)
DROP TABLE IF EXISTS `emails_log`;
CREATE TABLE `emails_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_ref` VARCHAR(50) NOT NULL,
  `recipient_name` VARCHAR(150) NOT NULL,
  `recipient_email` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` TEXT NOT NULL,
  `status` VARCHAR(20) DEFAULT 'delivered',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. جدول النشاطات الإدارية (Activities Log)
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

-- 7. جدول مدراء النظام السرية (Admins)
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'Super Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إدخال الفروع الأربعة: الخرطوم (المقر الرئيسي)، البحر الأحمر، كسلا، ونهر النيل (عطبرة فقط)
INSERT INTO `branches` (`id`, `code`, `name_ar`, `name_en`, `state`, `city`, `description`, `image`, `phone`, `email`, `address`, `rating`, `rooms_count`) VALUES
(1, 'khartoum', 'فندق كورال الخرطوم (المقر الرئيسي)', 'Coral Hotel Khartoum (Headquarters)', 'الخرطوم', 'الخرطوم', 'المقر الرئيسي وفخامة الضيافة الدبلوماسية على شارع النيل قبالة ملتقى النيلين الأزرق والأبيض، مع مراكز مؤتمرات دولية وخدمات VIP متكاملة.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', '+249 183 774 100', 'khartoum@coralhotels-sd.com', 'شارع النيل، الخرطوم، السودان', 4.9, 220),
(2, 'red-sea', 'فندق كورال بورتسودان (البحر الأحمر)', 'Coral Hotel Port Sudan (Red Sea)', 'البحر الأحمر', 'بورتسودان', 'إطلالة بحرية ساحرة على ساحل البحر الأحمر وشعب المرجان مع خدمات 5 نجوم، مسبح إنفينيتي لا متناهي ومطعم المأكولات البحرية.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', '+249 123 456 781', 'portsudan@coralhotels-sd.com', 'شارع الكورنيش الرئيسي، بورتسودان، ولاية البحر الأحمر', 4.9, 140),
(3, 'kassala', 'فندق كورال كسلا (عروس الشرق)', 'Coral Hotel Kassala (Bride of the East)', 'كسلا', 'كسلا', 'تجربة سياحية فريدة في أحضان الطبيعة بإطلالة ساحرة ومباشرة على جبال التوتيل وبساتين القاش، تجمع بين كرم الضيافة وجلسات القهوة التراثية.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', '+249 123 456 782', 'kassala@coralhotels-sd.com', 'طريق التوتيل السياحي، حي الختمية، كسلا', 4.8, 95),
(4, 'river-nile', 'فندق كورال عطبرة (ولاية نهر النيل)', 'Coral Hotel Atbara (River Nile State)', 'نهر النيل', 'عطبرة', 'موقع استراتيجي رائع على كورنيش النيل بمدينة عطبرة بولاية نهر النيل، يضم شاليهات نيلية أنيقة، ورصيف قوارب خاص وقاعات رجال الأعمال.', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', '+249 123 456 783', 'atbara@coralhotels-sd.com', 'شارع الكورنيش النيلي، عطبرة، ولاية نهر النيل', 4.9, 110);

-- إدخال الغرف
INSERT INTO `rooms` (`id`, `branch_id`, `title`, `room_type`, `price_per_night`, `capacity`, `beds`, `size_sqm`, `view_type`, `image`, `amenities`, `status`) VALUES
(101, 1, 'الجناح الرئاسي الدبلوماسي (Diplomatic Nile Suite)', 'suite', 220000.00, 3, 'سرير كينج ملكي مزدوج', 85, 'إطلالة بانورامية على النيل الأزرق بالخرطوم', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80', 'شرفة نيلية واسعة، جاكوزي خاص، صالة كبار الشخصيات، بوفيه إفطار مفتوح، كونسيرج 24/7', 'available'),
(102, 1, 'غرفة رجال الأعمال التنفيذية (Executive Business Room)', 'executive', 140000.00, 2, 'سرير كينج فاخر', 48, 'إطلالة على شارع النيل وحدائق الفندق', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', 'مكتب عمل تنفيذي، إنترنت فائق السرعة، دخول صالة رجال الأعمال، ماكينة قهوة نسبريسو', 'available'),
(201, 2, 'جناح المرجان الملكي (Royal Coral Suite)', 'suite', 185000.00, 3, 'سرير كينج ملكي مزدوج', 75, 'إطلالة مباشرة على مياه وشواطئ البحر الأحمر', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80', 'شرفة بحرية عريضة، جاكوزي خاص، إفطار بوفيه بحري، واي فاي فائق السرعة، جلسة غوص مجانية', 'available'),
(202, 2, 'غرفة ديلوكس بإطلالة بحرية (Deluxe Sea View)', 'deluxe', 120000.00, 2, 'سرير كينج أو سريرين', 45, 'إطلالة شاطئية مفتوحة', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', 'تراس مطل على البحر، ماكينة قهوة، ميني بار، شاشة 55 بوصة، خدمة غرف على مدار الساعة', 'available'),
(301, 3, 'فيلا جبل التوتيل الفاخرة (Totil Mountain Villa)', 'villa', 210000.00, 4, 'سريران كينج منفصلان', 90, 'إطلالة بانورامية ساحرة على جبل التوتيل', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', 'حديقة خاصة مع جلسة شرقية، إطلالة جبلية خيالية، مسبح خاص، جلسة قهوة جبنة كسلاوية، خدمة VIP', 'available'),
(302, 3, 'جناح الختمية التراثي (Khatmiya Heritage Suite)', 'suite', 135000.00, 2, 'سرير كينج فاخر', 55, 'إطلالة على بساتين القاش والخضرة', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80', 'طابع تراثي سوداني فاخر، شرفة واسعة، إفطار بلدي فاخر، أحدث وسائل الراحة والترفيه', 'available'),
(401, 4, 'شاليه النيل البانورامي (Nile Panorama Chalet)', 'chalet', 195000.00, 3, 'سرير كينج ماستر', 70, 'إطلالة مباشرة على مياه نهر النيل بعطبرة', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80', 'رصيف خشبي خاص على النيل، جاكوزي خارجي، جولة قارب نيلية مجانية، إفطار نيلى مميز', 'available'),
(402, 4, 'غرفة ديلوكس عطبرة النيلية (Atbara Deluxe Room)', 'deluxe', 110000.00, 2, 'سرير كينج مريح', 42, 'إطلالة نيلية هادئة', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80', 'إفطار مجاني، مكتب عمل، إنترنت سريع، استقبال مجاني من محطة قطار عطبرة التاريخية', 'available');

-- إدخال مستخدم المدير السري (معرف المدير: CORAL-ADMIN أو admin | كلمة المرور: coral2026 أو admin123)
INSERT INTO `admins` (`id`, `admin_id`, `password`, `full_name`, `role`) VALUES
(1, 'CORAL-ADMIN', 'coral2026', 'المدير العام لفنادق كورال السودان', 'Super Admin'),
(2, 'admin', 'admin123', 'مشرف العمليات المركزية', 'Operations Admin');

-- إدخال عينات الحجوزات السودانية الحقيقية
INSERT INTO `bookings` (`id`, `booking_ref`, `branch_id`, `room_id`, `guest_name`, `guest_phone`, `guest_email`, `residency_type`, `guest_national_id`, `guest_passport`, `nationality`, `check_in`, `check_out`, `total_nights`, `currency`, `total_price`, `payment_method`, `payment_status`, `booking_status`, `special_requests`, `created_at`) VALUES
(1, 'CR-772901', 1, 101, 'محمد أحمد إبراهيم الشيخ', '0912345678', 'm.ahmed.sheikh@gmail.com', 'local', '1029384756', NULL, 'سوداني', '2026-10-15', '2026-10-18', 3, 'SDG', 660000.00, 'bankak', 'paid', 'confirmed', 'طابق علوي وإطلالة مباشرة على النيل واستقبال من المطار', '2026-10-11 11:20:00'),
(2, 'CR-892104', 2, 201, 'فاطمة عثمان التاج عبد الكريم', '0991234567', 'fatima.taj@hotmail.com', 'local', '1928374650', NULL, 'سوداني', '2026-10-14', '2026-10-16', 2, 'SDG', 370000.00, 'card', 'paid', 'confirmed', 'تجهيز جلسة إفطار شاطئية وتنسيق جولة الغوص', '2026-10-11 14:15:00'),
(3, 'CR-892105', 3, 301, 'مهند عبد الله الفاتح ميرغني', '0123456789', 'mohanad.alfatih@yahoo.com', 'local', '1827364520', NULL, 'سوداني', '2026-10-16', '2026-10-19', 3, 'SDG', 630000.00, 'bankak', 'paid', 'checked_in', 'جلسة قهوة الجبنة في الحديقة عند الوصول مع العائلة', '2026-10-11 16:40:00'),
(4, 'CR-920415', 4, 401, 'د. إدوارد ويليامز (Dr. Edward Williams)', '+44 7911 123456', 'e.williams@nile-expeditions.org', 'foreign', NULL, 'GB-90214819', 'بريطاني', '2026-10-20', '2026-10-24', 4, 'USD', 312.00, 'card', 'paid', 'confirmed', 'Nile research tour arrangement & English speaking concierge', '2026-10-12 00:30:00');
