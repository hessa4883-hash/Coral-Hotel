// ========================================================
// CORAL HOTEL SUDAN - بوابة النزيل واستعلام الحجوزات
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('guestLookupForm');
    const resultBox = document.getElementById('lookupResultBox');
    const emptyNotice = document.getElementById('lookupEmptyNotice');

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
        if (resultBox) resultBox.innerHTML = `<div style="text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 32px; color: var(--p-600);"></i><p style="margin-top: 10px;">جاري الاستعلام عن بيانات الحجز...</p></div>`;
        if (emptyNotice) emptyNotice.style.display = 'none';
        if (resultBox) resultBox.style.display = 'block';

        const booking = await CoralDB.findGuestBooking(ref, phone);

        if (!booking) {
            resultBox.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff; border-radius: 16px; border: 1px dashed #ef4444;">
                    <i class="fas fa-exclamation-circle" style="font-size: 48px; color: #ef4444; margin-bottom: 15px;"></i>
                    <h3 style="color: #1e293b; margin-bottom: 8px;">لم يتم العثور على الحجز</h3>
                    <p style="color: #64748b;">يرجى التأكد من صحة رقم الحجز المرجعي (${ref}) والمحاولة مجدداً.</p>
                </div>
            `;
            return;
        }

        const isForeign = booking.residency_type === 'foreign';
        const residencyLabel = isForeign ? `إقامة أجنبية (${booking.nationality || 'أجنبي'})` : 'مواطن سوداني';

        const statusBadges = {
            'confirmed': '<span style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 14px; border-radius: 20px; font-weight: bold;"><i class="fas fa-check-circle"></i> مؤكد ومكتمل الدفع</span>',
            'checked_in': '<span style="background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; padding: 4px 14px; border-radius: 20px; font-weight: bold;"><i class="fas fa-key"></i> تم تسجيل الوصول (مقيم حالياً)</span>',
            'checked_out': '<span style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 4px 14px; border-radius: 20px; font-weight: bold;"><i class="fas fa-sign-out-alt"></i> مغادر</span>',
            'cancelled': '<span style="background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 4px 14px; border-radius: 20px; font-weight: bold;"><i class="fas fa-times-circle"></i> ملغي</span>'
        };

        const email = CoralDB.getEmailByRef(booking.booking_ref) || CoralDB.generateConfirmationEmail(booking);

        resultBox.innerHTML = `
            <div style="background: #ffffff; border: 2px dashed var(--p-300); border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(109,40,217,0.08); margin-bottom: 24px;">
                <div style="text-align: center; border-bottom: 1px solid var(--border-soft); padding-bottom: 20px; margin-bottom: 20px;">
                    <div style="font-size: 0.9rem; color: #64748b; font-weight: 700;">سند حجز فندقي رسمي معتمد</div>
                    <h2 style="color: var(--p-950); margin: 6px 0;">فندق كورال السودان</h2>
                    <div style="display: inline-block; background: var(--p-950); color: var(--accent-gold); font-size: 1.4rem; font-weight: 900; padding: 8px 24px; border-radius: 10px; letter-spacing: 2px; margin-top: 10px;">
                        ${booking.booking_ref}
                    </div>
                    <div style="margin-top: 12px;">${statusBadges[booking.booking_status] || booking.booking_status}</div>
                </div>

                <div style="background: var(--p-50); border: 1px solid var(--p-200); padding: 16px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                    <i class="fas fa-envelope-check" style="font-size: 24px; color: var(--p-700);"></i>
                    <div style="font-size: 0.92rem; color: var(--p-900);">
                        <strong>تم إرسال رسالة التأكيد إلى:</strong> ${booking.guest_email || 'البريد الإلكتروني للنزيل'}
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                    <div style="background: #faf5ff; padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.82rem; color: #64748b;">اسم النزيل الكريم:</div>
                        <div style="font-size: 1.05rem; color: var(--p-950); font-weight: 800; margin-top: 4px;">${booking.guest_name}</div>
                    </div>
                    <div style="background: #faf5ff; padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.82rem; color: #64748b;">نوع الإقامة والجنسية:</div>
                        <div style="font-size: 1.05rem; color: var(--p-950); font-weight: 800; margin-top: 4px;">${residencyLabel}</div>
                    </div>
                    <div style="background: #faf5ff; padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.82rem; color: #64748b;">الفرع المحجوز:</div>
                        <div style="font-size: 1.05rem; color: var(--p-950); font-weight: 800; margin-top: 4px;">📍 ${booking.branch_name} (${booking.branch_state})</div>
                    </div>
                    <div style="background: #faf5ff; padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.82rem; color: #64748b;">الغرفة المحجوزة:</div>
                        <div style="font-size: 1.05rem; color: var(--p-950); font-weight: 800; margin-top: 4px;">${booking.room_title}</div>
                    </div>
                    <div style="background: #faf5ff; padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.82rem; color: #64748b;">تاريخ الإقامة:</div>
                        <div style="font-size: 1.05rem; color: var(--p-950); font-weight: 800; margin-top: 4px;">من ${booking.check_in} إلى ${booking.check_out} (${booking.total_nights} ليالٍ)</div>
                    </div>
                    <div style="background: #faf5ff; padding: 12px 16px; border-radius: 8px;">
                        <div style="font-size: 0.82rem; color: #64748b;">المبلغ وطريقة الدفع:</div>
                        <div style="font-size: 1.05rem; color: #059669; font-weight: 900; margin-top: 4px;">${Number(booking.total_price).toLocaleString()} ${booking.currency || 'SDG'} (${booking.payment_method_name || 'مدفوع'})</div>
                    </div>
                </div>

                <!-- معاينة رسالة البريد الإلكتروني المعتمدة -->
                <div style="border: 1px solid var(--p-200); border-radius: 14px; overflow: hidden; margin-bottom: 24px;">
                    <div style="background: var(--p-100); padding: 12px 16px; font-weight: 800; color: var(--p-900); font-size: 0.9rem;">
                        <i class="fas fa-envelope-open-text"></i> نص رسالة التأكيد الإلكترونية الواردة في البريد:
                    </div>
                    <div style="padding: 16px; max-height: 300px; overflow-y: auto;">
                        ${email.html}
                    </div>
                </div>

                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-purple" onclick="window.print()">
                        <i class="fas fa-print"></i> طباعة السند والفاتورة
                    </button>
                    <a href="index.html" class="btn btn-outline-purple">
                        <i class="fas fa-home"></i> العودة للرئيسية
                    </a>
                </div>
            </div>
        `;
    }
});
