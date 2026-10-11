// ========================================================
// محرك البيانات المزدوج لفندق كورال (Coral Hotel Dual-Engine Storage)
// يدعم XAMPP (MySQL & PHP) و GitHub Pages (التخزين الذكي)
// يدعم العملات المتعددة (SDG, USD, SAR)، اللغتين (AR, EN)، وبوابة المدير السرية
// ========================================================

const CoralDB = (function() {
    const STORAGE_KEY_BRANCHES = 'coral_hotel_branches_v2';
    const STORAGE_KEY_ROOMS = 'coral_hotel_rooms_v2';
    const STORAGE_KEY_OFFERS = 'coral_hotel_offers_v2';
    const STORAGE_KEY_BOOKINGS = 'coral_hotel_bookings_v2';
    const STORAGE_KEY_ACTIVITIES = 'coral_hotel_activities_v2';
    const STORAGE_KEY_EMAILS = 'coral_hotel_emails_v2';
    const STORAGE_KEY_CURRENCY = 'coral_hotel_currency';
    const STORAGE_KEY_LANG = 'coral_hotel_lang';
    const SESSION_KEY_ADMIN = 'coral_admin_session';

    let isPhpAvailable = false;
    let checkedBackend = false;

    // فحص ما إذا كان خادم PHP و XAMPP متوفراً
    async function checkBackend() {
        if (checkedBackend) return isPhpAvailable;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1200);
            const response = await fetch('api/get_branches.php', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (response.ok) {
                const json = await response.json();
                if (json && json.success) isPhpAvailable = true;
            }
        } catch (e) {
            isPhpAvailable = false;
        }
        checkedBackend = true;
        return isPhpAvailable;
    }

    // تهيئة البيانات المحلية الافتراضية
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
        if (!localStorage.getItem(STORAGE_KEY_CURRENCY)) {
            localStorage.setItem(STORAGE_KEY_CURRENCY, 'SDG');
        }
        if (!localStorage.getItem(STORAGE_KEY_LANG)) {
            localStorage.setItem(STORAGE_KEY_LANG, 'ar');
        }
        if (!localStorage.getItem(STORAGE_KEY_EMAILS)) {
            localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify([]));
        }
    }

    async function init() {
        initLocalStorage();
        await checkBackend();
    }

    // إدارة العملات واللغة
    function getCurrency() {
        return localStorage.getItem(STORAGE_KEY_CURRENCY) || 'SDG';
    }

    function setCurrency(cur) {
        if (CORAL_CURRENCIES[cur]) {
            localStorage.setItem(STORAGE_KEY_CURRENCY, cur);
            window.dispatchEvent(new CustomEvent('coral:currency-changed', { detail: cur }));
        }
    }

    function getLang() {
        return localStorage.getItem(STORAGE_KEY_LANG) || 'ar';
    }

    function setLang(lang) {
        localStorage.setItem(STORAGE_KEY_LANG, lang === 'en' ? 'en' : 'ar');
        window.dispatchEvent(new CustomEvent('coral:lang-changed', { detail: lang }));
    }

    // تحويل الأسعار وتنسيقها
    function convertPrice(amountInSdg, targetCurrency = null) {
        const cur = targetCurrency || getCurrency();
        const info = CORAL_CURRENCIES[cur] || CORAL_CURRENCIES.SDG;
        const converted = amountInSdg / info.rate;
        return cur === 'SDG' ? Math.round(converted) : Math.round(converted * 10) / 10;
    }

    function formatPrice(amountInSdg, targetCurrency = null) {
        const cur = targetCurrency || getCurrency();
        const info = CORAL_CURRENCIES[cur] || CORAL_CURRENCIES.SDG;
        const converted = convertPrice(amountInSdg, cur);
        const isAr = getLang() === 'ar';
        const symbol = isAr ? info.symbol : info.symbolEn;
        return `${Number(converted).toLocaleString()} ${symbol}`;
    }

    // جلب الفروع
    async function getBranches() {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                const res = await fetch('api/get_branches.php');
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {}
        }
        return JSON.parse(localStorage.getItem(STORAGE_KEY_BRANCHES) || '[]');
    }

    // جلب الغرف
    async function getRooms(branchId = 0, roomType = 'all') {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                let url = `api/get_rooms.php?branch_id=${branchId}&room_type=${encodeURIComponent(roomType)}`;
                const res = await fetch(url);
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {}
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

    // جلب العروض
    async function getOffers() {
        await checkBackend();
        if (isPhpAvailable) {
            try {
                const res = await fetch('api/get_offers.php');
                const json = await res.json();
                if (json.success && json.data) return json.data;
            } catch (e) {}
        }
        return JSON.parse(localStorage.getItem(STORAGE_KEY_OFFERS) || '[]');
    }

    // إنشاء حجز جديد ومعالجة الدفع وإنشاء رسالة البريد
    async function createBooking(data) {
        await checkBackend();

        const bookingRef = data.booking_ref || 'CR-' + Math.floor(100000 + Math.random() * 900000);
        const cur = data.currency || getCurrency();
        
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
            residency_type: data.residency_type || 'local',
            residency_name: data.residency_type === 'foreign' ? 'إقامة أجنبية (Foreign Guest)' : 'مواطن سوداني',
            guest_national_id: data.guest_national_id || '',
            guest_passport: data.guest_passport || '',
            nationality: data.nationality || 'سوداني',
            check_in: data.check_in,
            check_out: data.check_out,
            total_nights: Number(data.total_nights) || 1,
            currency: cur,
            total_price: Number(data.total_price),
            payment_method: data.payment_method || 'bankak',
            payment_method_name: data.payment_method_name || 'تطبيق بنكك (بنك الخرطوم)',
            payment_status: 'paid',
            booking_status: 'confirmed',
            special_requests: data.special_requests || '',
            created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        // إنشاء محتوى رسالة البريد الإلكتروني التأكيدية
        const emailObject = generateConfirmationEmail(bookingRecord);
        saveEmailMessage(emailObject);

        if (isPhpAvailable) {
            try {
                const res = await fetch('api/create_booking.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingRecord)
                });
                const json = await res.json();
                if (json.success) {
                    syncLocalBooking(bookingRecord);
                    notifyAdminOfNewBooking(bookingRecord);
                    return { success: true, booking: bookingRecord, email: emailObject };
                }
            } catch (e) {}
        }

        // حفظ محلي
        syncLocalBooking(bookingRecord);
        notifyAdminOfNewBooking(bookingRecord);

        return { success: true, booking: bookingRecord, email: emailObject };
    }

    function syncLocalBooking(booking) {
        const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || '[]');
        bookings.unshift(booking);
        localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    }

    function notifyAdminOfNewBooking(bookingRecord) {
        addActivity({
            action_type: 'booking_new',
            title: `حجز جديد مؤكد ودفع فوري (${bookingRecord.booking_ref})`,
            details: `النزيل ${bookingRecord.guest_name} (${bookingRecord.nationality}) قام بحجز ${bookingRecord.room_title} في ${bookingRecord.branch_name} بقيمة ${Number(bookingRecord.total_price).toLocaleString()} ${bookingRecord.currency} عبر ${bookingRecord.payment_method_name}.`,
            branch_name: bookingRecord.branch_name,
            icon: 'check-circle'
        });
        window.dispatchEvent(new CustomEvent('coral:new-booking', { detail: bookingRecord }));
    }

    // توليد رسالة البريد الإلكتروني التأكيدية الاحترافية
    function generateConfirmationEmail(b) {
        const subject = `تأكيد حجزك في فندق كورال السودان - رقم الحجز: ${b.booking_ref}`;
        const recipient = b.guest_email || 'guest@example.com';
        const formattedTotal = `${Number(b.total_price).toLocaleString()} ${b.currency}`;

        const html = `
            <div style="font-family: 'Cairo', Arial, sans-serif; max-width: 650px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #ddd6fe; box-shadow: 0 10px 30px rgba(109,40,217,0.1); direction: rtl; text-align: right;">
                <div style="background: linear-gradient(135deg, #6d28d9, #4c1d95); padding: 30px 24px; text-align: center; color: #ffffff;">
                    <div style="display: inline-block; background: #d4af37; color: #000; width: 44px; height: 44px; line-height: 44px; border-radius: 12px; font-weight: bold; font-size: 20px; margin-bottom: 10px;">👑</div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">فندق كورال السودان</h1>
                    <p style="margin: 4px 0 0; color: #f5f3ff; font-size: 13px; letter-spacing: 1px;">CORAL HOTELS SUDAN - OFFICIAL CONFIRMATION</p>
                </div>
                
                <div style="padding: 28px 24px;">
                    <div style="background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 18px; margin-bottom: 24px; text-align: center;">
                        <span style="color: #6d28d9; font-weight: bold; font-size: 14px;">تم تأكيد حجزك بنجاح وسداد المبلغ بالكامل ✅</span>
                        <div style="font-size: 26px; font-weight: 900; color: #4c1d95; letter-spacing: 2px; margin-top: 6px;">${b.booking_ref}</div>
                        <span style="font-size: 12px; color: #64748b;">احتفظ بهذا الرقم المرجعي لإبرازه عند تسجيل الوصول</span>
                    </div>

                    <p style="font-size: 15px; color: #1e293b; line-height: 1.8;">
                        عزيزي النزيل الكريم <strong>${b.guest_name}</strong>،<br>
                        يسر إدارة فندق كورال السودان تأكيد إقامتكم الفندقية لدينا. تم استلام تفاصيل حجزكم وتسجيل الدفعة بنجاح.
                    </p>

                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
                        <tr style="background: #faf5ff;">
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; color: #64748b;">الفرع المحجوز:</td>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; font-weight: bold; color: #4c1d95;">📍 ${b.branch_name} (${b.branch_state})</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; color: #64748b;">نوع الغرفة / الجناح:</td>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; font-weight: bold; color: #1e293b;">${b.room_title}</td>
                        </tr>
                        <tr style="background: #faf5ff;">
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; color: #64748b;">فترة الإقامة:</td>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; font-weight: bold; color: #1e293b;">من ${b.check_in} إلى ${b.check_out} (${b.total_nights} ليالٍ)</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; color: #64748b;">نوع الإقامة والجنسية:</td>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; font-weight: bold; color: #1e293b;">${b.residency_name} - ${b.nationality}</td>
                        </tr>
                        <tr style="background: #faf5ff;">
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; color: #64748b;">المبلغ المدفوع بالكامل:</td>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; font-weight: 900; color: #059669; font-size: 16px;">${formattedTotal}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; color: #64748b;">طريقة الدفع:</td>
                            <td style="padding: 12px; border-bottom: 1px solid #ede9fe; font-weight: bold; color: #1e293b;">${b.payment_method_name}</td>
                        </tr>
                    </table>

                    <div style="background: #fffbeb; border: 1px solid #fef3c7; padding: 14px; border-radius: 10px; font-size: 13px; color: #92400e; margin-bottom: 20px;">
                        📌 <strong>ملاحظات هامة لتسجيل الوصول:</strong><br>
                        • موعد تسجيل الوصول (Check-in) يبدأ من الساعة 02:00 ظهراً.<br>
                        • يرجى إبراز الهوية الوطنية أو جواز السفر ساري المفعول ورقم الحجز عند مكتب الاستقبال.<br>
                        • مكتب الاستقبال وخدمة الغرف متاحين على مدار 24 ساعة لخدمتكم.
                    </div>

                    <div style="text-align: center; margin-top: 25px; padding-top: 20px; border-top: 1px dashed #ddd6fe; color: #94a3b8; font-size: 12px;">
                        فندق كورال السودان | المقر الرئيسي: شارع النيل، الخرطوم | فروع: البحر الأحمر (بورتسودان)، كسلا، نهر النيل (عطبرة)<br>
                        هاتف الحجوزات: +249 183 774 100 | reservations@coralhotels-sd.com
                    </div>
                </div>
            </div>
        `;

        return {
            id: Date.now(),
            booking_ref: b.booking_ref,
            recipient_name: b.guest_name,
            recipient_email: recipient,
            subject: subject,
            html: html,
            sent_at: new Date().toISOString()
        };
    }

    function saveEmailMessage(emailObj) {
        const emails = JSON.parse(localStorage.getItem(STORAGE_KEY_EMAILS) || '[]');
        emails.unshift(emailObj);
        localStorage.setItem(STORAGE_KEY_EMAILS, JSON.stringify(emails));
    }

    function getEmailByRef(ref) {
        const emails = JSON.parse(localStorage.getItem(STORAGE_KEY_EMAILS) || '[]');
        return emails.find(e => e.booking_ref.toLowerCase() === ref.trim().toLowerCase()) || null;
    }

    // جلب الحجوزات
    async function getBookings(filters = {}) {
        await checkBackend();
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

    async function findGuestBooking(ref, phone) {
        const bookings = await getBookings();
        return bookings.find(b => {
            const matchRef = b.booking_ref.toLowerCase() === ref.trim().toLowerCase();
            const matchPhone = phone ? b.guest_phone.replace(/\D/g, '').endsWith(phone.replace(/\D/g, '').slice(-7)) : true;
            return matchRef && matchPhone;
        }) || null;
    }

    async function updateBookingStatus(bookingId, newStatus) {
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
            window.dispatchEvent(new CustomEvent('coral:booking-status-updated', { detail: bookings[idx] }));
        }
        return true;
    }

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

    async function getActivities(limit = 20) {
        const activities = JSON.parse(localStorage.getItem(STORAGE_KEY_ACTIVITIES) || '[]');
        return activities.slice(0, limit);
    }

    async function getStats() {
        const bookings = JSON.parse(localStorage.getItem(STORAGE_KEY_BOOKINGS) || '[]');
        const branches = JSON.parse(localStorage.getItem(STORAGE_KEY_BRANCHES) || '[]');
        const rooms = JSON.parse(localStorage.getItem(STORAGE_KEY_ROOMS) || '[]');

        const totalBookings = bookings.length;
        const totalRevenue = bookings
            .filter(b => b.payment_status === 'paid' && b.booking_status !== 'cancelled')
            .reduce((sum, b) => {
                // تحويل المبالغ للجنيه لحساب الإجمالي
                let val = Number(b.total_price || 0);
                if (b.currency === 'USD') val = val * 2500;
                else if (b.currency === 'SAR') val = val * 667;
                return sum + val;
            }, 0);

        const activeGuests = bookings.filter(b => ['confirmed', 'checked_in'].includes(b.booking_status)).length;
        const totalRooms = rooms.length;
        const availableRooms = rooms.filter(r => r.status === 'available').length;
        const occupancyRate = totalRooms > 0 ? Math.round(((totalRooms - availableRooms + (activeGuests % 4)) / totalRooms) * 100) : 78;

        const branchStats = branches.map(br => {
            const brBookings = bookings.filter(b => b.branch_id == br.id);
            const revenue = brBookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);
            return {
                id: br.id,
                name_ar: br.name_ar,
                name_en: br.name_en,
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
            occupancy_rate: Math.min(96, Math.max(50, occupancyRate)),
            branch_stats: branchStats
        };
    }

    // مصادقة شاشة المدير السرية
    function loginAdmin(adminId, password) {
        const cleanId = (adminId || '').trim().toUpperCase();
        const cleanPass = (password || '').trim();

        // بيانات الدخول المعتمدة
        const validCredentials = [
            { id: 'CORAL-ADMIN', pass: 'coral2026', name: 'المدير العام لفنادق كورال السودان', role: 'Super Admin' },
            { id: 'ADMIN', pass: 'admin123', name: 'مشرف العمليات المركزية', role: 'Operations Admin' }
        ];

        const found = validCredentials.find(c => c.id === cleanId && c.pass === cleanPass);
        if (found) {
            const sessionData = {
                admin_id: found.id,
                name: found.name,
                role: found.role,
                loggedInAt: Date.now()
            };
            sessionStorage.setItem(SESSION_KEY_ADMIN, JSON.stringify(sessionData));
            return { success: true, user: sessionData };
        }
        return { success: false, message: 'معرف المدير أو كلمة المرور غير صحيحة' };
    }

    function isAdminLoggedIn() {
        const session = sessionStorage.getItem(SESSION_KEY_ADMIN);
        if (!session) return false;
        try {
            const parsed = JSON.parse(session);
            return !!(parsed && parsed.admin_id);
        } catch (e) {
            return false;
        }
    }

    function getAdminSession() {
        try {
            return JSON.parse(sessionStorage.getItem(SESSION_KEY_ADMIN));
        } catch (e) {
            return null;
        }
    }

    function logoutAdmin() {
        sessionStorage.removeItem(SESSION_KEY_ADMIN);
    }

    function resetToDefault() {
        localStorage.removeItem(STORAGE_KEY_BRANCHES);
        localStorage.removeItem(STORAGE_KEY_ROOMS);
        localStorage.removeItem(STORAGE_KEY_OFFERS);
        localStorage.removeItem(STORAGE_KEY_BOOKINGS);
        localStorage.removeItem(STORAGE_KEY_ACTIVITIES);
        localStorage.removeItem(STORAGE_KEY_EMAILS);
        initLocalStorage();
    }

    return {
        init,
        isPhpMode: () => isPhpAvailable,
        getCurrency,
        setCurrency,
        getLang,
        setLang,
        convertPrice,
        formatPrice,
        getBranches,
        getRooms,
        getOffers,
        createBooking,
        getBookings,
        findGuestBooking,
        updateBookingStatus,
        addActivity,
        getActivities,
        getStats,
        getEmailByRef,
        generateConfirmationEmail,
        loginAdmin,
        isAdminLoggedIn,
        getAdminSession,
        logoutAdmin,
        resetToDefault
    };
})();

CoralDB.init();
