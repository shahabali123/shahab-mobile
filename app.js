// State Management
let cart = JSON.parse(localStorage.getItem('shahab_cart')) || [];
let compareList = JSON.parse(localStorage.getItem('shahab_compare')) || [];
let currentPage = 1;
let lightboxImages = [];
let lightboxIndex = 0;
let currentLightboxProduct = null; // To store product for lightbox details
const itemsPerPage = 8;

// Helper function for haptic feedback (Vibration)
function triggerVibration(duration = 20) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duration);
    }
}

// Helper function to hide the global loading screen
function hideLoadingScreen() {
    const loader = document.getElementById('loading-screen');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    updateCompareUI();
    initScrollReveal();
    
    // Only render grid if we are on index/offers/installments (main product listing pages)
    if (document.getElementById('product-grid')) {
        renderProducts(true, false);
        hideLoadingScreen();
    } else if (document.getElementById('product-page-content')) {
        initProductPage();
        hideLoadingScreen();
    }

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.group')) {
            document.getElementById('search-suggestions')?.classList.add('hidden');
        }
    });

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registered: ', registration.scope);
                    
                    // Update detection logic
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    // Nayi update mil gayi, page reload karo
                                    console.log('New content available, reloading...');
                                    window.location.reload();
                                }
                            }
                        };
                    };
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

    // Keyboard support for Lightbox
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox-modal');
        if (lightbox && !lightbox.classList.contains('hidden')) {
            if (e.key === 'ArrowRight') changeLightboxImage(1);
            if (e.key === 'ArrowLeft') changeLightboxImage(-1);
            if (e.key === 'Escape') closeLightbox();
        }
    });
});

/**
 * Generates the HTML for a single product card.
 * @param {object} product - The product object.
 * @param {boolean} isInstallmentsPage - True if rendering for the installments page.
 * @returns {string} The HTML string for the product card.
 */
function createProductCardHtml(product, isInstallmentsPage = false) {
        // Check if we are on the installments page to change the primary button
        const mainBtnHtml = isInstallmentsPage 
            ? `<button onclick="event.stopPropagation(); inquireInstallment(${product.id})" class="flex-grow bg-slate-900 text-white py-3 rounded-xl font-bold text-[10px] hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-1"><i class="fas fa-hand-holding-usd text-blue-400"></i> Inquire Plan</button>`
            : `<button onclick="event.stopPropagation(); addToCart(${product.id})" class="flex-grow bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-100">Add to Cart</button>`;

        return `
        <div class="product-card reveal-item bg-white rounded-3xl p-5 border border-slate-100 group relative perspective-1000"
             onmousemove="handle3DTilt(event, this)" onmouseleave="reset3DTilt(this)"
             onclick="window.location.href='product.html?id=${product.id}'">
            <div class="absolute top-4 left-4 flex flex-col gap-2 z-10">
                ${product.badge ? `<span class="${product.badge.color} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">${product.badge.text}</span>` : ''}
                ${product.freeDelivery ? '<span class="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-green-100">FREE DELIVERY</span>' : ''}
                ${product.installment ? '<span class="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1"><i class="fas fa-calendar-alt text-[8px]"></i> Installment</span>' : ''}
                ${product.installmentText ? `<span class="bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">${product.installmentText}</span>` : ''}
            </div>
            <div class="aspect-square bg-slate-50 rounded-2xl mb-5 flex items-center justify-center overflow-hidden loading-image-container">
                <div class="image-loader"><i class="fas fa-spinner fa-spin"></i><span>Loading...</span></div>
                <img src="${product.images[0]}" class="w-4/5 h-4/5 object-contain group-hover:scale-110 transition duration-500" onload="this.parentElement.classList.add('loaded');">
            </div>
            <p class="text-blue-600 font-bold text-[10px] tracking-widest uppercase mb-1">${product.brand}</p>
            <h3 class="font-bold text-slate-800 mb-2 truncate cursor-pointer hover:text-blue-600" title="${product.name}" onclick="window.location.href='product.html?id=${product.id}'">${product.name}</h3>
            <div class="flex justify-between items-center mb-4">
                <p class="text-xl font-extrabold text-slate-900">Rs. ${product.price.toLocaleString()}</p>
            </div>
            <div class="flex gap-2 relative z-20">
                ${mainBtnHtml}
                <button onclick="event.stopPropagation(); toggleCompare(${product.id})" class="w-12 h-12 flex items-center justify-center rounded-xl border-2 ${compareList.includes(product.id) ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 text-slate-400 hover:border-blue-600 hover:text-blue-600'} transition">
                    <i class="fas fa-balance-scale"></i>
                </button>
            </div>
        </div>
    `;
}

