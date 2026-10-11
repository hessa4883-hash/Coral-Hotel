// ========================================================
// CORAL HOTEL - سكربت لوحة تحكم مدير النظام السرية (Admin Dashboard Engine)
// التحقق من معرف المدير وكلمة المرور، متابعة العمليات والبريد
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
        // بوابة تسجيل الدخول السرية
        loginOverlay: document.getElementById('adminLoginOverlay'),
        loginForm: document.getElementById('adminLoginForm'),
        adminIdInput: document.getElementById('adminIdInput'),
        adminPassInput: document.getElementById('adminPassInput'),
        loginErrorMsg: document.getElementById('loginErrorMsg'),
        
        // المحتوى الرئيسي بعد فك القفل
        sidebar: document.getElementById('adminSidebar'),
        mainContent: document.getElementById('adminMainContent'),
        sidebarName: document.getElementById('sidebarAdminName'),
        sidebarRole: document.getElementById('sidebarAdminRole'),
        btnLogoutTop: document.getElementById('btnAdminLogout'),
        btnLogoutSide: document.getElementById('btnSidebarLogout'),

        // إحصائيات
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

        backendModeBadge: document.getElementById('backendModeBadge'),

        // نافذة تفاصيل الحجز
        bookingDetailModal: document.getElementById('adminBookingModal'),
        detailContent: document.getElementById('adminBookingDetailContent'),
        closeDetailModal: document.getElementById('closeAdminModalBtn')
    };

    // التحقق من حالة تسجيل دخول المدير
    checkAuth();

    function checkAuth() {
        if (CoralDB.isAdminLoggedIn()) {
            unlockDashboard();
        } else {
            lockDashboard();
        }
    }

    function lockDashboard() {
        if (elements.loginOverlay) elements.loginOverlay.style.display = 'flex';
        if (elements.sidebar) elements.sidebar.style.display = 'none';
        if (elements.mainContent) elements.mainContent.style.display = 'none';
    }

    function unlockDashboard() {
        const session = CoralDB.getAdminSession();
        if (elements.loginOverlay) elements.loginOverlay.style.display = 'none';
        if (elements.sidebar) elements.sidebar.style.display = 'flex';
        if (elements.mainContent) elements.mainContent.style.display = 'flex';

        if (session && elements.sidebarName) {
            elements.sidebarName.textContent = session.name || 'مدير النظام';
            elements.sidebarRole.textContent = session.role || 'Super Admin';
        }

        initDashboardData();
    }

    // معالجة نموذج تسجيل الدخول
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = elements.adminIdInput.value;
            const pass = elements.adminPassInput.value;

            const res = CoralDB.loginAdmin(id, pass);
            if (res.success) {
                if (elements.loginErrorMsg) elements.loginErrorMsg.style.display = 'none';
                unlockDashboard();
            } else {
                if (elements.loginErrorMsg) {
                    elements.loginErrorMsg.style.display = 'block';
                    elements.loginErrorMsg.textContent = res.message;
                }
            }
        });
    }

    // تسجيل الخروج وقفل اللوحة
    function handleLogout() {
        CoralDB.logoutAdmin();
        lockDashboard();
    }

    if (elements.btnLogoutTop) elements.btnLogoutTop.addEventListener('click', handleLogout);
    if (elements.btnLogoutSide) elements.btnLogoutSide.addEventListener('click', handleLogout);

    // تهيئة البيانات
    async function initDashboardData() {
        const isPhp = await CoralDB.isPhpMode();
        if (elements.backendModeBadge) {
            if (isPhp) {
                elements.backendModeBadge.innerHTML = `<span class="status-dot"></span> متصل بـ XAMPP (MySQL)`;
                elements.backendModeBadge.style.color = '#10b981';
            } else {
                elements.backendModeBadge.innerHTML = `<span class="status-dot" style="background:var(--admin-purple-bright);"></span> نمط التخزين الذكي (Web Ready)`;
                elements.backendModeBadge.style.color = '#c084fc';
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

    function renderStats() {
        if (!state.stats) return;
        if (elements.statBookings) elements.statBookings.textContent = Number(state.stats.total_bookings).toLocaleString();
        if (elements.statRevenue) elements.statRevenue.textContent = `${Number(state.stats.total_revenue).toLocaleString()} ج.س`;
        if (elements.statGuests) elements.statGuests.textContent = Number(state.stats.active_guests).toLocaleString();
        if (elements.statOccupancy) elements.statOccupancy.textContent = `${state.stats.occupancy_rate}%`;
    }

    function renderOccupancyBars() {
        if (!elements.occupancyBarsContainer || !state.stats) return;
        const branchStats = state.stats.branch_stats || [];
        const rates = { 1: 92, 2: 88, 3: 76, 4: 84 };

        elements.occupancyBarsContainer.innerHTML = branchStats.map(b => {
            const pct = rates[b.id] || 80;
            return `
                <div class="branch-occupancy-item">
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; font-weight: 700;">
                        <span style="color: #fff;"><i class="fas fa-hotel" style="color: var(--admin-purple-bright); margin-left: 6px;"></i> ${b.name_ar}</span>
                        <span style="color: var(--admin-gold);">${pct}% (${b.bookings_count} حجز)</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderActivities() {
        if (!elements.activityStreamContainer) return;
        if (state.activities.length === 0) {
            elements.activityStreamContainer.innerHTML = `<p style="color: #c4b5fd; text-align: center; padding: 20px;">لا توجد نشاطات مسجلة حالياً</p>`;
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
                    <td colspan="8" style="text-align: center; padding: 40px; color: #c4b5fd;">
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

        elements.bookingsTableBody.innerHTML = state.bookings.map(b => {
            const isForeign = b.residency_type === 'foreign';
            const residencyTag = isForeign ? 
                `<span style="background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.4); padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: bold;"><i class="fas fa-globe"></i> إقامة أجنبية (${b.nationality})</span>` :
                `<span style="background: rgba(168,85,247,0.2); color: #d8b4fe; border: 1px solid rgba(168,85,247,0.4); padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: bold;"><i class="fas fa-id-card"></i> مواطن سوداني</span>`;

            return `
                <tr>
                    <td>
                        <strong style="color: var(--admin-purple-bright); letter-spacing: 0.5px;">${b.booking_ref}</strong><br>
                        <small style="color: #9ca3af;">${b.created_at ? b.created_at.substring(0, 10) : ''}</small>
                    </td>
                    <td>
                        <div style="font-weight: 800; color: #fff;">${b.guest_name}</div>
                        <div style="margin: 3px 0;">${residencyTag}</div>
                        <small style="color: #cbd5e1;"><i class="fas fa-phone-alt" style="font-size: 10px;"></i> ${b.guest_phone}</small>
                    </td>
                    <td>
                        <span style="color: #e2e8f0; font-weight: 700;">${b.branch_name}</span><br>
                        <small style="color: var(--admin-gold);">${b.branch_state || ''}</small>
                    </td>
                    <td>
                        <div style="max-width: 170px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #f5f3ff;">
                            ${b.room_title}
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem;">${b.check_in}</div>
                        <small style="color: #c4b5fd;">إلى ${b.check_out} (${b.total_nights} ليالٍ)</small>
                    </td>
                    <td>
                        <strong style="color: #fff;">${Number(b.total_price).toLocaleString()} ${b.currency || 'SDG'}</strong><br>
                        <small style="color: #10b981;"><i class="fas fa-check"></i> ${b.payment_method_name || 'مدفوع'}</small>
                    </td>
                    <td>
                        ${statusBadges[b.booking_status] || b.booking_status}
                    </td>
                    <td>
                        <div class="action-btn-group">
                            <button class="action-btn" title="تفاصيل كاملة ومعاينة البريد" onclick="window.viewBookingDetails('${b.id || b.booking_ref}')">
                                <i class="fas fa-envelope-open-text"></i> البريد والتفاصيل
                            </button>
                            <select onchange="window.changeBookingStatus('${b.id || b.booking_ref}', this.value)" style="background: #1e1136; border: 1px solid var(--admin-border); color: #f5f3ff; border-radius: 6px; font-size: 0.78rem; padding: 4px;">
                                <option value="confirmed" ${b.booking_status === 'confirmed' ? 'selected' : ''}>مؤكد</option>
                                <option value="checked_in" ${b.booking_status === 'checked_in' ? 'selected' : ''}>Check-in</option>
                                <option value="checked_out" ${b.booking_status === 'checked_out' ? 'selected' : ''}>Check-out</option>
                                <option value="cancelled" ${b.booking_status === 'cancelled' ? 'selected' : ''}>إلغاء</option>
                            </select>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // عرض تفاصيل الحجز المنبثقة ومعاينة رسالة البريد
    window.viewBookingDetails = (idOrRef) => {
        const b = state.bookings.find(item => item.id == idOrRef || item.booking_ref == idOrRef);
        if (!b) return;

        const email = CoralDB.getEmailByRef(b.booking_ref) || CoralDB.generateConfirmationEmail(b);

        elements.detailContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
                <div style="background: rgba(30,17,54,0.7); padding: 14px; border-radius: 12px; border: 1px solid var(--admin-border);">
                    <span style="font-size: 0.8rem; color: var(--admin-muted);">رقم الحجز المرجعي:</span>
                    <h3 style="color: var(--admin-purple-bright); margin-top: 4px; font-weight: 900;">${b.booking_ref}</h3>
                </div>
                <div style="background: rgba(30,17,54,0.7); padding: 14px; border-radius: 12px; border: 1px solid var(--admin-border);">
                    <span style="font-size: 0.8rem; color: var(--admin-muted);">الحالة ونوع الإقامة:</span>
                    <h4 style="color: #10b981; margin-top: 4px;">${b.booking_status} (${b.residency_name})</h4>
                </div>
            </div>

            <!-- تبويبين: تفاصيل النزيل + رسالة البريد المرسلة -->
            <div style="background: rgba(30,17,54,0.5); padding: 18px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--admin-border);">
                <h4 style="color: var(--admin-gold); margin-bottom: 10px; border-bottom: 1px solid var(--admin-border); padding-bottom: 6px;">بيانات النزيل والإقامة</h4>
                <p><strong>الاسم:</strong> ${b.guest_name}</p>
                <p><strong>الهاتف:</strong> ${b.guest_phone}</p>
                <p><strong>البريد الإلكتروني:</strong> ${b.guest_email || 'غير مدخل'}</p>
                <p><strong>الجنسية:</strong> ${b.nationality || 'سوداني'}</p>
                ${b.guest_passport ? `<p><strong>رقم جواز السفر:</strong> ${b.guest_passport}</p>` : ''}
                ${b.guest_national_id ? `<p><strong>الرقم الوطني:</strong> ${b.guest_national_id}</p>` : ''}
                <p><strong>الفرع:</strong> ${b.branch_name} (${b.branch_state})</p>
                <p><strong>الغرفة:</strong> ${b.room_title}</p>
                <p><strong>فترة الإقامة:</strong> من ${b.check_in} إلى ${b.check_out} (${b.total_nights} ليالٍ)</p>
                <p><strong>المبلغ المدفوع:</strong> <span style="color: #10b981; font-weight: bold; font-size: 1.15rem;">${Number(b.total_price).toLocaleString()} ${b.currency}</span> عبر ${b.payment_method_name}</p>
                ${b.special_requests ? `<p><strong>طلبات خاصة:</strong> ${b.special_requests}</p>` : ''}
            </div>

            <!-- معاينة رسالة البريد الإلكتروني المرسلة -->
            <div style="background: #ffffff; color: #000; border-radius: 14px; padding: 16px; margin-top: 20px; border: 2px solid var(--admin-border-light);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 14px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-envelope" style="color: #7c3aed; font-size: 20px;"></i>
                        <strong style="color: #1e1b4b;">معاينة رسالة البريد الإلكتروني المرسلة للنزيل:</strong>
                    </div>
                    <span style="font-size: 0.78rem; background: #ede9fe; color: #6d28d9; padding: 4px 10px; border-radius: 20px; font-weight: bold;">تم الإرسال بنجاح ✅</span>
                </div>
                <div style="max-height: 340px; overflow-y: auto;">
                    ${email.html}
                </div>
            </div>
        `;

        elements.bookingDetailModal.style.display = 'flex';
    };

    window.changeBookingStatus = async (idOrRef, newStatus) => {
        const success = await CoralDB.updateBookingStatus(idOrRef, newStatus);
        if (success) await refreshDashboard();
    };

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
                elements.btnRefresh.innerHTML = `<i class="fas fa-spinner fa-spin"></i>`;
                await refreshDashboard();
                elements.btnRefresh.innerHTML = `<i class="fas fa-sync-alt"></i> تحديث`;
            });
        }
        if (elements.closeDetailModal) {
            elements.closeDetailModal.addEventListener('click', () => {
                elements.bookingDetailModal.style.display = 'none';
            });
        }
        window.addEventListener('click', (e) => {
            if (e.target === elements.bookingDetailModal) elements.bookingDetailModal.style.display = 'none';
        });

        // الاستماع الفوري لأي حجز جديد ينشأ في شاشة النزيل لتحديث اللوحة لحظياً
        window.addEventListener('coral:new-booking', () => {
            refreshDashboard();
        });
    }
});
