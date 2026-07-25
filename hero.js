// Shahab Mobile - Hero Section & Promotions Configuration
// Is file mein changes kar k aap website ka banner/promotion update kar saktay hain.
const heroConfig = {
    badge: "Trusted in Mansehra",
    brandName: "SHAHAB MOBILE",
    title: "Premium Devices. <br> Trusted Quality.",
    description: "Mansehra's leading destination for original Phones, Samsung, and top brands. Official warranty and easy installments on Shinkiari Road.",
    image: "/images/logo.png",
    primaryBtn: { text: "Explore Collection", link: "#product-grid" },
    secondaryBtn: { text: "Latest Offers", link: "offers.html" }, 
    installmentBtn: { text: "Easy Installments", link: "installments.html" },
    calculatorBtn: { text: "Installment Calculator", link: "calculator.html" }, // Calculator button
    watermark: "SHAHAB" // Background mein bara text jo nazar ata hai
};

function renderHero() {
    const container = document.getElementById('hero-container');
    if (!container) return;

    container.innerHTML = `
        <div class="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 rounded-[3rem] p-8 md:p-20 text-white relative overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col md:flex-row items-center gap-16 border border-white/5">
            <div class="relative z-10 flex-1 text-center md:text-left">
                <div class="flex items-center justify-center md:justify-start gap-3 mb-8">
                    <div class="w-12 h-[1px] bg-indigo-500/50 hidden md:block"></div>
                    <span class="text-indigo-400 text-xs font-black uppercase tracking-[0.5em] drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">${heroConfig.brandName}</span>
                </div>
                <h2 class="text-5xl md:text-6xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tight">
                    Premium <br>
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-300">${heroConfig.brandName}</span>
                </h2>
                <p class="text-slate-400 text-lg md:text-xl mb-10 max-w-xl leading-relaxed mx-auto md:mx-0 font-medium">
                    ${heroConfig.description}
                </p>
                <div class="flex flex-wrap justify-center md:justify-start gap-5">
                    <a href="${heroConfig.primaryBtn.link}" class="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-indigo-500 transition shadow-2xl shadow-indigo-500/20 hover:-translate-y-1 duration-300">
                        ${heroConfig.primaryBtn.text}
                    </a>
                    <a href="${heroConfig.secondaryBtn.link}" class="bg-white/5 border border-white/10 px-10 py-5 rounded-2xl font-bold hover:bg-white/10 transition duration-300 backdrop-blur-md flex items-center gap-3">
                        ${heroConfig.secondaryBtn.text} <i class="fas fa-arrow-right text-xs text-indigo-400"></i>
                    </a>
                    <a href="${heroConfig.installmentBtn.link}" class="bg-green-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-green-500 transition shadow-2xl shadow-green-500/20 hover:-translate-y-1 duration-300 flex items-center gap-3">
                        <i class="fas fa-hand-holding-usd"></i> ${heroConfig.installmentBtn.text}
                    </a>
                    <a href="${heroConfig.calculatorBtn.link}" class="bg-yellow-500 text-slate-900 px-10 py-5 rounded-2xl font-bold hover:bg-yellow-400 transition shadow-2xl shadow-yellow-500/20 hover:-translate-y-1 duration-300 flex items-center gap-3">
                        <i class="fas fa-calculator"></i> ${heroConfig.calculatorBtn.text}
                    </a>
                </div>
            </div>
            
            <div class="relative z-10 flex-1 flex justify-center items-center mt-12 md:mt-0">
                <div class="relative group">
                    <div class="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <img src="${heroConfig.image}" alt="Shahab Mobile Featured" class="relative z-20 w-full max-w-lg h-auto rounded-[3rem] shadow-2xl animate-float-3d border border-white/10" fetchpriority="high">
                </div>
            </div>

            <div class="absolute right-[-10%] bottom-[-10%] opacity-[0.03] text-[20rem] font-black select-none pointer-events-none uppercase tracking-tighter italic whitespace-nowrap">
                ${heroConfig.watermark}
            </div>
        </div>
    `;
}

// Initialize hero section
// renderHero ab HTML file se direct call hoga.