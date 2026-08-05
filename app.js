// State Management
let cart = JSON.parse(localStorage.getItem('shahab_cart')) || [];
let compareList = JSON.parse(localStorage.getItem('shahab_compare')) || [];
const HIDE_PRICES = true;
const PRICE_HIDDEN_MESSAGE = "Prices are being updated. Call for details.";
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

function initApp() {
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

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.group')) {
            document.getElementById('search-suggestions')?.classList.add('hidden');
        }
    });

    initScrollReveal();

    // Keyboard support for Lightbox
    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('lightbox-modal');
        if (lightbox && !lightbox.classList.contains('hidden')) {
            if (e.key === 'ArrowRight') changeLightboxImage(1);
            if (e.key === 'ArrowLeft') changeLightboxImage(-1);
            if (e.key === 'Escape') closeLightbox();
        }
    });

    updateCartCount(); // This also calls renderCart()

    // Start showing fake purchase popups after an initial delay
    setTimeout(() => {
        showFakePurchasePopup(); // Show one immediately
        // Show subsequent popups at random intervals between 20 and 45 seconds
        setInterval(showFakePurchasePopup, Math.random() * (45000 - 20000) + 20000);
    }, 15000); // Start after 15 seconds of page load
}

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
        
        const priceHtml = HIDE_PRICES
            ? `<p class="text-sm font-bold text-blue-600">${PRICE_HIDDEN_MESSAGE}</p>`
            : product.originalPrice
            ? `<div class="flex items-baseline gap-2"><p class="text-xl font-extrabold text-red-600">Rs. ${product.price.toLocaleString()}</p><p class="text-sm font-bold text-slate-400 line-through">Rs. ${product.originalPrice.toLocaleString()}</p></div>`
            : `<p class="text-xl font-extrabold text-slate-900">Rs. ${product.price.toLocaleString()}</p>`;

        return `
        <div class="product-card reveal-item bg-white rounded-3xl p-5 border border-slate-100 group relative perspective-1000"
             onmousemove="handle3DTilt(event, this)" onmouseleave="reset3DTilt(this)"
             onclick="savePageAndRedirect('${product.slug}')">
            <div class="absolute top-4 left-4 flex flex-col gap-2 z-10">
                ${product.badge ? `<span class="${product.badge.color} text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">${product.badge.text}</span>` : ''}
                ${product.discountPercentage ? `<span class="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1"><i class="fas fa-arrow-down"></i> ${product.discountPercentage}% OFF</span>` : ''}
                ${product.freeDelivery ? '<span class="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-green-100">FREE DELIVERY</span>' : ''}
                ${product.installment ? '<span class="bg-slate-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1"><i class="fas fa-calendar-alt text-[8px]"></i> Installment</span>' : ''}
                ${product.installmentText ? `<span class="bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">${product.installmentText}</span>` : ''}
                ${product.offerEndDate ? `
                    <div id="timer-${product.id}" class="flex items-center gap-1 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg bg-red-500/80 backdrop-blur-sm border border-white/20">
                        <i class="fas fa-stopwatch animate-pulse"></i>
                        <span class="countdown-text"></span>
                    </div>
                ` : ''}
            </div>
            <div class="aspect-square bg-slate-50 rounded-2xl mb-5 flex items-center justify-center overflow-hidden loading-image-container">
                <div class="image-loader"><i class="fas fa-spinner fa-spin"></i><span>Loading...</span></div>
                <img data-src="${product.images[0]}" class="w-4/5 h-4/5 object-contain group-hover:scale-110 transition duration-500 product-card-image">
                <div class="watermark-logo"></div>
            </div>
            <p class="text-blue-600 font-bold text-[10px] tracking-widest uppercase mb-1" onclick="event.stopPropagation(); savePageAndRedirect('${product.slug}')">${product.brand}</p>
            <h3 class="font-bold text-slate-800 mb-2 truncate cursor-pointer hover:text-blue-600" title="${product.name}" onclick="savePageAndRedirect('${product.slug}')">${product.name}</h3>
            <div class="flex justify-between items-center mb-4">
                ${priceHtml}
            </div>
            ${!HIDE_PRICES && product.originalPrice 
                ? `<div class="text-xs font-bold text-green-600 bg-green-50 p-2 rounded-lg mb-4 border border-green-100">You save Rs. ${(product.originalPrice - product.price).toLocaleString()}!</div>` 
                : ''}
            <div class="flex gap-2 relative z-20">
                ${mainBtnHtml}
                <button onclick="event.stopPropagation(); toggleCompare(${product.id})" class="w-12 h-12 flex items-center justify-center rounded-xl border-2 ${compareList.includes(product.id) ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-100 text-slate-400 hover:border-blue-600 hover:text-blue-600'} transition">
                    <i class="fas fa-balance-scale"></i>
                </button>
            </div>
        </div>
    `;
}

