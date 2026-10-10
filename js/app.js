// ========================================================
// CORAL HOTEL - سكربت شاشة النزيل التفاعلية (Guest App Engine)
// فروع: البحر الأحمر، كسلا، نهر النيل
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
    // حالة التطبيق
    let state = {
        branches: [],
        rooms: [],
        offers: [],
        selectedBranchId: 'all',
        selectedRoomType: 'all',
        currentBooking: {
            room: null,
            branch: null,
            checkIn: '',
            checkOut: '',
            nights: 1,
            guests: 2,
            totalPrice: 0,
            paymentMethod: 'bankak'
        }
    };

    // عناصر واجهة المستخدم
    const elements = {
        offersContainer: document.getElementById('offersGrid'),
        branchesContainer: document.getElementById('branchesGrid'),
        roomsContainer: document.getElementById('roomsGrid'),
        searchForm: document.getElementById('searchForm'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        bookingModal: document.getElementById('bookingModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        toastContainer: document.getElementById('toastContainer'),
        
        // خطوات نافذة الحجز
        stepIndicators: document.querySelectorAll('.step-item'),
        step1: document.getElementById('step1Content'),
        step2: document.getElementById('step2Content'),
        step3: document.getElementById('step3Content'),
        
        // نماذج الحجز والدفع
        guestForm: document.getElementById('guestDetailsForm'),
        btnToPayment: document.getElementById('btnToPayment'),
        btnBackToDetails: document.getElementById('btnBackToDetails'),
        btnConfirmPayment: document.getElementById('btnConfirmPayment'),
        btnPrintVoucher: document.getElementById('btnPrintVoucher'),
        
        // عناصر ملخص الحجز
        summaryImg: document.getElementById('summaryRoomImg'),
        summaryTitle: document.getElementById('summaryRoomTitle'),
        summaryBranch: document.getElementById('summaryBranchName'),
        summaryPrice: document.getElementById('summaryRoomPrice'),
        summaryNights: document.getElementById('summaryNights'),
        summaryTotal: document.getElementById('summaryTotalPrice'),
        
        // تبويبات الدفع
        tabBankak: document.getElementById('tabBankak'),
        tabCard: document.getElementById('tabCard'),
        viewBankak: document.getElementById('viewBankak'),
        viewCard: document.getElementById('viewCard'),
        
        // شاشة السند النهائي
        voucherRef: document.getElementById('voucherRefCode'),
        voucherGuest: document.getElementById('voucherGuestName'),
        voucherBranch: document.getElementById('voucherBranchName'),
        voucherRoom: document.getElementById('voucherRoomTitle'),
        voucherDates: document.getElementById('voucherStayDates'),
        voucherAmount: document.getElementById('voucherPaidAmount'),
        voucherMethod: document.getElementById('voucherPayMethod'),
        voucherTxn: document.getElementById('voucherTxnId'),
        smsMessageText: document.getElementById('smsMessageText')
    };

    // تهيئة البيانات الأولية
    await loadInitialData();

    // 1. تحميل البيانات من المحرك (Storage/PHP)
    async function loadInitialData() {
        showToast('مرحباً بك في فندق كورال السودان 🌟', 'info');
        state.branches = await CoralDB.getBranches();
        state.offers = await CoralDB.getOffers();
        state.rooms = await CoralDB.getRooms();

        renderBranches();
        renderOffers();
        renderRooms();
        populateBranchSelects();
        setupDefaultDates();
    }

    // إعداد التواريخ الافتراضية (اليوم وغداً)
    function setupDefaultDates() {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const todayStr = today.toISOString().split('T')[0];
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const searchIn = document.getElementById('searchCheckIn');
        const searchOut = document.getElementById('searchCheckOut');
        const modalIn = document.getElementById('modalCheckIn');
        const modalOut = document.getElementById('modalCheckOut');

        if (searchIn) { searchIn.value = todayStr; searchIn.min = todayStr; }
        if (searchOut) { searchOut.value = tomorrowStr; searchOut.min = tomorrowStr; }
        if (modalIn) { modalIn.value = todayStr; modalIn.min = todayStr; }
        if (modalOut) { modalOut.value = tomorrowStr; modalOut.min = tomorrowStr; }
    }

    // ملء قوائم الفروع
    function populateBranchSelects() {
        const branchSelect = document.getElementById('searchBranch');
        if (branchSelect) {
            branchSelect.innerHTML = '<option value="all">جميع الفروع (البحر الأحمر، كسلا، نهر النيل)</option>';
            state.branches.forEach(b => {
                branchSelect.innerHTML += `<option value="${b.id}">${b.name_ar}</option>`;
            });
        }
    }

    // 2. عرض العروض الترويجية الحصرية
    function renderOffers() {
        if (!elements.offersContainer) return;
        elements.offersContainer.innerHTML = state.offers.map(offer => `
            <div class="offer-card">
                <div class="offer-img-box">
                    <img src="${offer.image}" alt="${offer.title}" loading="lazy">
                    <span class="offer-badge">${offer.badge}</span>
                    <span class="offer-branch-tag">${offer.branch_name}</span>
                </div>
                <div class="offer-body">
                    <h3 class="offer-title">${offer.title}</h3>
                    <p class="offer-desc">${offer.description}</p>
                    <div class="offer-features">
                        ${(offer.features || []).map(f => `
                            <div class="offer-feature-item">
                                <i class="fas fa-check-circle"></i>
                                <span>${f}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="offer-footer">
                        <div class="offer-price-box">
                            <span class="offer-original-price">${Number(offer.original_price).toLocaleString()} ج.س</span>
                            <div class="offer-deal-price">
                                ${Number(offer.offer_price).toLocaleString()} <span>ج.س / الباقة</span>
                            </div>
                        </div>
                        <button class="btn btn-gold btn-sm" onclick="window.bookOffer(${offer.id})">
                            <i class="fas fa-calendar-check"></i> احجز العرض
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 3. عرض فروع الفندق في الولايات
    function renderBranches() {
        if (!elements.branchesContainer) return;
        elements.branchesContainer.innerHTML = state.branches.map(branch => `
            <div class="branch-card">
                <div class="branch-img-box">
                    <img src="${branch.image}" alt="${branch.name_ar}" loading="lazy">
                    <span class="branch-state-badge">ولاية ${branch.state}</span>
                    <div class="branch-rating">
                        <i class="fas fa-star"></i>
                        <span>${branch.rating} (${branch.reviewsCount || 300}+ تقييم)</span>
                    </div>
                </div>
                <div class="branch-body">
                    <h3 class="branch-name">${branch.name_ar}</h3>
                    <div class="branch-tagline">${branch.tagline || ''}</div>
                    <p class="branch-desc">${branch.description}</p>
                    <div class="branch-features-list">
                        ${(branch.features || []).slice(0, 4).map(f => `
                            <div class="branch-feature-item">
                                <i class="fas fa-check-double"></i>
                                <span>${f}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="branch-actions">
                        <button class="btn btn-primary" style="flex: 1;" onclick="window.filterByBranch(${branch.id})">
                            <i class="fas fa-door-open"></i> استعراض الغرف
                        </button>
                        <a href="tel:${branch.phone}" class="btn btn-outline-gold" title="اتصل بالفرع">
                            <i class="fas fa-phone-alt"></i>
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 4. عرض الغرف والأجنحة مع التصفية
    function renderRooms(roomsToRender = state.rooms) {
        if (!elements.roomsContainer) return;
        if (roomsToRender.length === 0) {
            elements.roomsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1;">
                    <i class="fas fa-search" style="font-size: 40px; color: #94a3b8; margin-bottom: 15px;"></i>
                    <h3 style="color: #1e293b; margin-bottom: 8px;">لا توجد غرف مطابقة لهذا البحث حالياً</h3>
                    <p style="color: #64748b; margin-bottom: 20px;">يمكنك تجربة فرع آخر أو إزالة التصفية لمشاهدة جميع الأجنحة المتاحة.</p>
                    <button class="btn btn-gold" onclick="window.resetRoomsFilter()">عرض جميع الغرف</button>
                </div>
            `;
            return;
        }

        elements.roomsContainer.innerHTML = roomsToRender.map(room => `
            <div class="room-card">
                <div class="room-img-box">
                    <img src="${room.image}" alt="${room.title}" loading="lazy">
                    <span class="room-badge">${room.badge || room.typeNameAr || 'فاخر'}</span>
                    <span class="room-branch-badge">${room.branch_state || ''}</span>
                </div>
                <div class="room-body">
                    <h3 class="room-title">${room.title}</h3>
                    <div class="room-meta">
                        <span><i class="fas fa-user-friends"></i> ${room.capacity} نزلاء</span>
                        <span><i class="fas fa-bed"></i> ${room.beds}</span>
                        <span><i class="fas fa-vector-square"></i> ${room.size_sqm} م²</span>
                    </div>
                    <div class="room-amenities">
                        ${(Array.isArray(room.amenities) ? room.amenities : (room.amenities ? room.amenities.split('،') : [])).slice(0, 4).map(a => `
                            <span class="amenity-chip">${a.trim()}</span>
                        `).join('')}
                    </div>
                    <div class="room-footer">
                        <div class="room-price">
                            ${Number(room.price_per_night).toLocaleString()} <small>ج.س / ليلة</small>
                        </div>
                        <button class="btn btn-gold btn-sm" onclick="window.startBooking(${room.id})">
                            <i class="fas fa-calendar-check"></i> احجز الآن
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // تصفية الغرف بواسطة الأزرار العلوية
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.getAttribute('data-type');
            state.selectedRoomType = type;
            applyRoomFilters();
        });
    });

    // تصفية الغرف عبر نموذج البحث الرئيسي
    if (elements.searchForm) {
        elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const branchVal = document.getElementById('searchBranch').value;
            const typeVal = document.getElementById('searchRoomType').value;
            const checkIn = document.getElementById('searchCheckIn').value;
            const checkOut = document.getElementById('searchCheckOut').value;
            const guests = document.getElementById('searchGuests').value;

            state.selectedBranchId = branchVal;
            state.selectedRoomType = typeVal;

            // تحديث التواريخ في حالة الحجز
            state.currentBooking.checkIn = checkIn;
            state.currentBooking.checkOut = checkOut;
            state.currentBooking.guests = guests;

            applyRoomFilters();

            // الانتقال السلس لقسم الغرف
            document.getElementById('rooms').scrollIntoView({ behavior: 'smooth' });
            showToast(`تم تحديث نتائج البحث بناءً على خياراتك!`, 'info');
        });
    }

    function applyRoomFilters() {
        let filtered = [...state.rooms];
        if (state.selectedBranchId && state.selectedBranchId !== 'all') {
            filtered = filtered.filter(r => r.branch_id == state.selectedBranchId);
        }
        if (state.selectedRoomType && state.selectedRoomType !== 'all') {
            filtered = filtered.filter(r => r.room_type === state.selectedRoomType);
        }
        renderRooms(filtered);
    }

    // دوال عامة للنوافذ والروابط
    window.resetRoomsFilter = () => {
        state.selectedBranchId = 'all';
        state.selectedRoomType = 'all';
        elements.filterButtons.forEach(b => b.classList.remove('active'));
        elements.filterButtons[0].classList.add('active');
        if (document.getElementById('searchBranch')) document.getElementById('searchBranch').value = 'all';
        if (document.getElementById('searchRoomType')) document.getElementById('searchRoomType').value = 'all';
        renderRooms(state.rooms);
    };

    window.filterByBranch = (branchId) => {
        state.selectedBranchId = branchId;
        if (document.getElementById('searchBranch')) document.getElementById('searchBranch').value = branchId;
        document.getElementById('rooms').scrollIntoView({ behavior: 'smooth' });
        applyRoomFilters();
    };

    window.bookOffer = (offerId) => {
        const offer = state.offers.find(o => o.id == offerId);
        if (!offer) return;
        // ربط العرض بأقرب غرفة للفرع
        const room = state.rooms.find(r => r.branch_id == offer.branch_id) || state.rooms[0];
        window.startBooking(room.id, offer);
    };

    // ========================================================
    // نافذة الحجز التفاعلية وخطوات الدفع (Modal & Booking Flow)
    // ========================================================
    window.startBooking = (roomId, offerData = null) => {
        const room = state.rooms.find(r => r.id == roomId);
        if (!room) return;

        const branch = state.branches.find(b => b.id == room.branch_id) || { name_ar: room.branch_name, state: room.branch_state };

        const checkInVal = document.getElementById('searchCheckIn')?.value || new Date().toISOString().split('T')[0];
        let checkOutVal = document.getElementById('searchCheckOut')?.value;
        if (!checkOutVal) {
            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);
            checkOutVal = nextDay.toISOString().split('T')[0];
        }

        const date1 = new Date(checkInVal);
        const date2 = new Date(checkOutVal);
        let nights = Math.max(1, Math.round((date2 - date1) / (1000 * 60 * 60 * 24)));
        if (isNaN(nights) || nights <= 0) nights = 1;

        const pricePerNight = offerData ? (offerData.offer_price / 2) : room.price_per_night;
        const total = pricePerNight * nights;

        state.currentBooking = {
            room: room,
            branch: branch,
            checkIn: checkInVal,
            checkOut: checkOutVal,
            nights: nights,
            pricePerNight: pricePerNight,
            totalPrice: total,
            offerData: offerData,
            paymentMethod: 'bankak'
        };

        // تعبئة حقول النافذة
        elements.summaryImg.src = room.image;
        elements.summaryTitle.textContent = offerData ? `${room.title} (${offerData.title})` : room.title;
        elements.summaryBranch.textContent = `📍 ${branch.name_ar} - ولاية ${branch.state}`;
        elements.summaryPrice.textContent = `${Number(pricePerNight).toLocaleString()} ج.س / ليلة`;
        elements.summaryNights.textContent = `${nights} ليالٍ`;
        elements.summaryTotal.textContent = `${Number(total).toLocaleString()} ج.س`;

        document.getElementById('modalCheckIn').value = checkInVal;
        document.getElementById('modalCheckOut').value = checkOutVal;
        document.getElementById('modalNightsDisplay').textContent = `${nights} ليلة`;

        // إعادة ضبط الخطوات إلى الخطوة 1
        switchStep(1);
        openModal();
    };

    // تغيير التواريخ وحساب الليالي تلقائياً
    const modalIn = document.getElementById('modalCheckIn');
    const modalOut = document.getElementById('modalCheckOut');
    if (modalIn && modalOut) {
        const updateNights = () => {
            const d1 = new Date(modalIn.value);
            const d2 = new Date(modalOut.value);
            let n = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
            if (isNaN(n) || n <= 0) n = 1;
            state.currentBooking.nights = n;
            state.currentBooking.checkIn = modalIn.value;
            state.currentBooking.checkOut = modalOut.value;
            state.currentBooking.totalPrice = state.currentBooking.pricePerNight * n;

            elements.summaryNights.textContent = `${n} ليالٍ`;
            elements.summaryTotal.textContent = `${Number(state.currentBooking.totalPrice).toLocaleString()} ج.س`;
            document.getElementById('modalNightsDisplay').textContent = `${n} ليلة`;
        };
        modalIn.addEventListener('change', updateNights);
        modalOut.addEventListener('change', updateNights);
    }

    // التنقل بين خطوات الحجز
    function switchStep(stepNumber) {
        elements.stepIndicators.forEach(item => {
            const step = parseInt(item.getAttribute('data-step'));
            item.classList.remove('active', 'completed');
            if (step === stepNumber) item.classList.add('active');
            else if (step < stepNumber) item.classList.add('completed');
        });

        elements.step1.classList.remove('active');
        elements.step2.classList.remove('active');
        elements.step3.classList.remove('active');

        if (stepNumber === 1) elements.step1.classList.add('active');
        if (stepNumber === 2) {
            elements.step2.classList.add('active');
            document.getElementById('paymentAmountSummary').textContent = `${Number(state.currentBooking.totalPrice).toLocaleString()} ج.س`;
        }
        if (stepNumber === 3) elements.step3.classList.add('active');
    }

    // الانتقال من تفاصيل النزيل إلى الدفع
    if (elements.btnToPayment) {
        elements.btnToPayment.addEventListener('click', () => {
            const name = document.getElementById('guestName').value.trim();
            const phone = document.getElementById('guestPhone').value.trim();
            const nationalId = document.getElementById('guestNationalId').value.trim();

            if (!name) {
                showToast('يرجى إدخال اسم النزيل بالكامل', 'warning');
                document.getElementById('guestName').focus();
                return;
            }
            if (!phone || phone.length < 9) {
                showToast('يرجى إدخال رقم هاتف صحيح (سوداني)', 'warning');
                document.getElementById('guestPhone').focus();
                return;
            }

            // حفظ بيانات النزيل في الحالة
            state.currentBooking.guestName = name;
            state.currentBooking.guestPhone = phone;
            state.currentBooking.guestEmail = document.getElementById('guestEmail').value.trim();
            state.currentBooking.guestNationalId = nationalId;
            state.currentBooking.specialRequests = document.getElementById('guestNotes').value.trim();

            switchStep(2);
        });
    }

    if (elements.btnBackToDetails) {
        elements.btnBackToDetails.addEventListener('click', () => {
            switchStep(1);
        });
    }

    // اختيار وسيلة الدفع (بنكك vs فيزا)
    if (elements.tabBankak && elements.tabCard) {
        elements.tabBankak.addEventListener('click', () => {
            elements.tabBankak.classList.add('active');
            elements.tabCard.classList.remove('active');
            elements.viewBankak.style.display = 'block';
            elements.viewCard.style.display = 'none';
            state.currentBooking.paymentMethod = 'bankak';
        });

        elements.tabCard.addEventListener('click', () => {
            elements.tabCard.classList.add('active');
            elements.tabBankak.classList.remove('active');
            elements.viewCard.style.display = 'block';
            elements.viewBankak.style.display = 'none';
            state.currentBooking.paymentMethod = 'card';
        });
    }

    // تنسيق إدخال رقم البطاقة الائتمانية تلقائياً
    const cardInput = document.getElementById('cardNum');
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '').slice(0, 16);
            v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = v;
        });
    }

    // ========================================================
    // تأكيد الدفع الفوري وإنشاء الحجز وإرسال الرسالة
    // ========================================================
    if (elements.btnConfirmPayment) {
        elements.btnConfirmPayment.addEventListener('click', async () => {
            // محاكاة زر الدفع وتأمين العملية
            const originalText = elements.btnConfirmPayment.innerHTML;
            elements.btnConfirmPayment.disabled = true;
            elements.btnConfirmPayment.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري الاتصال ببوابة الدفع الآمنة...`;

            let senderAcc = '';
            if (state.currentBooking.paymentMethod === 'bankak') {
                senderAcc = document.getElementById('bankakAccountNum')?.value.trim() || 'حساب بنكك للعميل';
            } else {
                const cardNum = document.getElementById('cardNum')?.value.trim();
                senderAcc = cardNum ? `بطاقة **** ${cardNum.slice(-4)}` : 'بطاقة مصرفية';
            }

            // محاكاة وقت المعالجة البنكية (1.2 ثانية)
            await new Promise(r => setTimeout(r, 1200));

            const bookingPayload = {
                branch_id: state.currentBooking.branch.id || state.currentBooking.room.branch_id,
                branch_name: state.currentBooking.branch.name_ar,
                branch_state: state.currentBooking.branch.state,
                room_id: state.currentBooking.room.id,
                room_title: state.currentBooking.room.title,
                room_image: state.currentBooking.room.image,
                guest_name: state.currentBooking.guestName,
                guest_phone: state.currentBooking.guestPhone,
                guest_email: state.currentBooking.guestEmail,
                guest_national_id: state.currentBooking.guestNationalId,
                check_in: state.currentBooking.checkIn,
                check_out: state.currentBooking.checkOut,
                total_nights: state.currentBooking.nights,
                total_price: state.currentBooking.totalPrice,
                payment_method: state.currentBooking.paymentMethod,
                payment_method_name: state.currentBooking.paymentMethod === 'bankak' ? 'تطبيق بنكك (بنك الخرطوم)' : 'بطاقة فيزا / ماستركارد',
                sender_account: senderAcc,
                special_requests: state.currentBooking.specialRequests
            };

            // حفظ في قاعدة البيانات (XAMPP / Storage)
            const result = await CoralDB.createBooking(bookingPayload);

            elements.btnConfirmPayment.disabled = false;
            elements.btnConfirmPayment.innerHTML = originalText;

            if (result.success) {
                const b = result.booking;
                const txnId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);

                // تعبئة سند الحجز والرسالة التأكيدية
                elements.voucherRef.textContent = b.booking_ref;
                elements.voucherGuest.textContent = b.guest_name;
                elements.voucherBranch.textContent = `${b.branch_name} (${b.branch_state})`;
                elements.voucherRoom.textContent = b.room_title;
                elements.voucherDates.textContent = `من ${b.check_in} إلى ${b.check_out} (${b.total_nights} ليالٍ)`;
                elements.voucherAmount.textContent = `${Number(b.total_price).toLocaleString()} ج.س (مدفوع بالكامل)`;
                elements.voucherMethod.textContent = b.payment_method_name;
                elements.voucherTxn.textContent = txnId;

                // نص الرسالة التأكيدية المحاكية لـ SMS / WhatsApp
                elements.smsMessageText.innerHTML = `
                    <strong>📩 نص رسالة تأكيد الحجز المرسلة للنزيل:</strong><br>
                    "مرحباً بك عزيزي <b>${b.guest_name}</b> في فندق كورال! تم تأكيد حجزك ورقمك المرجعي هو: <b>${b.booking_ref}</b> لفرع <b>${b.branch_name}</b>. تسجيل الوصول بتاريخ: ${b.check_in}. شكراً لاختيارك فندق كورال - السودان."
                `;

                switchStep(3);
                showToast(`🎉 تم تأكيد حجزك بنجاح! رقم الحجز: ${b.booking_ref}`, 'success');
            } else {
                showToast('حدث خطأ أثناء معالجة الحجز، يرجى المحاولة مرة أخرى', 'danger');
            }
        });
    }

    // طباعة سند الحجز
    if (elements.btnPrintVoucher) {
        elements.btnPrintVoucher.addEventListener('click', () => {
            window.print();
        });
    }

    // إغلاق النافذة
    function openModal() {
        elements.bookingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        elements.bookingModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    if (elements.closeModalBtn) {
        elements.closeModalBtn.addEventListener('click', closeModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === elements.bookingModal) closeModal();
    });

    // نظام التنبيهات المنبثقة (Toaster)
    function showToast(message, type = 'info') {
        if (!elements.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        const icon = type === 'success' ? 'fa-check-circle' : (type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle');
        toast.innerHTML = `
            <i class="fas ${icon}" style="color: var(--gold); font-size: 1.2rem;"></i>
            <span>${message}</span>
        `;
        elements.toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
});
