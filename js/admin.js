// ========================================================
// CORAL HOTEL - سكربت لوحة تحكم مدير النظام (Admin Dashboard Engine)
// إدارة الحجوزات، سجل النشاطات الحية، وإحصائيات الفروع
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
    let state = {
        bookings: [],
        activities: [],
        stats: null,
        filterBranch: 'all',
        filterStatus: 'all',
        searchQuery: ''
    };

    const elements = {
        statBookings: document.getElementById('statTotalBookings'),
        statRevenue: document.getElementById('statTotalRevenue'),
        statGuests: document.getElementById('statActiveGuests'),
        statOccupancy: document.getElementById('statOccupancyRate'),
        
        occupancyBarsContainer: document.getElementById('branchOccupancyList'),
        activityStreamContainer: document.getElementById('activityStreamList'),
        bookingsTableBody: document.getElementById('bookingsTableBody'),
        
        searchInput: document.getElementById('adminSearchInput'),
        branchFilter: document.getElementById('adminBranchFilter'),
        statusFilter: document.getElementById('adminStatusFilter'),
        btnRefresh: document.getElementById('btnRefreshData'),
        btnResetData: document.getElementById('btnResetData'),
        
        backendModeBadge: document.getElementById('backendModeBadge'),
        
        // نافذة تفاصيل الحجز للمدير
        bookingDetailModal: document.getElementById('adminBookingModal'),
        detailContent: document.getElementById('adminBookingDetailContent'),
        closeDetailModal: document.getElementById('closeAdminModalBtn')
    };

    await initAdmin();

    async function initAdmin() {
        // التحقق من نمط الخادم (XAMPP vs Standalone)
        const isPhp = await CoralDB.isPhpMode();
        if (elements.backendModeBadge) {
            if (isPhp) {
                elements.backendModeBadge.innerHTML = `<span class="status-dot"></span> متصل بـ XAMPP (MySQL)`;
                elements.backendModeBadge.style.color = '#10b981';
            } else {
                elements.backendModeBadge.innerHTML = `<span class="status-dot" style="background:#38bdf8; box-shadow:0 0 8px #38bdf8;"></span> نمط التخزين الذكي (Web Ready)`;
                elements.backendModeBadge.style.color = '#38bdf8';
            }
        }

        await refreshDashboard();
        setupEventListeners();
    }

    async function refreshDashboard() {
        state.stats = await CoralDB.getStats();
        state.activities = await CoralDB.getActivities(20);
        await filterAndRenderBookings();
        renderStats();
        renderOccupancyBars();
        renderActivities();
    }

    // 1. عرض مؤشرات الأداء الحية (KPIs)
    function renderStats() {
        if (!state.stats) return;
        if (elements.statBookings) elements.statBookings.textContent = Number(state.stats.total_bookings).toLocaleString();
        if (elements.statRevenue) elements.statRevenue.textContent = `${Number(state.stats.total_revenue).toLocaleString()} ج.س`;
        if (elements.statGuests) elements.statGuests.textContent = Number(state.stats.active_guests).toLocaleString();
        if (elements.statOccupancy) elements.statOccupancy.textContent = `${state.stats.occupancy_rate}%`;
    }

    // 2. عرض نسبة إشغال الفروع (البحر الأحمر، كسلا، نهر النيل)
    function renderOccupancyBars() {
        if (!elements.occupancyBarsContainer || !state.stats) return;
        const branchStats = state.stats.branch_stats || [];
        
        const rates = {
            1: 88, // البحر الأحمر
            2: 76, // كسلا
            3: 82  // نهر النيل
        };

        elements.occupancyBarsContainer.innerHTML = branchStats.map(b => {
            const pct = rates[b.id] || 75;
            return `
                <div class="branch-occupancy-item">
                    <div class="branch-occupancy-header">
                        <span style="color: #fff;"><i class="fas fa-map-marker-alt" style="color: var(--gold); margin-left: 6px;"></i> ${b.name_ar}</span>
                        <span style="color: var(--gold);">${pct}% (${b.bookings_count} حجز)</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3. عرض شريط النشاطات الحية (Live Activities Stream)
    function renderActivities() {
        if (!elements.activityStreamContainer) return;
        if (state.activities.length === 0) {
            elements.activityStreamContainer.innerHTML = `<p style="color: #94a3b8; text-align: center; padding: 20px;">لا توجد نشاطات مسجلة حالياً</p>`;
            return;
        }

        elements.activityStreamContainer.innerHTML = state.activities.map(act => {
            let iconClass = 'fa-bell';
            if (act.action_type === 'booking_new') iconClass = 'fa-calendar-check';
            if (act.action_type === 'payment_success') iconClass = 'fa-credit-card';
            if (act.action_type === 'status_update') iconClass = 'fa-sync';

            return `
                <div class="activity-item">
                    <div class="activity-icon-box">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="activity-info">
                        <h5>${act.title}</h5>
                        <p>${act.details}</p>
                        <div class="activity-meta">
                            <span><i class="fas fa-map-pin"></i> ${act.branch_name || 'فنادق كورال'}</span>
                            <span>•</span>
                            <span><i class="far fa-clock"></i> ${act.time || act.created_at || 'الآن'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. تصفية وعرض جدول الحجوزات الشامل
    async function filterAndRenderBookings() {
        const filters = {
            ref: state.searchQuery,
            branch_id: state.filterBranch,
            status: state.filterStatus
        };

        state.bookings = await CoralDB.getBookings(filters);

        if (!elements.bookingsTableBody) return;

        if (state.bookings.length === 0) {
            elements.bookingsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #94a3b8;">
                        <i class="fas fa-inbox" style="font-size: 30px; margin-bottom: 10px; display: block;"></i>
                        لا توجد حجوزات مطابقة للفلاتر المحددة
                    </td>
                </tr>
            `;
            return;
        }

        const statusBadges = {
            'confirmed': '<span class="status-badge confirmed"><i class="fas fa-check-circle"></i> مؤكد</span>',
            'checked_in': '<span class="status-badge checked_in"><i class="fas fa-key"></i> تم الوصول</span>',
            'checked_out': '<span class="status-badge checked_out"><i class="fas fa-sign-out-alt"></i> غادر</span>',
            'cancelled': '<span class="status-badge cancelled"><i class="fas fa-times-circle"></i> ملغي</span>'
        };

        elements.bookingsTableBody.innerHTML = state.bookings.map(b => `
            <tr>
                <td>
                    <strong style="color: var(--gold); letter-spacing: 0.5px;">${b.booking_ref}</strong><br>
                    <small style="color: #64748b;">${b.created_at ? b.created_at.substring(0, 10) : ''}</small>
                </td>
                <td>
                    <div style="font-weight: 700; color: #fff;">${b.guest_name}</div>
                    <small style="color: #94a3b8;"><i class="fas fa-phone-alt" style="font-size: 10px;"></i> ${b.guest_phone}</small>
                </td>
                <td>
                    <span style="color: #cbd5e1;">${b.branch_name}</span><br>
                    <small style="color: var(--gold);">${b.branch_state || ''}</small>
                </td>
                <td>
                    <div style="max-width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #e2e8f0;">
                        ${b.room_title}
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.85rem;">${b.check_in}</div>
                    <small style="color: #94a3b8;">إلى ${b.check_out} (${b.total_nights} ليالٍ)</small>
                </td>
                <td>
                    <strong style="color: #fff;">${Number(b.total_price).toLocaleString()} ج.س</strong><br>
                    <small style="color: #10b981;"><i class="fas fa-shield-alt"></i> ${b.payment_method_name || 'مدفوع'}</small>
                </td>
                <td>
                    ${statusBadges[b.booking_status] || b.booking_status}
                </td>
                <td>
                    <div class="action-btn-group">
                        <button class="action-btn" title="تفاصيل كاملة" onclick="window.viewBookingDetails('${b.id || b.booking_ref}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <select onchange="window.changeBookingStatus('${b.id || b.booking_ref}', this.value)" style="background: #0b1329; border: 1px solid #23355e; color: #cbd5e1; border-radius: 6px; font-size: 0.78rem; padding: 4px;">
                            <option value="confirmed" ${b.booking_status === 'confirmed' ? 'selected' : ''}>مؤكد</option>
                            <option value="checked_in" ${b.booking_status === 'checked_in' ? 'selected' : ''}>Check-in</option>
                            <option value="checked_out" ${b.booking_status === 'checked_out' ? 'selected' : ''}>Check-out</option>
                            <option value="cancelled" ${b.booking_status === 'cancelled' ? 'selected' : ''}>إلغاء</option>
                        </select>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // عرض تفاصيل الحجز المنبثقة
    window.viewBookingDetails = (idOrRef) => {
        const b = state.bookings.find(item => item.id == idOrRef || item.booking_ref == idOrRef);
        if (!b) return;

        elements.detailContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                <div style="background: rgba(11,19,41,0.5); padding: 14px; border-radius: 10px;">
                    <span style="font-size: 0.8rem; color: #94a3b8;">رقم الحجز المرجعي:</span>
                    <h3 style="color: var(--gold); margin-top: 4px;">${b.booking_ref}</h3>
                </div>
                <div style="background: rgba(11,19,41,0.5); padding: 14px; border-radius: 10px;">
                    <span style="font-size: 0.8rem; color: #94a3b8;">حالة الحجز:</span>
                    <h4 style="color: #10b981; margin-top: 4px;">${b.booking_status} (مدفوع)</h4>
                </div>
            </div>

            <div style="background: rgba(11,19,41,0.4); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <h4 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #23355e; padding-bottom: 6px;">معلومات النزيل</h4>
                <p><strong>الاسم:</strong> ${b.guest_name}</p>
                <p><strong>الهاتف:</strong> ${b.guest_phone}</p>
                <p><strong>البريد:</strong> ${b.guest_email || 'غير مدخل'}</p>
                <p><strong>الرقم الوطني / الجواز:</strong> ${b.guest_national_id || 'غير مدخل'}</p>
            </div>

            <div style="background: rgba(11,19,41,0.4); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                <h4 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #23355e; padding-bottom: 6px;">تفاصيل الإقامة والغرفة</h4>
                <p><strong>الفرع:</strong> ${b.branch_name} (${b.branch_state})</p>
                <p><strong>الغرفة:</strong> ${b.room_title}</p>
                <p><strong>تاريخ الوصول:</strong> ${b.check_in}</p>
                <p><strong>تاريخ المغادرة:</strong> ${b.check_out}</p>
                <p><strong>عدد الليالي:</strong> ${b.total_nights} ليالٍ</p>
                <p><strong>طلبات خاصة:</strong> ${b.special_requests || 'لا توجد طلبات إضافية'}</p>
            </div>

            <div style="background: rgba(11,19,41,0.4); padding: 16px; border-radius: 12px;">
                <h4 style="color: #fff; margin-bottom: 10px; border-bottom: 1px solid #23355e; padding-bottom: 6px;">الدفع والحساب</h4>
                <p><strong>إجمالي المبلغ:</strong> <span style="color: var(--gold); font-size: 1.2rem; font-weight: 800;">${Number(b.total_price).toLocaleString()} ج.س</span></p>
                <p><strong>طريقة الدفع:</strong> ${b.payment_method_name || b.payment_method}</p>
                <p><strong>حالة الدفع:</strong> <span style="color: #10b981; font-weight: bold;">مدفوع بالكامل (معتمد)</span></p>
            </div>
        `;

        elements.bookingDetailModal.style.display = 'flex';
    };

    // تغيير حالة الحجز من الجدول
    window.changeBookingStatus = async (idOrRef, newStatus) => {
        const success = await CoralDB.updateBookingStatus(idOrRef, newStatus);
        if (success) {
            await refreshDashboard();
        }
    };

    // إعداد مستمعي الأحداث
    function setupEventListeners() {
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.trim();
                filterAndRenderBookings();
            });
        }

        if (elements.branchFilter) {
            elements.branchFilter.addEventListener('change', (e) => {
                state.filterBranch = e.target.value;
                filterAndRenderBookings();
            });
        }

        if (elements.statusFilter) {
            elements.statusFilter.addEventListener('change', (e) => {
                state.filterStatus = e.target.value;
                filterAndRenderBookings();
            });
        }

        if (elements.btnRefresh) {
            elements.btnRefresh.addEventListener('click', async () => {
                elements.btnRefresh.innerHTML = `<i class="fas fa-spinner fa-spin"></i> تحديث...`;
                await refreshDashboard();
                elements.btnRefresh.innerHTML = `<i class="fas fa-sync-alt"></i> تحديث فوري`;
            });
        }

        if (elements.btnResetData) {
            elements.btnResetData.addEventListener('click', () => {
                if (confirm('هل أنت متأكد من إعادة ضبط البيانات إلى الحالة الافتراضية؟')) {
                    CoralDB.resetToDefault();
                    window.location.reload();
                }
            });
        }

        if (elements.closeDetailModal) {
            elements.closeDetailModal.addEventListener('click', () => {
                elements.bookingDetailModal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === elements.bookingDetailModal) {
                elements.bookingDetailModal.style.display = 'none';
            }
        });
    }
});
