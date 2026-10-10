// ========================================================
// CORAL HOTEL - سكربت بوابة النزيل (Guest Portal Engine)
// استعلام وتتبع الحجوزات، طباعة الفاتورة وسند الإقامة
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('guestLookupForm');
    const resultBox = document.getElementById('lookupResultBox');
    const emptyNotice = document.getElementById('lookupEmptyNotice');

    // فحص ما إذا كان هناك باراميتر ref في الرابط
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    if (refParam) {
        document.getElementById('lookupRefInput').value = refParam;
        lookupBooking(refParam, '');
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const ref = document.getElementById('lookupRefInput').value.trim();
            const phone = document.getElementById('lookupPhoneInput').value.trim();
            if (!ref) {
                alert('يرجى إدخال رقم الحجز المرجعي');
                return;
            }
            lookupBooking(ref, phone);
        });
    }

    async function lookupBooking(ref, phone) {
        if (resultBox) resultBox.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--gold);"></i><p style="margin-top: 10px;">جاري الاستعلام عن بيانات الحجز...</p></div>`;
        if (emptyNotice) emptyNotice.style.display = 'none';
        if (resultBox) resultBox.style.display = 'block';

        const booking = await CoralDB.findGuestBooking(ref, phone);

        if (!booking) {
            resultBox.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff; border-radius: 16px; border: 1px dashed #ef4444;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ef4444; margin-bottom: 15px;"></i>
                    <h3 style="color: #1e293b; margin-bottom: 8px;">لم يتم العثور على الحجز</h3>
                    <p style="color: #64748b;">يرجى التأكد من صحة رقم الحجز المرجعي (${ref}) ورقم الهاتف المدخل والمحاولة مجدداً.</p>
                </div>
            `;
            return;
        }

        const statusBadges = {
            'confirmed': '<span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 14px; border-radius: 20px; font-weight: bold;"><i class="fas fa-check-circle"></i> مؤكد ومكتمل الدفع</span>',
            'checked_in': '<span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 4px 14px; border-radius: 20px; font-weight: bold;"><i class="fas fa-key"></i> تم تسجيل الوصول (مقيم حالياً)</span>',
            'checked_out': '<span style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 4px 14px; border-radius: 20px; font-weight: bold;"><i class="fas fa-sign-out-alt"></i> تم إنهاء الإقامة (مغادر)</span>',
            'cancelled': '<span style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 4px 14px; border-radius: 20px; font-weight: bold;"><i class="fas fa-times-circle"></i> حجز ملغي</span>'
        };

        resultBox.innerHTML = `
            <div class="voucher-card" style="box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
                <div class="voucher-header">
                    <div style="font-size: 0.9rem; color: #64748b; font-weight: 700;">سند حجز فندقي رسمي معتمد</div>
                    <h2 style="color: var(--primary); margin: 6px 0;">فندق كورال السودان</h2>
                    <div class="voucher-ref-code">${booking.booking_ref}</div>
                    <div style="margin-top: 12px;">${statusBadges[booking.booking_status] || booking.booking_status}</div>
                </div>

                <div class="voucher-sms-preview">
                    <i class="fas fa-mobile-alt" style="font-size: 24px; color: #166534;"></i>
                    <div>
                        <strong>رسالة التأكيد النصية (SMS / واتساب):</strong><br>
                        "مرحباً بك عزيزي النزيل <b>${booking.guest_name}</b>، حجزك في <b>${booking.branch_name}</b> مؤكد برقم <b>${booking.booking_ref}</b>. نتطلع لاستقبالك بكل ود."
                    </div>
                </div>

                <div class="voucher-details-grid">
                    <div class="voucher-item">
                        <div class="voucher-item-label">اسم النزيل</div>
                        <div class="voucher-item-value">${booking.guest_name}</div>
                    </div>
                    <div class="voucher-item">
                        <div class="voucher-item-label">رقم الهاتف المسجل</div>
                        <div class="voucher-item-value">${booking.guest_phone}</div>
                    </div>
                    <div class="voucher-item">
                        <div class="voucher-item-label">الفرع والولاية</div>
                        <div class="voucher-item-value">📍 ${booking.branch_name} (${booking.branch_state})</div>
                    </div>
                    <div class="voucher-item">
                        <div class="voucher-item-label">الغرفة المحجوزة</div>
                        <div class="voucher-item-value">${booking.room_title}</div>
                    </div>
                    <div class="voucher-item">
                        <div class="voucher-item-label">تاريخ الوصول والمغادرة</div>
                        <div class="voucher-item-value">${booking.check_in} إلى ${booking.check_out} (${booking.total_nights} ليالٍ)</div>
                    </div>
                    <div class="voucher-item">
                        <div class="voucher-item-label">المبلغ الإجمالي وطريقة الدفع</div>
                        <div class="voucher-item-value" style="color: #065f46;">${Number(booking.total_price).toLocaleString()} ج.س (${booking.payment_method_name || 'مدفوع'})</div>
                    </div>
                </div>

                ${booking.special_requests ? `
                    <div style="background: #f8fafc; padding: 14px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem;">
                        <strong>طلبات خاصة مسجلة:</strong> ${booking.special_requests}
                    </div>
                ` : ''}

                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-gold" onclick="window.print()">
                        <i class="fas fa-print"></i> طباعة الفاتورة والسند
                    </button>
                    <a href="index.html" class="btn btn-primary">
                        <i class="fas fa-home"></i> العودة للرئيسية
                    </a>
                </div>
            </div>
        `;
    }
});
