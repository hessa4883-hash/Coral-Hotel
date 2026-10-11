// ========================================================
// CORAL HOTEL SUDAN - سكربت شاشة النزيل المتكاملة (Guest App Engine)
// يدعم العملات المتعددة (SDG, USD, SAR)، اللغتين (AR, EN)، الإقامة الأجنبية، ومحاكاة البريد
// ========================================================

document.addEventListener('DOMContentLoaded', async () => {
    let state = {
        branches: [],
        rooms: [],
        offers: [],
        selectedBranchId: 'all',
        selectedRoomType: 'all',
        currentBooking: {
            room: null,
            branch: null,
            residencyType: 'local', // 'local' or 'foreign'
            checkIn: '',
            checkOut: '',
            nights: 1,
            guests: 2,
            totalPrice: 0,
            paymentMethod: 'bankak',
            currency: 'SDG'
        }
    };

    // قاموس الترجمة الفندقية (عربي وإنجليزي)
    const i18n = {
        ar: {
            nav_home: "الرئيسية",
            nav_offers: "العروض الحصرية",
            nav_branches: "فروع الولايات",
            nav_rooms: "الغرف والأجنحة",
            nav_mybooking: "تتبع حجزي",
            nav_admin: "لوحة المدير السرية",
            hero_pill: "أرقى درجات الضيافة الفندقية في السودان",
            hero_welcome: "فخامة الإقامة في",
            hero_sub: "المقر الرئيسي بالخرطوم على شارع النيل، وفروعنا الساحرة في بورتسودان (البحر الأحمر)، كسلا (جبال التوتيل)، وعطبرة (ولاية نهر النيل). نرحب بالضيوف السودانيين والأجانب بخيارات دفع متعددة.",
            loc_khartoum: "المقر الرئيسي: الخرطوم",
            btn_book_now: "احجز الآن إقامة فاخرة",
            btn_view_offers: "استعراض عروض الموسم",
            search_branch_lbl: "اختر الفرع / الولاية",
            search_checkin_lbl: "تاريخ الوصول",
            search_checkout_lbl: "تاريخ المغادرة",
            search_type_lbl: "نوع الإقامة",
            btn_search: "بحث وتحديث",
            offers_badge: "عروض وخصومات حصرية",
            offers_title: "باقات فندق كورال المميزة",
            offers_sub: "خصومات خاصة تصل إلى 33% في المقر الرئيسي بالخرطوم، بورتسودان، كسلا، وعطبرة بنهر النيل",
            branches_badge: "فروعنا في السودان",
            branches_title: "انتشارنا الاستراتيجي في الولايات",
            branches_sub: "المقر الرئيسي بالخرطوم، فرع البحر الأحمر ببورتسودان، فرع كسلا بجبال التوتيل، وفرع ولاية نهر النيل في مدينة عطبرة فقط",
            rooms_badge: "إقامة 5 نجوم فاخرة",
            rooms_title: "الغرف والأجنحة الفندقية",
            rooms_sub: "أجنحة رئاسية مطلة على النيل والبحر، فلل جبل التوتيل، شاليهات عطبرة، وغرف تنفيذية مجهزة بأعلى المقاييس",
            step_1: "معلومات النزيل والإقامة",
            step_2: "الدفع والخيارات",
            step_3: "التأكيد ورسالة البريد"
        },
        en: {
            nav_home: "Home",
            nav_offers: "Exclusive Offers",
            nav_branches: "Branches",
            nav_rooms: "Rooms & Suites",
            nav_mybooking: "Track Booking",
            nav_admin: "Admin Center",
            hero_pill: "Premier Luxury Hospitality in Sudan",
            hero_welcome: "Luxury Stay at",
            hero_sub: "Headquarters in Khartoum on Nile Street, plus stunning branches in Port Sudan (Red Sea), Kassala (Mount Totil), and Atbara (River Nile). Welcoming local and international guests with flexible payments.",
            loc_khartoum: "Headquarters: Khartoum",
            btn_book_now: "Book Luxury Stay Now",
            btn_view_offers: "View Seasonal Offers",
            search_branch_lbl: "Select Branch / State",
            search_checkin_lbl: "Check-in Date",
            search_checkout_lbl: "Check-out Date",
            search_type_lbl: "Accommodation Type",
            btn_search: "Search & Filter",
            offers_badge: "Exclusive Deals & Discounts",
            offers_title: "Coral Special Hotel Packages",
            offers_sub: "Special discounts up to 33% at Khartoum HQ, Port Sudan, Kassala, and Atbara (River Nile)",
            branches_badge: "Our Destinations in Sudan",
            branches_title: "Strategic Presence Across States",
            branches_sub: "Headquarters in Khartoum, Red Sea in Port Sudan, Mount Totil in Kassala, and River Nile branch exclusively in Atbara",
            rooms_badge: "5-Star Luxury Living",
            rooms_title: "Rooms & Royal Suites",
            rooms_sub: "Presidential suites overlooking the Nile and Sea, Totil private villas, Atbara chalets, and executive corporate rooms",
            step_1: "Guest Details & Stay",
            step_2: "Payment & Options",
            step_3: "Confirmation & Email"
        }
    };

    const elements = {
        offersContainer: document.getElementById('offersGrid'),
        branchesContainer: document.getElementById('branchesGrid'),
        roomsContainer: document.getElementById('roomsGrid'),
        searchForm: document.getElementById('searchForm'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        bookingModal: document.getElementById('bookingModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        toastContainer: document.getElementById('toastContainer'),

        // محولات العملة واللغة
        currencySelector: document.getElementById('currencySelector'),
        langSelector: document.getElementById('langSelector'),

        // خطوات الحجز
        stepIndicators: document.querySelectorAll('.step-item'),
        step1: document.getElementById('step1Content'),
        step2: document.getElementById('step2Content'),
        step3: document.getElementById('step3Content'),

        // أزرار ونماذج
        btnToPayment: document.getElementById('btnToPayment'),
        btnBackToDetails: document.getElementById('btnBackToDetails'),
        btnConfirmPayment: document.getElementById('btnConfirmPayment'),
        btnPrintVoucher: document.getElementById('btnPrintVoucher'),
        btnViewEmailInbox: document.getElementById('btnViewEmailInbox'),

        // محدد نوع الإقامة
        residencyLocalBtn: document.getElementById('residencyLocalBtn'),
        residencyForeignBtn: document.getElementById('residencyForeignBtn'),
        localIdFields: document.getElementById('localIdFields'),
        foreignIdFields: document.getElementById('foreignIdFields'),

        // ملخص الحجز
        summaryImg: document.getElementById('summaryRoomImg'),
        summaryTitle: document.getElementById('summaryRoomTitle'),
        summaryBranch: document.getElementById('summaryBranchName'),
        summaryPrice: document.getElementById('summaryRoomPrice'),
        summaryNights: document.getElementById('summaryNights'),
        summaryTotal: document.getElementById('summaryTotalPrice'),

        // تبويبات الدفع
        tabBankak: document.getElementById('tabBankak'),
        tabCard: document.getElementById('tabCard'),
        tabCash: document.getElementById('tabCash'),
        viewBankak: document.getElementById('viewBankak'),
        viewCard: document.getElementById('viewCard'),
        viewCash: document.getElementById('viewCash'),

        // نافذة البريد الإلكتروني المستلم
        emailModal: document.getElementById('emailModal'),
        emailInboxContent: document.getElementById('emailInboxContent'),
        closeEmailModalBtn: document.getElementById('closeEmailModalBtn')
    };

    await loadInitialData();
    setupCurrencyAndLang();

    async function loadInitialData() {
        state.branches = await CoralDB.getBranches();
        state.offers = await CoralDB.getOffers();
        state.rooms = await CoralDB.getRooms();

        renderBranches();
        renderOffers();
        renderRooms();
        populateBranchSelects();
        setupDefaultDates();
    }

    // إعداد التواريخ
    function setupDefaultDates() {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const dIn = today.toISOString().split('T')[0];
        const dOut = tomorrow.toISOString().split('T')[0];

        if (document.getElementById('searchCheckIn')) document.getElementById('searchCheckIn').value = dIn;
        if (document.getElementById('searchCheckOut')) document.getElementById('searchCheckOut').value = dOut;
        if (document.getElementById('modalCheckIn')) document.getElementById('modalCheckIn').value = dIn;
        if (document.getElementById('modalCheckOut')) document.getElementById('modalCheckOut').value = dOut;
    }

    function populateBranchSelects() {
        const branchSelect = document.getElementById('searchBranch');
        if (branchSelect) {
            branchSelect.innerHTML = '<option value="all">كافة الفروع (الخرطوم، بورتسودان، كسلا، عطبرة)</option>';
            state.branches.forEach(b => {
                branchSelect.innerHTML += `<option value="${b.id}">${b.name_ar}</option>`;
            });
        }
    }

    // إعداد العملات واللغة
    function setupCurrencyAndLang() {
        const currentCur = CoralDB.getCurrency();
        const currentLang = CoralDB.getLang();

        if (elements.currencySelector) {
            elements.currencySelector.value = currentCur;
            elements.currencySelector.addEventListener('change', (e) => {
                CoralDB.setCurrency(e.target.value);
                applyCurrencyChange();
            });
        }

        if (elements.langSelector) {
            elements.langSelector.value = currentLang;
            elements.langSelector.addEventListener('change', (e) => {
                CoralDB.setLang(e.target.value);
                applyLangChange(e.target.value);
            });
        }

        applyLangChange(currentLang);
    }

    function applyCurrencyChange() {
        renderOffers();
        renderRooms();
        updateModalPrices();
        showToast(`تم تغيير عملة العرض إلى: ${CoralDB.getCurrency()}`, 'info');
    }

    function applyLangChange(lang) {
        document.documentElement.lang = lang;
        if (lang === 'en') {
            document.body.classList.add('ltr-mode');
            document.documentElement.dir = 'ltr';
            document.getElementById('brandTitle').textContent = 'Coral Hotel Sudan';
            document.getElementById('brandSub').textContent = 'KHARTOUM • PORT SUDAN • KASSALA • ATBARA';
        } else {
            document.body.classList.remove('ltr-mode');
            document.documentElement.dir = 'rtl';
            document.getElementById('brandTitle').textContent = 'فندق كورال السودان';
            document.getElementById('brandSub').textContent = 'CORAL HOTELS SUDAN';
        }

        // تحديث النصوص ذات السمة data-i18n
        const dict = i18n[lang] || i18n.ar;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });

        renderBranches();
        renderOffers();
        renderRooms();
    }

    // 1. عرض العروض الترويجية مع تحويل العملة
    function renderOffers() {
        if (!elements.offersContainer) return;
        const lang = CoralDB.getLang();
        const isAr = lang === 'ar';

        elements.offersContainer.innerHTML = state.offers.map(offer => {
            const origPriceFormatted = CoralDB.formatPrice(offer.original_price_sdg);
            const dealPriceFormatted = CoralDB.formatPrice(offer.offer_price_sdg);
            const title = isAr ? offer.title_ar : offer.title_en;
            const branchName = isAr ? offer.branch_name_ar : offer.branch_name_en;
            const desc = isAr ? offer.description_ar : offer.description_en;
            const badge = isAr ? offer.badge_ar : offer.badge_en;
            const features = isAr ? offer.features_ar : offer.features_en;

            return `
                <div class="offer-card">
                    <div class="offer-img-box">
                        <img src="${offer.image}" alt="${title}" loading="lazy">
                        <span class="offer-badge">${badge}</span>
                        <span class="offer-branch-tag">${branchName}</span>
                    </div>
                    <div class="offer-body">
                        <h3 class="offer-title">${title}</h3>
                        <p class="offer-desc">${desc}</p>
                        <div class="offer-features">
                            ${(features || []).map(f => `
                                <div class="offer-feature-item">
                                    <i class="fas fa-check-circle"></i>
                                    <span>${f}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="offer-footer">
                            <div class="offer-price-box">
                                <span class="offer-original-price">${origPriceFormatted}</span>
                                <div class="offer-deal-price">${dealPriceFormatted}</div>
                            </div>
                            <button class="btn btn-purple btn-sm" onclick="window.bookOffer(${offer.id})">
                                <i class="fas fa-calendar-check"></i> ${isAr ? 'احجز العرض' : 'Book Deal'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 2. عرض فروع السودان الأربعة (الخرطوم، بورتسودان، كسلا، وعطبرة بنهر النيل)
    function renderBranches() {
        if (!elements.branchesContainer) return;
        const lang = CoralDB.getLang();
        const isAr = lang === 'ar';

        elements.branchesContainer.innerHTML = state.branches.map(b => {
            const name = isAr ? b.name_ar : b.name_en;
            const stateName = isAr ? b.state : b.state_en;
            const tagline = isAr ? b.tagline_ar : b.tagline_en;
            const desc = isAr ? b.description_ar : b.description_en;
            const features = isAr ? b.features_ar : b.features_en;

            return `
                <div class="branch-card">
                    <div class="branch-img-box">
                        <img src="${b.image}" alt="${name}" loading="lazy">
                        <span class="branch-state-badge">${isAr ? 'ولاية ' : ''}${stateName}</span>
                        <div class="branch-rating">
                            <i class="fas fa-star"></i>
                            <span>${b.rating} (${b.reviewsCount}+)</span>
                        </div>
                    </div>
                    <div class="branch-body">
                        <h3 class="branch-name">${name}</h3>
                        <div class="branch-tagline">${tagline || ''}</div>
                        <p class="branch-desc">${desc}</p>
                        <div class="branch-features-list">
                            ${(features || []).slice(0, 4).map(f => `
                                <div class="branch-feature-item">
                                    <i class="fas fa-check-double"></i>
                                    <span>${f}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="branch-actions">
                            <button class="btn btn-purple" style="flex: 1;" onclick="window.filterByBranch(${b.id})">
                                <i class="fas fa-door-open"></i> ${isAr ? 'استعراض الغرف' : 'View Rooms'}
                            </button>
                            <a href="tel:${b.phone}" class="btn btn-outline-purple" title="اتصل بالفرع">
                                <i class="fas fa-phone-alt"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3. عرض الغرف مع تحويل الأسعار واللغة
    function renderRooms(roomsToRender = state.rooms) {
        if (!elements.roomsContainer) return;
        const lang = CoralDB.getLang();
        const isAr = lang === 'ar';

        if (roomsToRender.length === 0) {
            elements.roomsContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px dashed var(--p-300);">
                    <i class="fas fa-search" style="font-size: 40px; color: var(--p-400); margin-bottom: 15px;"></i>
                    <h3 style="color: var(--p-950); margin-bottom: 8px;">لا توجد غرف مطابقة لهذا البحث</h3>
                    <button class="btn btn-purple" onclick="window.resetRoomsFilter()">عرض جميع الغرف</button>
                </div>
            `;
            return;
        }

        elements.roomsContainer.innerHTML = roomsToRender.map(r => {
            const title = isAr ? r.title_ar : r.title_en;
            const badge = isAr ? (r.badge_ar || r.typeNameAr) : (r.badge_en || r.typeNameEn);
            const beds = isAr ? r.beds : r.beds_en;
            const formattedPrice = CoralDB.formatPrice(r.price_sdg);
            const amenities = isAr ? r.amenities_ar : r.amenities_en;

            return `
                <div class="room-card">
                    <div class="room-img-box">
                        <img src="${r.image}" alt="${title}" loading="lazy">
                        <span class="room-badge">${badge}</span>
                        <span class="room-branch-badge">${r.branch_name}</span>
                    </div>
                    <div class="room-body">
                        <h3 class="room-title">${title}</h3>
                        <div class="room-meta">
                            <span><i class="fas fa-user-friends"></i> ${r.capacity} ${isAr ? 'نزلاء' : 'Guests'}</span>
                            <span><i class="fas fa-bed"></i> ${beds}</span>
                            <span><i class="fas fa-vector-square"></i> ${r.size_sqm} m²</span>
                        </div>
                        <div class="room-amenities">
                            ${(amenities || []).slice(0, 4).map(a => `
                                <span class="amenity-chip">${a}</span>
                            `).join('')}
                        </div>
                        <div class="room-footer">
                            <div class="room-price">
                                ${formattedPrice} <small>/ ${isAr ? 'ليلة' : 'night'}</small>
                            </div>
                            <button class="btn btn-purple btn-sm" onclick="window.startBooking(${r.id})">
                                <i class="fas fa-calendar-check"></i> ${isAr ? 'احجز الآن' : 'Book Now'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // فلترة الغرف
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const type = btn.getAttribute('data-type');
            state.selectedRoomType = type;
            applyRoomFilters();
        });
    });

    if (elements.searchForm) {
        elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            state.selectedBranchId = document.getElementById('searchBranch').value;
            state.selectedRoomType = document.getElementById('searchRoomType').value;
            applyRoomFilters();
            document.getElementById('rooms').scrollIntoView({ behavior: 'smooth' });
            showToast('تم تحديث نتائج البحث!', 'info');
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

    window.resetRoomsFilter = () => {
        state.selectedBranchId = 'all';
        state.selectedRoomType = 'all';
        elements.filterButtons.forEach(b => b.classList.remove('active'));
        elements.filterButtons[0].classList.add('active');
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
        const room = state.rooms.find(r => r.branch_id == offer.branch_id) || state.rooms[0];
        window.startBooking(room.id, offer);
    };

    // فتح شاشة التسجيل المنفصلة مباشرة من الزر الرئيسي
    window.openSeparateBooking = () => {
        window.startBooking(state.rooms[0].id);
    };

    // ========================================================
    // نافذة التسجيل والحجز المنفصلة (Separate Booking & Payment)
    // ========================================================
    window.startBooking = (roomId, offerData = null) => {
        const room = state.rooms.find(r => r.id == roomId) || state.rooms[0];
        const branch = state.branches.find(b => b.id == room.branch_id) || state.branches[0];

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

        const priceInSdg = offerData ? (offerData.offer_price_sdg / 2) : room.price_sdg;
        const totalSdg = priceInSdg * nights;

        state.currentBooking = {
            room: room,
            branch: branch,
            checkIn: checkInVal,
            checkOut: checkOutVal,
            nights: nights,
            priceSdg: priceInSdg,
            totalSdg: totalSdg,
            offerData: offerData,
            paymentMethod: 'bankak',
            residencyType: 'local',
            currency: CoralDB.getCurrency()
        };

        // تعبئة عناصر الملخص
        elements.summaryImg.src = room.image;
        elements.summaryTitle.textContent = offerData ? `${room.title_ar} (${offerData.title_ar})` : room.title_ar;
        elements.summaryBranch.textContent = `📍 ${branch.name_ar} (${branch.state})`;

        updateModalPrices();

        document.getElementById('modalCheckIn').value = checkInVal;
        document.getElementById('modalCheckOut').value = checkOutVal;
        document.getElementById('modalNightsDisplay').textContent = `${nights} ليلة`;

        switchStep(1);
        openModal();
    };

    function updateModalPrices() {
        if (!state.currentBooking.room) return;
        const cur = CoralDB.getCurrency();
        state.currentBooking.currency = cur;

        const convertedNight = CoralDB.convertPrice(state.currentBooking.priceSdg, cur);
        const convertedTotal = CoralDB.convertPrice(state.currentBooking.totalSdg, cur);

        const curInfo = CORAL_CURRENCIES[cur] || CORAL_CURRENCIES.SDG;
        const symbol = CoralDB.getLang() === 'ar' ? curInfo.symbol : curInfo.symbolEn;

        if (elements.summaryPrice) elements.summaryPrice.textContent = `${Number(convertedNight).toLocaleString()} ${symbol} / ليلة`;
        if (elements.summaryNights) elements.summaryNights.textContent = `${state.currentBooking.nights} ليالٍ`;
        if (elements.summaryTotal) elements.summaryTotal.textContent = `${Number(convertedTotal).toLocaleString()} ${symbol}`;
        if (document.getElementById('paymentAmountSummary')) {
            document.getElementById('paymentAmountSummary').textContent = `${Number(convertedTotal).toLocaleString()} ${symbol}`;
        }
    }

    // التبديل بين الإقامة المحلية ومواطن سوداني vs إقامة أجنبية
    if (elements.residencyLocalBtn && elements.residencyForeignBtn) {
        elements.residencyLocalBtn.addEventListener('click', () => {
            elements.residencyLocalBtn.classList.add('active');
            elements.residencyForeignBtn.classList.remove('active');
            elements.localIdFields.style.display = 'block';
            elements.foreignIdFields.style.display = 'none';
            state.currentBooking.residencyType = 'local';
            document.getElementById('guestNationality').value = 'سوداني (Sudan)';
        });

        elements.residencyForeignBtn.addEventListener('click', () => {
            elements.residencyForeignBtn.classList.add('active');
            elements.residencyLocalBtn.classList.remove('active');
            elements.localIdFields.style.display = 'none';
            elements.foreignIdFields.style.display = 'block';
            state.currentBooking.residencyType = 'foreign';
            document.getElementById('guestNationality').value = '';
            document.getElementById('guestNationality').placeholder = 'e.g. British, Saudi, American, Egyptian';
        });
    }

    // تحديث التواريخ في نافذة الحجز
    const modalIn = document.getElementById('modalCheckIn');
    const modalOut = document.getElementById('modalCheckOut');
    if (modalIn && modalOut) {
        const onDateChange = () => {
            const d1 = new Date(modalIn.value);
            const d2 = new Date(modalOut.value);
            let n = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
            if (isNaN(n) || n <= 0) n = 1;
            state.currentBooking.nights = n;
            state.currentBooking.checkIn = modalIn.value;
            state.currentBooking.checkOut = modalOut.value;
            state.currentBooking.totalSdg = state.currentBooking.priceSdg * n;

            document.getElementById('modalNightsDisplay').textContent = `${n} ليلة`;
            updateModalPrices();
        };
        modalIn.addEventListener('change', onDateChange);
        modalOut.addEventListener('change', onDateChange);
    }

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
            updateModalPrices();
        }
        if (stepNumber === 3) elements.step3.classList.add('active');
    }

    // الانتقال من تفاصيل النزيل إلى الدفع
    if (elements.btnToPayment) {
        elements.btnToPayment.addEventListener('click', () => {
            const name = document.getElementById('guestName').value.trim();
            const phone = document.getElementById('guestPhone').value.trim();
            const email = document.getElementById('guestEmail').value.trim();

            if (!name) {
                showToast('يرجى إدخال اسم النزيل بالكامل', 'warning');
                document.getElementById('guestName').focus();
                return;
            }
            if (!phone || phone.length < 8) {
                showToast('يرجى إدخال رقم هاتف صحيح', 'warning');
                document.getElementById('guestPhone').focus();
                return;
            }
            if (!email || !email.includes('@')) {
                showToast('يرجى إدخال بريد إلكتروني صحيح لتلقي رسالة التأكيد', 'warning');
                document.getElementById('guestEmail').focus();
                return;
            }

            state.currentBooking.guestName = name;
            state.currentBooking.guestPhone = phone;
            state.currentBooking.guestEmail = email;
            state.currentBooking.nationality = document.getElementById('guestNationality').value.trim() || 'سوداني';
            state.currentBooking.guestNationalId = document.getElementById('guestNationalId')?.value.trim() || '';
            state.currentBooking.guestPassport = document.getElementById('guestPassport')?.value.trim() || '';
            state.currentBooking.specialRequests = document.getElementById('guestNotes').value.trim();

            switchStep(2);
        });
    }

    if (elements.btnBackToDetails) {
        elements.btnBackToDetails.addEventListener('click', () => switchStep(1));
    }

    // تبويبات الدفع
    if (elements.tabBankak && elements.tabCard && elements.tabCash) {
        elements.tabBankak.addEventListener('click', () => {
            elements.tabBankak.classList.add('active');
            elements.tabCard.classList.remove('active');
            elements.tabCash.classList.remove('active');
            elements.viewBankak.style.display = 'block';
            elements.viewCard.style.display = 'none';
            elements.viewCash.style.display = 'none';
            state.currentBooking.paymentMethod = 'bankak';
            state.currentBooking.paymentMethodName = 'تطبيق بنكك (بنك الخرطوم)';
        });

        elements.tabCard.addEventListener('click', () => {
            elements.tabCard.classList.add('active');
            elements.tabBankak.classList.remove('active');
            elements.tabCash.classList.remove('active');
            elements.viewCard.style.display = 'block';
            elements.viewBankak.style.display = 'none';
            elements.viewCash.style.display = 'none';
            state.currentBooking.paymentMethod = 'card';
            state.currentBooking.paymentMethodName = 'بطاقة بنكية / فيزا وماستركارد';
        });

        elements.tabCash.addEventListener('click', () => {
            elements.tabCash.classList.add('active');
            elements.tabBankak.classList.remove('active');
            elements.tabCard.classList.remove('active');
            elements.viewCash.style.display = 'block';
            elements.viewBankak.style.display = 'none';
            elements.viewCard.style.display = 'none';
            state.currentBooking.paymentMethod = 'pay_at_hotel';
            state.currentBooking.paymentMethodName = 'سداد عند الوصول بالفندق';
        });
    }

    // ========================================================
    // تأكيد الحجز وإنشاء رسالة البريد الإلكتروني
    // ========================================================
    let latestEmailObj = null;

    if (elements.btnConfirmPayment) {
        elements.btnConfirmPayment.addEventListener('click', async () => {
            const originalText = elements.btnConfirmPayment.innerHTML;
            elements.btnConfirmPayment.disabled = true;
            elements.btnConfirmPayment.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري تأكيد الحجز وإرسال البريد...`;

            await new Promise(r => setTimeout(r, 1000));

            const cur = state.currentBooking.currency || CoralDB.getCurrency();
            const convertedTotal = CoralDB.convertPrice(state.currentBooking.totalSdg, cur);

            const payload = {
                branch_id: state.currentBooking.branch.id,
                branch_name: state.currentBooking.branch.name_ar,
                branch_state: state.currentBooking.branch.state,
                room_id: state.currentBooking.room.id,
                room_title: state.currentBooking.room.title_ar,
                room_image: state.currentBooking.room.image,
                guest_name: state.currentBooking.guestName,
                guest_phone: state.currentBooking.guestPhone,
                guest_email: state.currentBooking.guestEmail,
                residency_type: state.currentBooking.residencyType,
                guest_national_id: state.currentBooking.guestNationalId,
                guest_passport: state.currentBooking.guestPassport,
                nationality: state.currentBooking.nationality,
                check_in: state.currentBooking.checkIn,
                check_out: state.currentBooking.checkOut,
                total_nights: state.currentBooking.nights,
                currency: cur,
                total_price: convertedTotal,
                payment_method: state.currentBooking.paymentMethod,
                payment_method_name: state.currentBooking.paymentMethodName,
                special_requests: state.currentBooking.specialRequests
            };

            const result = await CoralDB.createBooking(payload);

            elements.btnConfirmPayment.disabled = false;
            elements.btnConfirmPayment.innerHTML = originalText;

            if (result.success) {
                const b = result.booking;
                latestEmailObj = result.email;

                document.getElementById('voucherRefCode').textContent = b.booking_ref;
                document.getElementById('emailSentNoticeText').innerHTML = `
                    تم إرسال رسالة التأكيد الرسمية بنجاح إلى: <strong>${b.guest_email}</strong> متضمنة كود الحجز <b>${b.booking_ref}</b> وتفاصيل إقامتكم بفندق كورال.
                `;

                switchStep(3);
                showToast(`🎉 تم تأكيد حجزك بنجاح! رقم الحجز: ${b.booking_ref}`, 'success');
            }
        });
    }

    // فتح نافذة البريد الإلكتروني المستلم (Email Inbox Simulator)
    if (elements.btnViewEmailInbox) {
        elements.btnViewEmailInbox.addEventListener('click', () => {
            if (!latestEmailObj && state.currentBooking) {
                latestEmailObj = CoralDB.generateConfirmationEmail({
                    booking_ref: document.getElementById('voucherRefCode').textContent,
                    guest_name: state.currentBooking.guestName,
                    guest_email: state.currentBooking.guestEmail,
                    branch_name: state.currentBooking.branch.name_ar,
                    branch_state: state.currentBooking.branch.state,
                    room_title: state.currentBooking.room.title_ar,
                    check_in: state.currentBooking.checkIn,
                    check_out: state.currentBooking.checkOut,
                    total_nights: state.currentBooking.nights,
                    currency: state.currentBooking.currency,
                    total_price: state.currentBooking.totalPrice || 0,
                    payment_method_name: state.currentBooking.paymentMethodName,
                    residency_name: state.currentBooking.residencyType === 'foreign' ? 'إقامة أجنبية' : 'مواطن سوداني',
                    nationality: state.currentBooking.nationality
                });
            }

            if (latestEmailObj && elements.emailInboxContent) {
                elements.emailInboxContent.innerHTML = `
                    <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; font-size: 0.88rem;">
                        <div><strong>الموضوع (Subject):</strong> ${latestEmailObj.subject}</div>
                        <div style="color: #64748b; margin-top: 4px;"><strong>من:</strong> Coral Hotels Sudan &lt;reservations@coralhotels-sd.com&gt;</div>
                        <div style="color: #64748b; margin-top: 2px;"><strong>إلى:</strong> ${latestEmailObj.recipient_name} &lt;${latestEmailObj.recipient_email}&gt;</div>
                    </div>
                    ${latestEmailObj.html}
                `;
                elements.emailModal.style.display = 'flex';
            }
        });
    }

    if (elements.closeEmailModalBtn) {
        elements.closeEmailModalBtn.addEventListener('click', () => {
            elements.emailModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === elements.emailModal) elements.emailModal.style.display = 'none';
        if (e.target === elements.bookingModal) closeModal();
    });

    if (elements.btnPrintVoucher) {
        elements.btnPrintVoucher.addEventListener('click', () => window.print());
    }

    function openModal() {
        elements.bookingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        elements.bookingModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    if (elements.closeModalBtn) elements.closeModalBtn.addEventListener('click', closeModal);

    function showToast(message, type = 'info') {
        if (!elements.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--accent-gold); font-size: 1.2rem;"></i><span>${message}</span>`;
        elements.toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
});