// Render Products
function renderProducts(resetPage = false, shouldScroll = false) {
    if (resetPage) currentPage = 1;

    const grid = document.getElementById('product-grid');
    if (!grid) return;

    let filtered = [...products];
    
    // Apply Navbar Search Filter
    const searchInp = document.getElementById('searchBar') || document.getElementById('searchBarMobile');
    const query = searchInp?.value.toLowerCase();
    if (query) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(query) || 
            p.brand.toLowerCase().includes(query)
        );
    }

    // Apply Brand Filter
    const brand = document.getElementById('brandFilter')?.value || 'All';
    if (brand !== 'All') filtered = filtered.filter(p => p.brand === brand);

    // Apply Installment Filter
    const installmentOnly = document.getElementById('installmentFilter')?.checked;
    if (installmentOnly) filtered = filtered.filter(p => p.installment === true);

    // Apply Price Range Filter
    const minPrice = parseInt(document.getElementById('minPrice')?.value) || 0;
    const maxPrice = parseInt(document.getElementById('maxPrice')?.value) || Infinity;
    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);

    // Apply Offers Filter (if on offers page)
    if (window.filterOnlyOffers) {
        filtered = filtered.filter(p => p.freeDelivery === true);
    }

    // Apply Global Installment Page Filter
    if (window.filterOnlyInstallments) {
        filtered = filtered.filter(p => p.installment === true);
    }

    // Apply Sorting
    const sortVal = document.getElementById('sortFilter')?.value;
    if (sortVal === 'low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'high') {
        filtered.sort((a, b) => b.price - a.price);
    }

    // Empty State Check
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-20 text-center animate-in fade-in duration-500">
                <div class="bg-white rounded-[3rem] p-12 border border-slate-100 inline-block shadow-sm max-w-lg">
                    <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-search text-4xl text-slate-300"></i>
                    </div>
                    <h3 class="text-2xl font-extrabold text-slate-800 mb-4">Koi device nahi mili!</h3>
                    <p class="text-slate-500 leading-relaxed">
                        Aap ki selected range, company ya search filter mein filhal koi product available nahi hai. <br>
                        <span class="font-bold text-blue-600 cursor-pointer hover:underline" onclick="resetFilters()">Filters reset karein</span> ya search badal kar dekhein.
                    </p>
                </div>
            </div>
        `;
        const pagination = document.getElementById('pagination-controls');
        if (pagination) pagination.innerHTML = '';
        return;
    }

    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    grid.innerHTML = paginated.map(product => createProductCardHtml(product, window.filterOnlyInstallments)).join('');

    renderPagination(filtered.length);
    observeElements();

    // Scroll to product grid if requested
    if (shouldScroll) {
        const productGrid = document.getElementById('product-grid');
        if (productGrid) {
            productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

// Helper to sync mobile and desktop search without automatic rendering
function syncSearch(val) {
    const dSearch = document.getElementById('searchBar');
    const mSearch = document.getElementById('searchBarMobile');
    if (dSearch) dSearch.value = val;
    if (mSearch) mSearch.value = val;
}

function toggleFilters() {
    const dropdown = document.getElementById('filters-dropdown');
    dropdown?.classList.toggle('hidden');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('menu-overlay');
    if (!menu) return;
    
    const isOpening = menu.classList.contains('translate-x-[120%]');
    
    menu.classList.toggle('translate-x-[120%]');
    overlay?.classList.toggle('hidden');
    
    triggerVibration(25); // Vibrate on menu toggle

    // Fix: If opening, lock scroll. If closing, restore it.
    document.body.style.overflow = isOpening ? 'hidden' : 'auto';
}

function resetFilters() {
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.querySelectorAll('input[type="number"], input[type="text"]').forEach(i => i.value = '');
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    renderProducts(true, true);
}

// Comparison Logic
function toggleCompare(id) {
    triggerVibration(30); // Vibrate on compare button click

    const index = compareList.indexOf(id);
    if (index > -1) {
        compareList.splice(index, 1);
        showToast("Removed from comparison", "compare");
    } else {
        if (compareList.length >= 2) {
            showToast("You can only compare 2 products at a time!", "error");
            return;
        }
        compareList.push(id);
        showToast("Added to comparison", "compare");
    }
    localStorage.setItem('shahab_compare', JSON.stringify(compareList));
    updateCompareUI();
    renderProducts(false, false);
}

function updateCompareUI() {
    const btn = document.getElementById('floating-compare-btn');
    const count = document.getElementById('compare-count');
    if (!btn || !count) return;

    if (compareList.length > 0) {
        btn.classList.remove('hidden');
        count.innerText = compareList.length;
    } else {
        btn.classList.add('hidden');
    }
}

function openCompareModal() {
    if (compareList.length < 2) {
        showToast("Please select 2 products to compare");
        return;
    }
    const p1 = products.find(p => p.id === compareList[0]);
    const p2 = products.find(p => p.id === compareList[1]);
    
    const content = document.getElementById('compare-content');
    const createSlot = (p) => `
        <div class="bg-slate-50 p-3 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 flex flex-col items-center text-center">
            <img src="${p.images[0]}" class="w-20 h-20 md:w-32 md:h-32 object-contain mb-3 md:mb-4 rounded-xl">
            <h4 class="font-bold text-xs md:text-lg mb-1 md:mb-2 text-slate-800 line-clamp-2 min-h-[2.5rem]">${p.name}</h4>
            <p class="text-sm md:text-2xl font-black text-blue-600 mb-4 md:mb-6">Rs. ${p.price.toLocaleString()}</p>
            <div class="w-full space-y-2 md:space-y-3">
                <div class="bg-white p-2 md:p-3 rounded-lg md:rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center md:items-start gap-1"><span class="text-slate-400 text-[8px] md:text-xs font-bold">RAM</span> <span class="font-bold text-[10px] md:text-sm">${p.specs.ram}</span></div>
                <div class="bg-white p-2 md:p-3 rounded-lg md:rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center md:items-start gap-1"><span class="text-slate-400 text-[8px] md:text-xs font-bold">STORAGE</span> <span class="font-bold text-[10px] md:text-sm">${p.specs.storage}</span></div>
                <div class="bg-white p-2 md:p-3 rounded-lg md:rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-center md:items-start gap-1"><span class="text-slate-400 text-[8px] md:text-xs font-bold">BATTERY</span> <span class="font-bold text-[10px] md:text-sm">${p.specs.battery}</span></div>
            </div>
        </div>
    `;
    
    content.innerHTML = createSlot(p1) + createSlot(p2);
    document.getElementById('compare-modal').classList.remove('hidden');
}

function closeCompareModal() {
    document.getElementById('compare-modal').classList.add('hidden');
}

function clearCompareList() {
    compareList = [];
    localStorage.setItem('shahab_compare', JSON.stringify(compareList));
    updateCompareUI();
    renderProducts(false, false);
    closeCompareModal();
}

// Cart Logic
function addToCart(id) {
    triggerVibration(40); // Slightly stronger vibration for adding to cart

    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({...product, quantity: 1});
    }
    localStorage.setItem('shahab_cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`Added ${product.name} to cart`, "cart");
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(el => el.innerText = count);
    renderCart();
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    sidebar.classList.toggle('translate-x-full');
}

function renderCart() {
    const itemsContainer = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!itemsContainer) return;

    let total = 0;
    itemsContainer.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="flex gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <img src="${item.images[0]}" class="w-16 h-16 object-contain">
                <div class="flex-grow">
                    <h4 class="font-bold text-sm">${item.name}</h4>
                    <p class="text-blue-600 font-bold text-sm">Rs. ${item.price.toLocaleString()}</p>
                    <div class="flex items-center gap-3 mt-2">
                        <button onclick="changeQty(${item.id}, -1)" class="w-6 h-6 rounded-full bg-slate-100">-</button>
                        <span class="font-bold">${item.quantity}</span>
                        <button onclick="changeQty(${item.id}, 1)" class="w-6 h-6 rounded-full bg-slate-100">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    totalEl.innerText = total.toLocaleString();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    localStorage.setItem('shahab_cart', JSON.stringify(cart));
    updateCartCount();
}

function checkoutWhatsApp() {
    triggerVibration(30);

    if (cart.length === 0) return alert("Cart is empty");
    let text = "Hello Shahab Mobile, I want to order:\n\n";
    cart.forEach(item => text += `• ${item.name} x ${item.quantity} (Rs. ${(item.price * item.quantity).toLocaleString()})\n`);
    text += `\nTotal: Rs. ${document.getElementById('cart-total').innerText}`;
    window.open(`https://wa.me/923420475187?text=${encodeURIComponent(text)}`);
}