/**
 * Saves the current page to sessionStorage and redirects to the product page.
 * @param {string} productSlug - The slug of the product to redirect to.
 */
function savePageAndRedirect(productSlug) {
    // Save the current page number before navigating away
    sessionStorage.setItem('shahab_last_page', currentPage);
    window.location.href = `product.html?slug=${productSlug}`;
}

// Render Products
function renderProducts(resetPage = false, shouldScroll = false) {
    if (resetPage) currentPage = 1;

    const grid = document.getElementById('product-grid');
    if (!grid) return;

    // Reverse the array to show newest products first, as requested.
    let filtered = [...products].reverse();
    
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
        // Show only products that have a discount.
        filtered = filtered.filter(p => p.originalPrice);
    }

    // Apply Global Installment Page Filter
    if (window.filterOnlyInstallments) {
        filtered = filtered.filter(p => p.installment === true);
    }

    // Apply Gadgets Filter (if on gadgets page)
    if (window.filterOnlyGadgets) {
        filtered = filtered.filter(p => p.category === 'Gadget');
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

    // Initialize all countdown timers after rendering the grid
    paginated.forEach(product => {
        if (product.offerEndDate) {
            startCountdown(product.offerEndDate, `timer-${product.id}`, true);
        }
    });

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
            <p class="text-sm md:text-2xl font-black text-blue-600 mb-4 md:mb-6">
                ${HIDE_PRICES ? PRICE_HIDDEN_MESSAGE : `Rs. ${p.price.toLocaleString()}`}
            </p>
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
                    <p class="text-blue-600 font-bold text-sm">
                        ${HIDE_PRICES ? PRICE_HIDDEN_MESSAGE : `Rs. ${item.price.toLocaleString()}`}
                    </p>
                    <div class="flex items-center gap-3 mt-2">
                        <button onclick="changeQty(${item.id}, -1)" class="w-6 h-6 rounded-full bg-slate-100">-</button>
                        <span class="font-bold">${item.quantity}</span>
                        <button onclick="changeQty(${item.id}, 1)" class="w-6 h-6 rounded-full bg-slate-100">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('') || `<p class="text-center text-slate-500">Your cart is empty.</p>`;
    totalEl.innerText = HIDE_PRICES ? "N/A" : total.toLocaleString();
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
    if (!HIDE_PRICES) {
        text += `\nTotal: Rs. ${document.getElementById('cart-total').innerText}`;
    }
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
        p.brand.toLowerCase().includes(query) || p.slug.includes(query)
    ).slice(0, 5);

    if (matched.length > 0) {
        suggestions.innerHTML = matched.map(p => `
            <div class="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50 last:border-0" onclick="savePageAndRedirect('${p.slug}')">
                <img src="${p.images[0]}" class="w-12 h-12 object-contain rounded-lg">
                <div>
                    <p class="font-bold text-slate-800 text-sm">${p.name}</p> 
                    <p class="text-blue-600 font-bold text-xs">
                        ${HIDE_PRICES ? PRICE_HIDDEN_MESSAGE : `Rs. ${p.price.toLocaleString()}`}
                    </p>
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
    const p = products.find(product => product.id === id || product.slug === id);
    if (!p) return;

    triggerVibration(20); // Subtle vibration for opening details

    lightboxImages = p.images;
    lightboxIndex = 0;
    currentLightboxProduct = p; // Store the product for the lightbox

    document.getElementById('modal-title').innerText = p.name;
    document.getElementById('modal-price').innerText = HIDE_PRICES ? PRICE_HIDDEN_MESSAGE : `Rs. ${p.price.toLocaleString()}`;
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
    const productSlug = urlParams.get('slug');
    const container = document.getElementById('product-page-content');
    
    if (!container) return;
    
    const p = products.find(product => product.slug === productSlug);
    
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
    const priceText = HIDE_PRICES ? "Call for Price" : `Rs. ${p.price.toLocaleString()}`;
    const pageTitle = `${p.name} - ${priceText} | Shahab Mobile`;
    const pageDescription = `Buy ${p.name} for ${priceText} at Shahab Mobile Mansehra. ${p.description}`;
    const pageUrl = window.location.href;
    const imageUrl = new URL(p.images[0], window.location.origin).href;

    document.title = pageTitle;
    document.querySelector('meta[name="description"]').setAttribute('content', pageDescription);
    document.querySelector('meta[name="description"]')?.setAttribute('content', pageDescription);
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', pageUrl);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', pageTitle);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', pageDescription);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', pageUrl);
    document.querySelector('meta[property="og:image"]')?.setAttribute('content', imageUrl);


    // Dynamic Structured Data for SEO (Product Schema)
    const productSchema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": p.name,
        "image": [imageUrl],
        "description": p.description,
        "brand": {
            "@type": "Brand",
            "name": p.brand
        },
        "offers": {
            "@type": "Offer",
            "url": pageUrl,
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

    const priceHtmlOnPage = HIDE_PRICES
        ? `<p class="text-2xl font-bold text-blue-600 mb-8">${PRICE_HIDDEN_MESSAGE}</p>`
        : p.originalPrice
        ? `<div class="flex items-baseline gap-4 mb-4">
               <p class="text-4xl font-black text-red-600">Rs. ${p.price.toLocaleString()}</p>
               <p class="text-2xl font-bold text-slate-400 line-through">Rs. ${p.originalPrice.toLocaleString()}</p>
           </div>`
        : `<p class="text-3xl font-bold text-blue-600 mb-8">Rs. ${p.price.toLocaleString()}</p>`;

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 w-full">
            <div class="bg-slate-50 p-8 md:p-12 flex flex-col gap-6 items-center">
                <div class="w-full max-w-md relative loading-image-container" onclick="openLightbox('${p.slug}')">
                    <img id="product-page-main-image" src="${p.images[0]}" class="w-full aspect-square object-contain bg-white rounded-[3rem] shadow-inner border border-slate-100 p-8 cursor-pointer" onload="this.parentElement.classList.add('loaded');" alt="${p.name}">
                    <div class="watermark-logo"></div>
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
                <div class="flex flex-wrap items-center gap-3 mb-4">
                    <span class="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">${p.brand}</span>
                    ${p.discountPercentage ? `<span class="bg-red-100 text-red-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1"><i class="fas fa-arrow-down"></i> ${p.discountPercentage}% OFF</span>` : ''}
                </div>
                <h2 class="text-4xl md:text-5xl font-black mb-4 text-slate-900">${p.name}</h2>
                
                ${priceHtmlOnPage}
                ${!HIDE_PRICES && p.originalPrice 
                    ? `<div class="text-base font-bold text-green-700 bg-green-100 p-4 rounded-2xl mb-8 border border-green-200 w-fit">Congratulations! You save <span class="text-lg">Rs. ${(p.originalPrice - p.price).toLocaleString()}</span> on this deal!</div>` 
                    : ''}

                ${p.offerEndDate ? `
                    <div class="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between gap-4">
                        <h4 class="font-bold text-red-700 flex items-center gap-3"><i class="fas fa-stopwatch animate-pulse"></i> Offer Ends In:</h4>
                        <div id="product-page-timer" class="flex items-center gap-1 text-red-700 font-bold text-lg">
                            <!-- Timer will be injected here -->
                        </div>
                    </div>
                ` : ''}
                
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

    // Start countdown on product page if offer exists
    if (p.offerEndDate) {
        startCountdown(p.offerEndDate, 'product-page-timer', true);
    }

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
    };
}

function shareProduct(productId) {
    const p = products.find(product => product.id == productId);
    if (!p) {
        showToast("Product not found for sharing.", "error");
        return;
    }

    const shareUrl = window.location.href; // Direct link to this specific product page
    const shareTitle = `${p.name} - ${HIDE_PRICES ? "Price on request" : `Rs. ${p.price.toLocaleString()}`}`;

    if (navigator.share) {
        // Use Web Share API on mobile
        navigator.share({
            url: shareUrl
        });
    } else {
        // Fallback for desktop: Copy link to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast("Product link copied to clipboard!", "info");
        }).catch(err => {
            console.error('Failed to copy: ', err);
            // If clipboard fails, open WhatsApp as a last resort
            const whatsappText = `${shareTitle}\n${shareUrl}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
        });
    }
}

