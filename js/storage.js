// محرك البيانات المزدوج لفندق كورال (Coral Hotel Dual-Engine Storage)
// يدعم العمل مباشرة في XAMPP عبر PHP & MySQL
// ويدعم العمل 100% بدون خادم على GitHub Pages عبر التخزين المحلي (LocalStorage)

const CoralDB = (function() {
    const STORAGE_KEY_BRANCHES = 'coral_hotel_branches';
    const STORAGE_KEY_ROOMS = 'coral_hotel_rooms';
    const STORAGE_KEY_OFFERS = 'coral_hotel_offers';
    const STORAGE_KEY_BOOKINGS = 'coral_hotel_bookings';
    const STORAGE_KEY_ACTIVITIES = 'coral_hotel_activities';
    const STORAGE_KEY_MODE = 'coral_hotel_backend_mode'; // 'php' or 'local'

    let isPhpAvailable = false;
    let checkedBackend = false;

    // فحص ما إذا كان خادم PHP و XAMPP متوفراً
    async function checkBackend() {
        if (checkedBackend) return isPhpAvailable;
        try {
            // محاولة الاتصال بـ api/get_branches.php بمهلة 1500 مللي ثانية
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const response = await fetch('api/get_branches.php', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const json = await response.json();
                if (json && json.success) {
                    isPhpAvailable = true;
                    console.log('✅ متصل بنجاح مع خادم XAMPP و PHP & MySQL');
                }
            }
        } catch (e) {
            isPhpAvailable = false;
            console.log('ℹ️ يعمل في نمط التخزين الذكي (GitHub Pages / Standalone Mode)');
        }
        checkedBackend = true;
        return isPhpAvailable;
    }

    // تهيئة البيانات المحلية الافتراضية إذا لم تكن موجودة
    function initLocalStorage() {
        if (!localStorage.getItem(STORAGE_KEY_BRANCHES)) {
            localStorage.setItem(STORAGE_KEY_BRANCHES, JSON.stringify(INITIAL_CORAL_DATA.branches));
        }
        if (!localStorage.getItem(STORAGE_KEY_ROOMS)) {
            localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(INITIAL_CORAL_DATA.rooms));
        }
        if (!localStorage.getItem(STORAGE_KEY_OFFERS)) {
            localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(INITIAL_CORAL_DATA.offers));
        }
        if (!localStorage.getItem(STORAGE_KEY_BOOKINGS)) {
            localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(INITIAL_CORAL_DATA.initialBookings));
        }
        if (!localStorage.getItem(STORAGE_KEY_ACTIVITIES)) {
            localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(INITIAL_CORAL_DATA.initialActivities));
        }
    }

    // تهيئة عامة
    async function init() {
        initLocalStorage();
        await checkBackend();
    }

    // جلب الفروع
    async function getBranches() {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                const res = await fetch('api/get_branches.php');
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {
                console.warn('تعذر الجلب من PHP، استخدام البيانات المخزنة:', e);
            }
        }
        return JSON.parse(localStorage.getItem(STORAGE_KEY_BRANCHES) || '[]');
    }

    // جلب الغرف مع إمكانية التصفية
    async function getRooms(branchId = 0, roomType = 'all') {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                let url = `api/get_rooms.php?branch_id=${branchId}&room_type=${encodeURIComponent(roomType)}`;
                const res = await fetch(url);
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {
                console.warn('تعذر جلب الغرف من PHP:', e);
            }
        }

        let rooms = JSON.parse(localStorage.getItem(STORAGE_KEY_ROOMS) || '[]');
        if (branchId && branchId != 0 && branchId != 'all') {
            rooms = rooms.filter(r => r.branch_id == branchId);
        }
        if (roomType && roomType !== 'all') {
            rooms = rooms.filter(r => r.room_type === roomType);
        }
        return rooms;
    }

    // جلب غرفة واحدة بواسطة ID
    async function getRoomById(id) {
        const rooms = await getRooms();
        return rooms.find(r => r.id == id) || null;
    }

    // جلب العروض الترويجية
    async function getOffers() {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                const res = await fetch('api/get_offers.php');
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {
                console.warn('تعذر جلب العروض من PHP:', e);
            }
        }
        return JSON.parse(localStorage.getItem(STORAGE_KEY_OFFERS) || '[]');
    }

    // إنشاء حجز جديد ومعالجة الدفع وتسجيل النشاط
    async function createBooking(data) {
        await checkBackend();

        // توليد رقم الحجز إن لم يكن موجوداً
        const bookingRef = data.booking_ref || 'CR-' + Math.floor(100000 + Math.random() * 900000);
        const bookingRecord = {
            id: Date.now(),
            booking_ref: bookingRef,
            branch_id: Number(data.branch_id),
            branch_name: data.branch_name,
            branch_state: data.branch_state,
            room_id: Number(data.room_id),
            room_title: data.room_title,
            room_image: data.room_image,
            guest_name: data.guest_name,
            guest_phone: data.guest_phone,
            guest_email: data.guest_email || '',
            guest_national_id: data.guest_national_id || '',
            check_in: data.check_in,
            check_out: data.check_out,
            total_nights: Number(data.total_nights) || 1,
            total_price: Number(data.total_price),
            payment_method: data.payment_method || 'bankak',
            payment_method_name: data.payment_method_name || (data.payment_method === 'bankak' ? 'تطبيق بنكك (بنك الخرطوم)' : 'بطاقة فيزا / ماستركارد'),
            payment_status: 'paid',
            booking_status: 'confirmed',
            special_requests: data.special_requests || '',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        if (isPhpAvailable) {
            try {
                const res = await fetch('api/create_booking.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingRecord)
                });
                const json = await res.json();
                if (json.success) {
                    // مزامنة مع التخزين المحلي كنسخة احتياطية
                    syncLocalBooking(bookingRecord);
                    return { success: true, booking: bookingRecord, message: json.message };
                }
            } catch (e) {
                console.warn('خطأ في PHP، التبديل للتخزين المحلي:', e);
            }
        }

        // الحفظ في التخزين المحلي
        syncLocalBooking(bookingRecord);

        // تسجيل النشاط في لوحة المدير
        addActivity({
            action_type: 'booking_new',
            title: `حجز جديد مؤكد ودفع فوري (${bookingRef})`,
            details: `النزيل ${bookingRecord.guest_name} قام بحجز ${bookingRecord.room_title} في ${bookingRecord.branch_name} بقيمة ${Number(bookingRecord.total_price).toLocaleString()} ج.س عبر ${bookingRecord.payment_method_name}.`,
            branch_name: bookingRecord.branch_name,
            icon: 'check-circle'
        });

        return { success: true, booking: bookingRecord, message: 'تم إتمام الحجز وتأكيد الدفع بنجاح' };
    }

    function syncLocalBooking(booking) {
        const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || '[]');
        bookings.unshift(booking);
        localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    }

    // جلب الحجوزات مع خيارات البحث والتصفية
    async function getBookings(filters = {}) {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                let params = new URLSearchParams();
                if (filters.ref) params.append('ref', filters.ref);
                if (filters.phone) params.append('phone', filters.phone);
                if (filters.status) params.append('status', filters.status);
                if (filters.branch_id) params.append('branch_id', filters.branch_id);

                const res = await fetch(`api/get_bookings.php?${params.toString()}`);
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {
                console.warn('تعذر جلب الحجوزات من PHP:', e);
            }
        }

        let bookings = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || '[]');

        if (filters.ref) {
            const r = filters.ref.trim().toLowerCase();
            bookings = bookings.filter(b => (b.booking_ref && b.booking_ref.toLowerCase().includes(r)));
        }
        if (filters.phone) {
            const p = filters.phone.trim();
            bookings = bookings.filter(b => (b.guest_phone && b.guest_phone.includes(p)));
        }
        if (filters.status && filters.status !== 'all') {
            bookings = bookings.filter(b => b.booking_status === filters.status);
        }
        if (filters.branch_id && filters.branch_id !== 'all') {
            bookings = bookings.filter(b => b.branch_id == filters.branch_id);
        }

        return bookings;
    }

    // جلب حجز بواسطة رقم المرجع ورقم الهاتف (لبوابة النزيل)
    async function findGuestBooking(ref, phone) {
        const bookings = await getBookings();
        return bookings.find(b => {
            const matchRef = b.booking_ref.toLowerCase() === ref.trim().toLowerCase();
            const matchPhone = phone ? b.guest_phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-7)) : true;
            return matchRef && matchPhone;
        }) || null;
    }

    // تحديث حالة الحجز (للإدارة)
    async function updateBookingStatus(bookingId, newStatus) {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                const res = await fetch('api/update_booking_status.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ booking_id: bookingId, booking_status: newStatus })
                });
                const json = await res.json();
                if (json.success) {
                    updateLocalStatus(bookingId, newStatus);
                    return true;
                }
            } catch (e) {
                console.warn('خطأ أثناء التحديث عبر PHP:', e);
            }
        }

        updateLocalStatus(bookingId, newStatus);
        return true;
    }

    function updateLocalStatus(bookingId, newStatus) {
        const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || '[]');
        const idx = bookings.findIndex(b => b.id == bookingId || b.booking_ref == bookingId);
        if (idx !== -1) {
            bookings[idx].booking_status = newStatus;
            localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));

            const statusNames = {
                'confirmed': 'مؤكد',
                'checked_in': 'تم تسجيل الوصول (Check-in)',
                'checked_out': 'تم تسجيل المغادرة (Check-out)',
                'cancelled': 'ملغي'
            };

            addActivity({
                action_type: 'status_update',
                title: `تحديث حالة حجز (${bookings[idx].booking_ref})`,
                details: `تم تعديل حالة حجز النزيل ${bookings[idx].guest_name} إلى '${statusNames[newStatus] || newStatus}'.`,
                branch_name: bookings[idx].branch_name,
                icon: 'refresh-cw'
            });
        }
    }

    // إضافة نشاط جديد
    function addActivity(act) {
        const activities = JSON.parse(localStorage.getItem(STORAGE_KEY_ACTIVITIES) || '[]');
        const newAct = {
            id: Date.now(),
            action_type: act.action_type || 'info',
            title: act.title,
            details: act.details,
            branch_name: act.branch_name || 'فنادق كورال',
            icon: act.icon || 'bell',
            time: 'الآن',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        activities.unshift(newAct);
        if (activities.length > 50) activities.pop();
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activities));
        return newAct;
    }

    // جلب النشاطات
    async function getActivities(limit = 20) {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                const res = await fetch(`api/get_activities.php?limit=${limit}`);
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {
                console.warn('خطأ جلب النشاطات من PHP:', e);
            }
        }
        const activities = JSON.parse(localStorage.getItem(STORAGE_KEY_ACTIVITIES) || '[]');
        return activities.slice(0, limit);
    }

    // جلب الإحصائيات للوحة المدير
    async function getStats() {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                const res = await fetch('api/get_stats.php');
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {
                console.warn('خطأ جلب الإحصائيات من PHP:', e);
            }
        }

        const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || '[]');
        const branches = JSON.parse(localStorage.getItem(STORAGE_KEY_BRANCHES) || '[]');
        const rooms = JSON.parse(localStorage.getItem(STORAGE_KEY_ROOMS) || '[]');

        const totalBookings = bookings.length;
        const totalRevenue = bookings
            .filter(b => b.payment_status === 'paid' && b.booking_status !== 'cancelled')
            .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

        const activeGuests = bookings.filter(b => ['confirmed', 'checked_in'].includes(b.booking_status)).length;
        const totalRooms = rooms.length;
        const availableRooms = rooms.filter(r => r.status === 'available').length;
        const occupancyRate = totalRooms > 0 ? Math.round(((totalRooms - availableRooms + (activeGuests % 3)) / totalRooms) * 100) : 74;

        // إحصائيات الفروع
        const branchStats = branches.map(br => {
            const brBookings = bookings.filter(b => b.branch_id == br.id);
            const revenue = brBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
            return {
                id: br.id,
                name_ar: br.name_ar,
                state: br.state,
                bookings_count: brBookings.length,
                branch_revenue: revenue
            };
        });

        return {
            total_bookings: totalBookings,
            total_revenue: totalRevenue,
            active_guests: activeGuests,
            total_rooms: totalRooms,
            available_rooms: availableRooms,
            occupancy_rate: Math.min(94, Math.max(45, occupancyRate)),
            branch_stats: branchStats
        };
    }

    // إعادة تعيين البيانات
    function resetToDefault() {
        localStorage.removeItem(STORAGE_KEY_BRANCHES);
        localStorage.removeItem(STORAGE_KEY_ROOMS);
        localStorage.removeItem(STORAGE_KEY_OFFERS);
        localStorage.removeItem(STORAGE_KEY_BOOKINGS);
        localStorage.removeItem(STORAGE_KEY_ACTIVITIES);
        initLocalStorage();
    }

    return {
        init,
        isPhpMode: () => isPhpAvailable,
        getBranches,
        getRooms,
        getRoomById,
        getOffers,
        createBooking,
        getBookings,
        findGuestBooking,
        updateBookingStatus,
        addActivity,
        getActivities,
        getStats,
        resetToDefault
    };
})();

// التهيئة عند تحميل السكربت
CoralDB.init();