function inquireInstallment(id) {
    triggerVibration(30);

    const p = products.find(product => product.id === id);
    if (!p) return;

    const config = typeof installmentConfig !== 'undefined' ? installmentConfig : { advancePercentage: 20, plans: [] };
    const downPayment = Math.round(p.price * (config.advancePercentage / 100));
    const options = config.plans.map(pl => pl.months).join(', ') + " Months";
    
    const msg = `Asalam-o-Alaikum Shahab Mobile! Mujhay is product ki installments ki details chahiye:\n\nDevice: ${p.name}\nTotal Price: Rs. ${p.price.toLocaleString()}\nAdvance Payment (${config.advancePercentage}%): Rs. ${downPayment.toLocaleString()}\nPlan options: ${options}`;
    
    window.open(`https://wa.me/923420475187?text=${encodeURIComponent(msg)}`);
}

/**
 * Recalculates and updates the installment plan display in the modal.
 * @param {object} product - The product object.
 * @param {number} advancePercentage - The selected advance percentage.
 * @param {number} months - The selected number of months for the plan.
 */
function calculateInstallmentDetails(price, advancePercentage, months) {
    const config = typeof installmentConfig !== 'undefined' ? installmentConfig : { advanceOptions: [20], plans: [] };
    const selectedPlan = config.plans.find(p => p.months == months);
    if (!selectedPlan) return { emi: 0, total: 0 };

    // Markup is for the plan duration, not annual. e.g., 4.5% for 3 months.
    const planMarkupRate = selectedPlan.markup / 100; 

    const downPayment = Math.round(price * (advancePercentage / 100));
    const loanAmount = price - downPayment;
    const totalRepayable = loanAmount * (1 + planMarkupRate); // Markup is applied on the loan amount
    const emi = Math.round(totalRepayable / months);
    const totalCost = downPayment + (emi * months);

    return { emi, totalCost };
}