// Calculator Page Logic
function handleCalculatorSearch(e) {
    const query = e.target.value.toLowerCase();
    const suggestions = document.getElementById('calculator-suggestions');
    
    if (!query) {
        suggestions.classList.add('hidden');
        return;
    }

    // Filter only products available for installment
    const matched = products.filter(p => 
        p.installment && (p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
    ).slice(0, 5);

    if (matched.length > 0) {
        suggestions.innerHTML = matched.map(p => `
            <div class="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50 last:border-0" onclick="renderCalculatorDetails('${p.slug}')">
                <img src="${p.images[0]}" class="w-12 h-12 object-contain rounded-lg">
                <div>
                    <p class="font-bold text-slate-800 text-sm">${p.name}</p>
                    <p class="text-blue-600 font-bold text-xs">
                        ${HIDE_PRICES ? PRICE_HIDDEN_MESSAGE : `Rs. ${p.price.toLocaleString()}`}
                    </p>
                </div>
            </div>
        `).join('');
        suggestions.classList.remove('hidden');
    } else {
        suggestions.innerHTML = `<p class="p-4 text-slate-400 text-sm text-center">No installment products found</p>`;
        suggestions.classList.remove('hidden');
    }
}

function renderCalculatorForPrice(price, productName = "Custom Device") {
    const resultContainer = document.getElementById('calculator-result');
    const initialMsg = document.getElementById('calculator-initial-message');
    const suggestions = document.getElementById('calculator-suggestions');
    const searchInput = document.getElementById('calculator-search');

    if (!resultContainer || !initialMsg || !suggestions || !searchInput) return;

    if (!price || price <= 0) {
        showToast("Please enter a valid price.", "error");
        return;
    }

    // Hide initial message and suggestions, update search bar
    initialMsg.classList.add('hidden');
    suggestions.classList.add('hidden');
    searchInput.value = productName;

    const config = typeof installmentConfig !== 'undefined' ? installmentConfig : { plans: [] };
    const advanceOptions = getAdvanceOptionsForPrice(price);

    let html = `
        <!-- Selected Product -->
        <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-lg flex flex-col md:flex-row items-center gap-8 animate-in fade-in duration-500">
            <div class="w-32 h-32 rounded-2xl bg-slate-50 p-2 flex items-center justify-center">
                <i class="fas fa-mobile-alt text-6xl text-slate-300"></i>
            </div>
            <div class="flex-grow text-center md:text-left">
                <h2 class="text-3xl font-black text-slate-900 mt-1">${productName}</h2>
                <p class="text-2xl font-bold text-slate-700 mt-2">Total Price: <span class="text-blue-600">Rs. ${price.toLocaleString()}</span></p>
            </div>
        </div>
        <!-- The rest of the calculation table will be generated by renderCalculatorForPrice -->
    `;
    resultContainer.innerHTML = html + generateCalculatorTables(price);
}

function renderCalculatorDetails(productIdentifier) {
    const p = products.find(product => product.id === productIdentifier || product.slug === productIdentifier);
    if (!p) return;

    const resultContainer = document.getElementById('calculator-result');
    resultContainer.innerHTML = `
        <!-- Selected Product -->
        <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-lg flex flex-col md:flex-row items-center gap-8 animate-in fade-in duration-500">
            <img src="${p.images[0]}" alt="${p.name}" class="w-32 h-32 object-contain rounded-2xl bg-slate-50 p-2">
            <div class="flex-grow text-center md:text-left">
                <span class="text-blue-600 font-bold text-sm uppercase tracking-widest">${p.brand}</span>
                <h2 class="text-3xl font-black text-slate-900 mt-1">${p.name}</h2>
                <p class="text-2xl font-bold text-slate-700 mt-2">Total Price: <span class="text-blue-600">Rs. ${p.price.toLocaleString()}</span></p>
            </div>
        </div>

        ${generateCalculatorTables(p.price)}
    `;

    renderCalculatorForPrice(p.price, p.name);
}

function generateCalculatorTables(price) {
    const config = typeof installmentConfig !== 'undefined' ? installmentConfig : { plans: [] };
    const advanceOptions = getAdvanceOptionsForPrice(price);
    return `
        <div class="space-y-8">
            ${config.plans.map(plan => {
                return `
                <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-lg animate-in fade-in duration-700">
                    <h3 class="text-2xl font-extrabold text-slate-800 mb-6">${plan.months} Months Installment Plan</h3>
                    <div class="overflow-x-auto rounded-xl border border-slate-200">
                        <table class="w-full text-center min-w-[600px]">
                            <thead class="bg-slate-50">
                                <tr>
                                    <th class="p-4 font-bold text-slate-600 text-sm">Advance %</th>
                                    <th class="p-4 font-bold text-slate-600 text-sm">Advance Payment</th>
                                    <th class="p-4 font-bold text-blue-700 text-sm">Monthly Installment</th>
                                    <th class="p-4 font-bold text-slate-600 text-sm">Total Cost</th>
                                    <th class="p-4 font-bold text-red-600 text-sm">Extra Charges (Markup)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${advanceOptions.map(advPercent => {
                                    const downPayment = Math.round(price * (advPercent / 100));
                                    const { emi, totalCost } = calculateInstallmentDetails(price, advPercent, plan.months);
                                    const extraCharges = totalCost - price;

                                    return `
                                    <tr class="border-t border-slate-200">
                                        <td class="p-4 font-semibold text-slate-700">${advPercent}%</td>
                                        <td class="p-4 font-semibold text-slate-700">Rs. ${downPayment.toLocaleString()}</td>
                                        <td class="p-4 font-bold text-blue-600 text-lg">Rs. ${emi.toLocaleString()}<span class="text-sm font-normal">/mo</span></td>
                                        <td class="p-4 font-semibold text-slate-700">Rs. ${totalCost.toLocaleString()}</td>
                                        <td class="p-4 font-bold text-red-500">Rs. ${extraCharges.toLocaleString()}</td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    `;
}

function updateMainImage(index) {
    lightboxIndex = index;
    const mainImgContainer = document.getElementById('modal-main-image');
    if (!mainImgContainer) return;

    // Clear previous content and add loader
    mainImgContainer.innerHTML = `<img src="${lightboxImages[index]}" class="w-4/5 h-4/5 object-contain cursor-zoom-in" onclick="openLightbox()">`;
    mainImgContainer.classList.remove('loaded'); // Ensure loader is visible for new image

}

/**
 * Opens the lightbox to view product images in full-screen.
 * @param {number} [productId] - The ID of the product to display. If not provided, it uses the globally set product.
 * @param {string|number} [identifier] - The ID or slug of the product.
 */
function openLightbox(identifier) {
    if (identifier) {
        const p = products.find(product => product.id === identifier || product.slug === identifier);
        if (!p) return;
        currentLightboxProduct = p;
        lightboxImages = p.images;
        // lightboxIndex ko reset nahi karte takay thumbnail click k baad sahi image khulay.
    }

    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    if (!modal || !img || !currentLightboxProduct) return; // Ensure a product is set

    const lightboxContent = document.getElementById('lightbox-content');
    if (!lightboxContent) return;
    const lightboxDetails = document.getElementById('lightbox-details');
    const existingWatermark = lightboxContent.querySelector('.watermark-logo');

    img.src = lightboxImages[lightboxIndex];
    img.onload = () => { img.style.display = 'block'; };
    img.onerror = () => { img.style.display = 'block'; }; // Show broken image icon on error

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    updateLightboxUI();

    // Add watermark if it doesn't exist
    if (!existingWatermark) {
        const watermark = document.createElement('div');
        watermark.className = 'watermark-logo';
        lightboxContent.appendChild(watermark);
    }

    // Populate details if a product is associated
    if (currentLightboxProduct && lightboxDetails) {
        const p = currentLightboxProduct;
        lightboxDetails.innerHTML = `
            <span class="bg-white/10 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 w-fit">${p.brand}</span>
            <h2 class="text-4xl font-black mb-4">${p.name}</h2>
            <p class="text-3xl font-bold text-blue-400 mb-6">
                ${HIDE_PRICES ? PRICE_HIDDEN_MESSAGE : `Rs. ${p.price.toLocaleString()}`}
            </p>
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
                // Animate the card
                entry.target.classList.add('reveal-active');

                // Find the image inside and load it
                const img = entry.target.querySelector('.product-card-image');
                if (img && img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src'); // Load only once
                    img.onload = () => {
                        img.parentElement.classList.add('loaded');
                    };
                }
                // Stop observing once revealed
                revealObserver.unobserve(entry.target);
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

// Pagination change handler
function changePage(page) {
    if (page < 1) return;
    const totalPages = Math.ceil(products.length / itemsPerPage); // A rough estimate, will be recalculated in renderProducts
    if (page > totalPages && totalPages > 0) return; // Prevent going beyond a roughly estimated last page

    currentPage = page;
    renderProducts(false, true);
}

// Pagination Logic
function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.getElementById('pagination-controls');
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    const pageWindow = 1; // Pages to show around current page
    let pagesToShow = new Set();

    // Always show first and last page
    pagesToShow.add(1);
    pagesToShow.add(totalPages);

    // Show pages around current page
    for (let i = -pageWindow; i <= pageWindow; i++) {
        const page = currentPage + i;
        if (page > 1 && page < totalPages) {
            pagesToShow.add(page);
        }
    }
    // Also add current page if it's 1 or totalPages
    pagesToShow.add(currentPage);

    const sortedPages = [...pagesToShow].sort((a, b) => a - b);

    // Previous Button
    html += `<button onclick="changePage(${currentPage - 1})" class="px-6 h-12 md:px-4 md:h-10 rounded-xl font-bold transition bg-white border border-slate-200 text-slate-500 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>`;

    let lastPage = 0;
    sortedPages.forEach(page => {
        if (lastPage > 0 && page - lastPage > 1) {
            html += `<span class="w-10 h-10 hidden md:flex items-center justify-center text-slate-400">...</span>`;
        }
        html += `<button onclick="changePage(${page})" class="w-12 h-12 md:w-10 md:h-10 rounded-xl font-bold transition hidden md:flex items-center justify-center ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-blue-600'}">${page}</button>`;
        lastPage = page;
    });

    // Next Button
    html += `<button onclick="changePage(${currentPage + 1})" class="px-6 h-12 md:px-4 md:h-10 rounded-xl font-bold transition bg-white border border-slate-200 text-slate-500 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>`;

    container.innerHTML = html;
}

/**
 * Starts a countdown timer that updates an element.
 * @param {string} endTimeString - The ISO 8601 string for the end time.
 * @param {string} elementId - The ID of the element to update.
 * @param {boolean} isCompact - If true, shows a compact version (e.g., 2d 5h 30m).
 */
function startCountdown(endTimeString, elementId, isCompact = false) {
    const countdownElement = document.getElementById(elementId);
    if (!countdownElement) return;

    const endTime = new Date(endTimeString).getTime();

    const timerInterval = setInterval(() => {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            clearInterval(timerInterval);
            countdownElement.innerHTML = "Offer Expired!";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (isCompact) {
            const textEl = countdownElement.querySelector('.countdown-text');
            if (textEl) textEl.innerText = `${days}d ${hours}h ${minutes}m left`;
        } else {
            countdownElement.innerHTML = `
                <span class="bg-white/20 text-white font-black text-xl md:text-2xl p-2 rounded-lg w-16 text-center">${hours.toString().padStart(2, '0')}</span>
                <span class="text-white/50 text-2xl">:</span>
                <span class="bg-white/20 text-white font-black text-xl md:text-2xl p-2 rounded-lg w-16 text-center">${minutes.toString().padStart(2, '0')}</span>
                <span class="text-white/50 text-2xl">:</span>
                <span class="bg-white/20 text-white font-black text-xl md:text-2xl p-2 rounded-lg w-16 text-center">${seconds.toString().padStart(2, '0')}</span>`;
        }
    }, 1000);
}

/**
 * Renders a horizontal auto-scrolling slider for "Hot Selling" items.
 * @param {string} containerId - The ID of the container element for the slider.
 */
function renderHotSellingSlider(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const hotItems = products.filter(p => p.badge && p.badge.text === "Hot Selling");

    if (hotItems.length === 0) {
        container.innerHTML = `<p class="text-slate-500">No hot selling items at the moment.</p>`;
        return;
    }

    container.innerHTML = hotItems.map(p => `
        <div class="hot-selling-card bg-white rounded-3xl p-5 border border-slate-100 shadow-lg shadow-slate-100/50 cursor-pointer" onclick="savePageAndRedirect('${p.slug}')">
            <div class="aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden flex items-center justify-center relative loading-image-container">
                <div class="image-loader"><i class="fas fa-spinner fa-spin"></i><span>Loading...</span></div>
                <img src="${p.images[0]}" class="w-4/5 h-4/5 object-contain" onload="this.parentElement.classList.add('loaded')">
                <span class="absolute top-3 left-3 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">${p.badge.text}</span>
            </div>
            <h4 class="font-bold text-slate-800 truncate">${p.name}</h4>
            <p class="text-lg font-extrabold text-slate-900">
                ${HIDE_PRICES ? PRICE_HIDDEN_MESSAGE : `Rs. ${p.price.toLocaleString()}`}
            </p>
        </div>
    `).join('');

    // Auto-scroll logic
    let scrollInterval;

    const startScrolling = () => {
        scrollInterval = setInterval(() => {
            if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 1) {
                // If at the end, scroll back to the beginning smoothly
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                // Scroll by one card width
                container.scrollBy({ left: 280 + 16, behavior: 'smooth' }); // card width + gap
            }
        }, 3000); // Change slide every 3 seconds
    };

    const stopScrolling = () => {
        clearInterval(scrollInterval);
    };

    container.addEventListener('mouseenter', stopScrolling);
    container.addEventListener('mouseleave', startScrolling);
    container.addEventListener('touchstart', stopScrolling, { passive: true });
    container.addEventListener('touchend', startScrolling, { passive: true });


    startScrolling();
}

// =================================================================================
// Purchase Guide Logic
// =================================================================================

// Global variables for the guide to manage state
let guideRecommendedPhones = [];
let guideCurrentIndex = 0;

/**
 * Populates the brand filter dropdown on the guide page.
 */
function populateGuideBrandFilter() {
    const brandFilter = document.getElementById('guide-brand');
    if (!brandFilter) return;

    const brands = [...new Set(products.map(p => p.brand))];
    brands.sort();

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.innerText = brand;
        brandFilter.appendChild(option);
    });
}

/**
 * Finds and displays recommended phones based on user input from the guide page.
 */
function findRecommendedPhone() {
    const budgetInput = document.getElementById('guide-budget');
    const priority = document.getElementById('guide-priority')?.value;
    const brand = document.getElementById('guide-brand')?.value;
    const installmentsOnly = document.getElementById('guide-installments')?.checked;
    const resultsContainer = document.getElementById('guide-results');
    const initialMessage = document.getElementById('guide-initial-message');
    const showMoreContainer = document.getElementById('guide-show-more-container');

    if (!budgetInput || !resultsContainer || !initialMessage || !showMoreContainer) return;

    // Reset state for a new search
    guideRecommendedPhones = [];

    const budget = parseInt(budgetInput.value);

    if (!budget || budget <= 0) {
        showToast("Please enter a valid budget.", "error");
        return;
    }

    initialMessage.classList.add('hidden');
    showMoreContainer.classList.add('hidden'); // Hide "Show More" on new search
    resultsContainer.innerHTML = `<div class="col-span-full text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-blue-500"></i><p class="mt-2">Finding the best phones for you...</p></div>`;

    setTimeout(() => {
        let filtered = products.filter(p => p.price <= budget && p.category !== 'Gadget');

        if (brand !== 'Any') {
            filtered = filtered.filter(p => p.brand === brand);
        }

        if (installmentsOnly) {
            filtered = filtered.filter(p => p.installment === true);
        }

        // Apply scoring based on priority
        filtered.forEach(p => {
            p.score = 0;
            // Base score on how close it is to the budget without going over
            p.score += p.price / budget;

            if (priority === 'battery') {
                p.score += (parseInt(p.specs.battery) || 0) / 5000; // Normalize score
            }
            if (priority === 'gaming') {
                // Prioritize RAM. Assuming format "8GB" or "8+8GB"
                const ram = parseInt(p.specs.ram.split('+')[0]) || 0;
                p.score += ram / 8; // Normalize score
            }
            if (priority === 'value') {
                // Higher score for lower price
                p.score -= p.price / budget;
            }
            // For 'camera' and 'overall', price is a decent proxy for quality
        });

        // Sort by score, descending
        filtered.sort((a, b) => b.score - a.score);

        guideRecommendedPhones = filtered; // Store all filtered results
        guideCurrentIndex = 0; // Reset index

        const top3 = guideRecommendedPhones.slice(0, 3);
        guideCurrentIndex = top3.length;

        if (top3.length > 0) {
            resultsContainer.innerHTML = `
                <h3 class="col-span-full text-2xl font-extrabold text-slate-800 mb-4 text-center">Here are my top recommendations for you!</h3>
                ${top3.map(p => createProductCardHtml(p)).join('')}`;
            
            // Show "Show More" button if there are more results
            if (guideRecommendedPhones.length > guideCurrentIndex) {
                showMoreContainer.innerHTML = `<button onclick="showMoreRecommendedPhones()" class="bg-slate-800 text-white py-3 px-8 rounded-xl font-bold hover:bg-slate-700 transition shadow-lg">Show More Phones</button>`;
                showMoreContainer.classList.remove('hidden');
            }

        } else {
            resultsContainer.innerHTML = `<div class="col-span-full py-10 text-center"><h3 class="text-xl font-bold text-slate-700">Sorry, no phones found in your budget.</h3><p class="text-slate-500">Try increasing your budget or changing the brand.</p></div>`;
        }
        observeElements(); // Re-run scroll reveal for new cards
    }, 500); // Simulate "thinking"
}

/**
 * Shows the next batch of recommended phones.
 */
function showMoreRecommendedPhones() {
    const resultsContainer = document.getElementById('guide-results');
    const showMoreContainer = document.getElementById('guide-show-more-container');

    if (!resultsContainer || !showMoreContainer) return;

    const nextBatch = guideRecommendedPhones.slice(guideCurrentIndex, guideCurrentIndex + 3);
    
    if (nextBatch.length > 0) {
        resultsContainer.innerHTML += nextBatch.map(p => createProductCardHtml(p)).join('');
        guideCurrentIndex += nextBatch.length;
        observeElements(); // Observe new cards
    }

    // Hide the button if no more results are left
    if (guideCurrentIndex >= guideRecommendedPhones.length) {
        showMoreContainer.classList.add('hidden');
    }
}

// =================================================================================
// Social Proof Popups
// =================================================================================

const pakistaniNames = ["Ali", "Ahmed", "Fatima", "Ayesha", "Bilal", "Sana", "Usman", "Hina", "Faisal", "Sadia", "Imran", "Nida", "Zain", "Kiran", "Haris", "Maria", "Saad", "Rabia"];

function showFakePurchasePopup() {
    const popup = document.getElementById('purchase-popup');
    if (!popup) return;

    // Pick a random name
    const randomName = pakistaniNames[Math.floor(Math.random() * pakistaniNames.length)];

    // Pick a random, popular phone (not a gadget)
    const availablePhones = products.filter(p => p.category !== 'Gadget' && p.stock > 0 && p.price > 25000);
    if (availablePhones.length === 0) return;
    const randomProduct = availablePhones[Math.floor(Math.random() * availablePhones.length)];

    // Populate the popup
    popup.innerHTML = `
        <img src="${randomProduct.images[0]}" class="w-14 h-14 object-contain rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-sm">
        <div class="flex-grow">
            <p class="font-bold text-sm text-slate-800">${randomName} from Mansehra</p>
            <p class="text-xs text-slate-600 mt-0.5">just purchased a <span class="font-bold text-blue-600">${randomProduct.name}</span></p>
            <p class="text-[10px] text-slate-400 mt-1.5">a few moments ago</p>
        </div>
        <button onclick="this.parentElement.style.display='none'" class="absolute top-1 right-2 text-slate-400 hover:text-slate-600 text-lg">&times;</button>
    `;

    // Show the popup
    popup.classList.remove('hidden', 'translate-y-24', 'opacity-0');
    popup.style.display = 'flex';

    // Hide it after some time
    setTimeout(() => {
        popup.classList.add('translate-y-24', 'opacity-0');
        setTimeout(() => { popup.style.display = 'none'; }, 500); // Hide completely after transition
    }, 6000); // Keep on screen for 6 seconds
}