/**
 * Gets the applicable advance payment options based on product price.
 * @param {number} price - The price of the product.
 * @returns {number[]} An array of advance percentages.
 */
function getAdvanceOptionsForPrice(price) {
    if (price <= 40000) {
        return [20, 30, 50];
    } else if (price > 40000 && price <= 60000) {
        return [25, 35, 50];
    } else if (price > 60000 && price <= 80000) {
        return [30, 40, 50];
    } else if (price > 80000 && price <= 100000) {
        return [35, 40, 50];
    } else { // For prices over 100,000
        return [40, 50];
    }
}

// Search Logic
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    const suggestions = document.getElementById('search-suggestions');
    
    if (!query) {
        suggestions.classList.add('hidden');
        return;
    }

    const matched = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.brand.toLowerCase().includes(query)
    ).slice(0, 5);

    if (matched.length > 0) {
        suggestions.innerHTML = matched.map(p => `
            <div class="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50 last:border-0" onclick="window.location.href='product.html?id=${p.id}'">
                <img src="${p.images[0]}" class="w-12 h-12 object-contain rounded-lg">
                <div>
                    <p class="font-bold text-slate-800 text-sm">${p.name}</p>
                    <p class="text-blue-600 font-bold text-xs">Rs. ${p.price.toLocaleString()}</p>
                </div>
            </div>
        `).join('');
        suggestions.classList.remove('hidden');
    } else {
        suggestions.innerHTML = `<p class="p-4 text-slate-400 text-sm text-center">No devices found</p>`;
        suggestions.classList.remove('hidden');
    }
}

// Product Details Logic
function showDetails(id) {
    const p = products.find(product => product.id === id);
    if (!p) return;

    triggerVibration(20); // Subtle vibration for opening details

    lightboxImages = p.images;
    lightboxIndex = 0;
    currentLightboxProduct = p; // Store the product for the lightbox

    document.getElementById('modal-title').innerText = p.name;
    document.getElementById('modal-price').innerText = `Rs. ${p.price.toLocaleString()}`;
    document.getElementById('modal-desc').innerText = p.description;
    
    const brandBadge = document.getElementById('modal-brand-badge');
    brandBadge.innerHTML = `<span class="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">${p.brand}</span>`;

    // Main image with loader
    const mainImg = document.getElementById('modal-main-image');
    mainImg.innerHTML = `<img src="${p.images[0]}" class="w-4/5 h-4/5 object-contain cursor-zoom-in" onclick="openLightbox()">`;
    mainImg.classList.remove('loaded'); // Ensure loader is visible for new image

    // Thumbnails with loaders
    const thumbnails = document.getElementById('modal-thumbnails');
    thumbnails.innerHTML = p.images.map((img, idx) => `
        <div class="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-slate-100 flex-shrink-0 cursor-pointer overflow-hidden p-2 bg-white hover:border-blue-600 transition loading-image-container" onclick="updateMainImage(${idx})">
            <div class="image-loader"><i class="fas fa-spinner fa-spin"></i><span>Loading...</span></div>
            <img src="${img}" class="w-full h-full object-contain" onload="this.parentElement.classList.add('loaded');">
        </div>
    `).join('');

    const specs = document.getElementById('modal-specs');
    // Ensure modal-specs is cleared before adding new content
    specs.innerHTML = '';

    specs.innerHTML = `
        <div class="bg-slate-50 p-3 rounded-xl text-center"><p class="text-[10px] text-slate-400 font-bold uppercase mb-1">RAM</p><p class="text-sm font-bold text-slate-700">${p.specs.ram}</p></div>
        <div class="bg-slate-50 p-3 rounded-xl text-center"><p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Storage</p><p class="text-sm font-bold text-slate-700">${p.specs.storage}</p></div>
        <div class="bg-slate-50 p-3 rounded-xl text-center"><p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Battery</p><p class="text-sm font-bold text-slate-700">${p.specs.battery}</p></div>
    `;

    // Action Buttons
    const addBtn = document.getElementById('modal-add-btn');
    addBtn.onclick = () => { addToCart(p.id); closeDetails(); };

    // Installment Calculator & Button Logic
    const modalActions = addBtn.parentElement;
    const existingInstallBtn = document.getElementById('modal-installment-btn');
    const existingCalc = document.getElementById('modal-calc-box');
    const existingInstallmentText = document.getElementById('modal-installment-text');
    const existingAdvanceSelector = document.getElementById('modal-advance-selector');

    if (existingInstallmentText) existingInstallmentText.remove();
    if (existingInstallBtn) existingInstallBtn.remove();
    if (existingCalc) existingCalc.remove();

    if (p.installment) {
        // Global config from products.js
        if (p.installmentText) {
            const installmentTextEl = document.createElement('p');
            installmentTextEl.id = 'modal-installment-text';
            installmentTextEl.className = "text-blue-600 font-bold text-sm mb-4";
            installmentTextEl.innerText = p.installmentText;
        }
        
        const config = typeof installmentConfig !== 'undefined' ? installmentConfig : { advanceOptions: [20], plans: [] };
        const advanceOptions = getAdvanceOptionsForPrice(p.price);
        
        const calcBox = document.createElement('div');
        calcBox.id = 'modal-calc-box';
        calcBox.className = "mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 text-sm";
        calcBox.innerHTML = `
            <p class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Installment Plans</p>
            <div class="overflow-x-auto rounded-lg">
                <table class="w-full text-center min-w-[550px]">
                    <thead class="bg-white">
                    <tr>
                        <th class="p-3 rounded-l-lg font-bold text-slate-600 text-xs">Advance</th>
                        ${config.plans.map(plan => `<th class="p-3 font-bold text-slate-600 text-xs">${plan.months} Months Plan</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${advanceOptions.map(advPercent => {
                        const downPayment = Math.round(p.price * (advPercent / 100));
                        return `
                            <tr class="border-t border-slate-200">
                                <td class="p-2 font-bold text-slate-800">
                                    ${advPercent}%
                                    <span class="block text-xs text-slate-500 font-normal">Rs. ${downPayment.toLocaleString()}</span>
                                </td>
                                ${config.plans.map(plan => {
                                                const { emi } = calculateInstallmentDetails(p.price, advPercent, plan.months);
                                                const totalInstallments = emi * plan.months;
                                    return `<td class="p-2 font-bold text-blue-600">
                                                    Rs. ${emi.toLocaleString()}<span class="text-xs font-normal">/mo</span>
                                                    <span class="block text-[10px] text-slate-400 font-normal">Total Installments: ${totalInstallments.toLocaleString()}</span>
                                            </td>`;
                                }).join('')}
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                </table>
            </div>
        `;

        modalActions.insertBefore(calcBox, addBtn);

        const instBtn = document.createElement('button');
        instBtn.id = 'modal-installment-btn';
        instBtn.className = "w-full mt-3 bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-200 transition flex items-center justify-center gap-2 border border-slate-200";
        instBtn.innerHTML = `<i class="fas fa-hand-holding-usd text-blue-600"></i> Inquire Installment Plan`;
        instBtn.onclick = () => {
            const planDurations = config.plans.map(pl => pl.months).join(', ') + " Months";
            let msg = `Asalam-o-Alaikum Shahab Mobile! Mujhay is product ki installments ki details chahiye:\n\n*Device:* ${p.name}\n*Total Price:* Rs. ${p.price.toLocaleString()}\n\nAvailable plans are ${planDurations}. Please provide more details.`;
            window.open(`https://wa.me/923420475187?text=${encodeURIComponent(msg)}`);
        };
        modalActions.appendChild(instBtn);
    }

    document.getElementById('product-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.getElementById('search-suggestions')?.classList.add('hidden');
}

// Single Product Page Logic
function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const container = document.getElementById('product-page-content');
    
    if (!container) return;
    
    const p = products.find(product => product.id === productId);
    
    if (!p) {
        container.innerHTML = `
            <div class="p-20 text-center">
                <h2 class="text-3xl font-bold mb-4">Product Not Found</h2>
                <a href="index.html" class="text-blue-600 font-bold">Return to Home</a>
            </div>
        `;
        return;
    }

    // Set up lightbox images for this product
    lightboxImages = p.images;
    lightboxIndex = 0;
    currentLightboxProduct = p; // Store the product for the lightbox

    // Update SEO Metadata
    document.title = `${p.name} - Rs. ${p.price.toLocaleString()} | Shahab Mobile`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', `Buy ${p.name} for Rs. ${p.price.toLocaleString()} at Shahab Mobile Mansehra. ${p.description}`);

    // Update Open Graph and Twitter Card meta tags for better sharing
    const productUrl = window.location.href;
    const imageUrl = window.location.origin + p.images[0].replace('./', '/');
    const shareTitle = `${p.name} - Rs. ${p.price.toLocaleString()}`;
    const shareDesc = `Official Warranty ✓ Easy Installments ✓ Click to see details for ${p.name} at Shahab Mobile.`;

    document.querySelector('meta[property="og:title"]')?.setAttribute('content', shareTitle);
    document.querySelector('meta[property="twitter:title"]')?.setAttribute('content', shareTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', shareDesc);
    document.querySelector('meta[property="twitter:description"]')?.setAttribute('content', shareDesc);
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', imageUrl);
    document.querySelector('meta[property="twitter:image"]')?.setAttribute('content', imageUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', productUrl);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', productUrl);


    // Dynamic Structured Data for SEO (Product Schema)
    const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": p.name,
        "image": [window.location.origin + p.images[0].replace('./', '/')],
        "description": p.description,
        "brand": {
            "@type": "Brand",
            "name": p.brand
        },
        "offers": {
            "@type": "Offer",
            "url": window.location.href,
            "priceCurrency": "PKR",
            "price": p.price,
            "availability": p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "itemCondition": "https://schema.org/NewCondition"
        }
    };

    // Remove old schema if exists and inject new one
    const existingSchema = document.getElementById('product-json-ld');
    if (existingSchema) existingSchema.remove();

    const script = document.createElement('script');
    script.id = 'product-json-ld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(productSchema);
    document.head.appendChild(script);

    // Render full page content
    const config = typeof installmentConfig !== 'undefined' ? installmentConfig : { advancePercentage: 20, plans: [] };
    const advanceOptionsForPage = getAdvanceOptionsForPrice(p.price);
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 w-full">
            <div class="bg-slate-50 p-8 md:p-12 flex flex-col gap-6 items-center">
                <div class="img-zoom-container w-full max-w-md relative loading-image-container">
                    <img id="product-page-main-image" src="${p.images[0]}" class="w-full aspect-square object-contain bg-white rounded-[3rem] shadow-inner border border-slate-100 p-8 cursor-zoom-in" onload="this.parentElement.classList.add('loaded'); initImageZoom('product-page-main-image', 'zoom-result');" alt="${p.name}" onclick="openLightbox()">
                </div>
                <div class="flex gap-4 overflow-x-auto w-full justify-center">
                    ${p.images.map((img, idx) => `
                        <div class="w-20 h-20 rounded-2xl bg-white border border-slate-100 p-2 flex-shrink-0 loading-image-container cursor-pointer hover:border-blue-500" onclick="updateProductPageImage(${idx})">
                            <div class="image-loader"><i class="fas fa-spinner fa-spin"></i><span>Loading...</span></div>
                            <img src="${img}" class="w-full h-full object-contain" onload="this.parentElement.classList.add('loaded');">
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
                <div id="zoom-result" class="img-zoom-result hidden lg:block"></div>
                <span class="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 w-fit">${p.brand}</span>
                <h2 class="text-4xl md:text-5xl font-black mb-4 text-slate-900">${p.name}</h2>
                <p class="text-3xl font-bold text-blue-600 mb-8">Rs. ${p.price.toLocaleString()}</p>
                
                <div class="grid grid-cols-3 gap-4 mb-8">
                    <div class="bg-slate-50 p-4 rounded-2xl text-center"><p class="text-[10px] text-slate-400 font-bold uppercase">RAM</p><p class="font-bold">${p.specs.ram}</p></div>
                    <div class="bg-slate-50 p-4 rounded-2xl text-center"><p class="text-[10px] text-slate-400 font-bold uppercase">Storage</p><p class="font-bold">${p.specs.storage}</p></div>
                    <div class="bg-slate-50 p-4 rounded-2xl text-center"><p class="text-[10px] text-slate-400 font-bold uppercase">Battery</p><p class="font-bold">${p.specs.battery}</p></div>
                </div>

                <p class="text-slate-600 leading-relaxed mb-10 text-lg">${p.description}</p>

                ${p.installment ? `
                    <div class="mb-8 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                        <h4 class="font-bold text-blue-900 mb-4 flex items-center gap-2"><i class="fas fa-calculator"></i> Installment Plans</h4>
                        <div class="overflow-x-auto rounded-xl shadow-sm bg-white">
                            <table class="w-full text-center min-w-[550px]">
                                <thead class="bg-blue-100">
                                <tr>
                                    <th class="p-3 font-bold text-blue-800 text-xs rounded-tl-xl">Advance</th>
                                    ${config.plans.map(plan => `<th class="p-3 font-bold text-blue-800 text-xs">${plan.months} Months</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${advanceOptionsForPage.map(advPercent => {
                                    const downPayment = Math.round(p.price * (advPercent / 100));
                                    return `
                                        <tr class="border-t border-blue-200">
                                            <td class="p-2 font-bold text-slate-800 text-sm">
                                                ${advPercent}%
                                                <span class="block text-xs text-slate-500 font-normal">Rs. ${downPayment.toLocaleString()}</span>
                                            </td>
                                            ${config.plans.map(plan => `
                                                <td class="p-2 font-bold text-blue-600 text-sm">
                                                    Rs. ${calculateInstallmentDetails(p.price, advPercent, plan.months).emi.toLocaleString()}<span class="text-xs font-normal">/mo</span>
                                                    <span class="block text-[10px] text-slate-400 font-normal">Total Installments: ${(calculateInstallmentDetails(p.price, advPercent, plan.months).emi * plan.months).toLocaleString()}</span>
                                                </td>`).join('')}
                                        </tr>`;
                                }).join('')}
                            </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}

                <div class="flex flex-col sm:flex-row gap-4">
                    <button onclick="addToCart(${p.id})" class="flex-grow bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-100">
                        <i class="fas fa-cart-plus mr-2"></i> Add to Cart
                    </button>
                    <button onclick="shareProduct(${p.id})" class="bg-slate-100 text-slate-600 px-8 py-5 rounded-2xl font-bold hover:bg-slate-200 transition">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Render Related Products
    const relatedProductsGrid = document.getElementById('related-products-grid');
    if (relatedProductsGrid) {
        const relatedProducts = products.filter(item => 
            item.id !== p.id && // Exclude the current product
            item.specs.ram === p.specs.ram && 
            item.specs.storage === p.specs.storage
        );

        // Shuffle and take up to 4 related products
        const shuffledRelated = relatedProducts.sort(() => 0.5 - Math.random()).slice(0, 4);

        if (shuffledRelated.length > 0) {
            relatedProductsGrid.innerHTML = shuffledRelated.map(relatedP => createProductCardHtml(relatedP)).join('');
        } else {
            relatedProductsGrid.innerHTML = `
                <div class="col-span-full text-center text-slate-500 py-8">
                    <p>No other related products found with similar RAM and Storage.</p>
                </div>
            `;
        }
    }

    // Ensure scroll reveal observes new elements
    initScrollReveal();
    observeElements();

    // Signal to Netlify's prerender service that the page is fully loaded and ready for snapshotting.
    window.prerenderReady = true;
}

/**
 * Updates the main image on the single product page when a thumbnail is clicked.
 * @param {number} index - The index of the image in the product's image array.
 */
function updateProductPageImage(index) {
    lightboxIndex = index;
    const mainImage = document.getElementById('product-page-main-image');
    if (!mainImage) return;

    const newImageSrc = lightboxImages[index];
    mainImage.parentElement.classList.remove('loaded');
    mainImage.src = newImageSrc;
    // Re-initialize zoom on new image load
    mainImage.onload = () => { 
        mainImage.parentElement.classList.add('loaded'); 
        initImageZoom('product-page-main-image', 'zoom-result'); 
    };
}

function shareProduct(productId) {
    const p = products.find(product => product.id == productId);
    if (!p) {
        showToast("Product not found for sharing.", "error");
        return;
    }

    const shareUrl = window.location.href; // Direct link to this specific product page
    const shareTitle = `${p.name} - Rs. ${p.price.toLocaleString()}`;
    const shareText = `Check out the ${p.name} at Shahab Mobile!`;

    if (navigator.share) {
        navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
        });
    } else {
        // Fallback for non-Web Share API browsers (e.g., desktop WhatsApp)
        window.open(`https://wa.me/?text=${encodeURIComponent(shareTitle + '\n' + shareUrl)}`, '_blank');
        showToast("WhatsApp share opened. Link copied to clipboard!", "info");
    }
}

function updateMainImage(index) {
    lightboxIndex = index;
    const mainImgContainer = document.getElementById('modal-main-image');
    if (!mainImgContainer) return;

    // Clear previous content and add loader
    mainImgContainer.innerHTML = `<img src="${lightboxImages[index]}" class="w-4/5 h-4/5 object-contain cursor-zoom-in" onclick="openLightbox()">`;
    mainImgContainer.classList.remove('loaded'); // Ensure loader is visible for new image

}

function initImageZoom(imgID, resultID) {
    let img, lens, result, cx, cy;
    img = document.getElementById(imgID);
    result = document.getElementById(resultID);
    if (!img || !result) return;

    // Remove existing lens if any
    let existingLens = document.querySelector(".img-zoom-lens");
    if (existingLens) existingLens.remove();

    /* Create lens: */
    lens = document.createElement("DIV");
    lens.setAttribute("class", "img-zoom-lens");
    /* Insert lens: */
    img.parentElement.insertBefore(lens, img);

    /* Calculate the ratio between result DIV and lens: */
    cx = result.offsetWidth / lens.offsetWidth;
    cy = result.offsetHeight / lens.offsetHeight;

    /* Set background properties for the result DIV: */
    result.style.backgroundImage = "url('" + img.src + "')";
    result.style.backgroundSize = (img.width * cx) + "px " + (img.height * cy) + "px";

    /* Execute a function when someone moves the cursor over the image, or the lens: */
    lens.addEventListener("mousemove", moveLens);
    img.addEventListener("mousemove", moveLens);
    /* And also for touch screens: */
    lens.addEventListener("touchmove", moveLens);
    img.addEventListener("touchmove", moveLens);

    img.parentElement.addEventListener("mouseenter", () => {
        lens.style.display = "block";
        result.style.display = "block";
    });
    img.parentElement.addEventListener("mouseleave", () => {
        lens.style.display = "none";
        result.style.display = "none";
    });

    function moveLens(e) {
        let pos, x, y;
        /* Prevent any other actions that may occur when moving over the image: */
        e.preventDefault();
        /* Get the cursor's x and y positions: */
        pos = getCursorPos(e);
        /* Calculate the position of the lens: */
        x = pos.x - (lens.offsetWidth / 2);
        y = pos.y - (lens.offsetHeight / 2);
        /* Prevent the lens from being positioned outside the image: */
        if (x > img.width - lens.offsetWidth) { x = img.width - lens.offsetWidth; }
        if (x < 0) { x = 0; }
        if (y > img.height - lens.offsetHeight) { y = img.height - lens.offsetHeight; }
        if (y < 0) { y = 0; }
        /* Set the position of the lens: */
        lens.style.left = x + "px";
        lens.style.top = y + "px";
        /* Display what the lens "sees": */
        result.style.backgroundPosition = "-" + (x * cx) + "px -" + (y * cy) + "px";
    }
    function getCursorPos(e) {
        let a, x = 0, y = 0;
        e = e || window.event;
        /* Get the x and y positions of the image: */
        a = img.getBoundingClientRect();
        /* Calculate the cursor's x and y coordinates, relative to the image: */
        x = (e.pageX || e.touches[0].pageX) - a.left - window.pageXOffset;
        y = (e.pageY || e.touches[0].pageY) - a.top - window.pageYOffset;
        return { x: x, y: y };
    }
}

function openLightbox() {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    if (!modal || !img) return;

    const lightboxContent = document.getElementById('lightbox-content');
    if (!lightboxContent) return;
    const lightboxDetails = document.getElementById('lightbox-details');

    img.src = lightboxImages[lightboxIndex];
    img.onload = () => { img.style.display = 'block'; };
    img.onerror = () => { img.style.display = 'block'; }; // Show broken image icon on error

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    updateLightboxUI();

    // Populate details if a product is associated
    if (currentLightboxProduct && lightboxDetails) {
        const p = currentLightboxProduct;
        lightboxDetails.innerHTML = `
            <span class="bg-white/10 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 w-fit">${p.brand}</span>
            <h2 class="text-4xl font-black mb-4">${p.name}</h2>
            <p class="text-3xl font-bold text-blue-400 mb-6">Rs. ${p.price.toLocaleString()}</p>
            <p class="text-slate-400 leading-relaxed line-clamp-4">${p.description}</p>
        `;
    }
}

function closeLightbox() {
    document.getElementById('lightbox-modal').classList.add('hidden');
    
    // Fix: If product details modal is STILL open, keep the body scroll locked.
    // Otherwise, restore scrolling.
    const detailsModal = document.getElementById('product-modal');
    if (detailsModal && !detailsModal.classList.contains('hidden')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

function changeLightboxImage(dir) {
    if (lightboxImages.length <= 1) return;
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;

    const img = document.getElementById('lightbox-img');
    const lightboxContent = document.getElementById('lightbox-content');

    if (!img || !lightboxContent) return;

    img.src = lightboxImages[lightboxIndex];
    img.onload = () => { img.style.display = 'block'; };
    img.onerror = () => { img.style.display = 'block'; }; // Show broken image icon on error

    updateLightboxUI();
}

function updateLightboxUI() {
    const prev = document.getElementById('lightbox-prev');
    const next = document.getElementById('lightbox-next');
    
    const showNav = lightboxImages.length > 1;
    if (prev) prev.style.display = showNav ? 'block' : 'none';
    if (next) next.style.display = showNav ? 'block' : 'none';
}

// Swipe Logic for Lightbox
let touchStartX = 0;
document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
}, {passive: true});

document.addEventListener('touchend', e => {
    const lightbox = document.getElementById('lightbox-modal');
    if (!lightbox || lightbox.classList.contains('hidden')) return;

    let touchEndX = e.changedTouches[0].clientX;
    if (touchStartX - touchEndX > 50) changeLightboxImage(1); // Left Swipe
    if (touchEndX - touchStartX > 50) changeLightboxImage(-1); // Right Swipe
}, {passive: true});

function closeDetails() {
    document.getElementById('product-modal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// 3D Scroll Reveal Logic
let revealObserver;
function initScrollReveal() {
    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
            }
        });
    }, { threshold: 0.1 });
}

function observeElements() {
    document.querySelectorAll('.reveal-item').forEach(el => revealObserver.observe(el));
}

// Interactive 3D Tilt Logic (Desktop Only)
function handle3DTilt(e, card) {
    if (window.innerWidth < 768) return; // Disable on mobile for performance
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    card.style.zIndex = "50";
}

function reset3DTilt(card) {
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    card.style.zIndex = "1";
}

// Toast System
function showToast(msg, type = "cart") {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-msg');
    const actionBtn = document.getElementById('toast-action');
    
    if (!toast || !msgEl || !actionBtn) return;

    msgEl.innerText = msg;
    toast.classList.remove('hidden');

    if (type === "cart") {
        actionBtn.innerText = "Go to Cart →";
        actionBtn.onclick = () => { toggleCart(); hideToast(); };
        actionBtn.classList.remove('hidden');
    } else if (type === "compare" && compareList.length === 2) {
        actionBtn.innerText = "Compare Now →";
        actionBtn.onclick = () => { openCompareModal(); hideToast(); };
        actionBtn.classList.remove('hidden');
    } else {
        actionBtn.classList.add('hidden');
    }

    setTimeout(hideToast, 4000);
}

function hideToast() {
    document.getElementById('toast').classList.add('hidden');
}

// Pagination Logic
function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.getElementById('pagination-controls');
    if (!container) return;

    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button onclick="currentPage=${i}; renderProducts(false, true);" class="w-10 h-10 rounded-xl font-bold transition ${currentPage === i ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-600 focus:border-blue-600'}">${i}</button>`;
    }
    container.innerHTML = html;
}