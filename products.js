// =================================================================================
// Installment Configuration
// =================================================================================
// Yahan par aap installment plans ki settings change kar saktay hain.
const installmentConfig = {
    // Banner section k liye text
    bannerDescription: "Itel, Infinix, aur Tecno ke latest mobiles ab asaan mahana qiston par available hain.",
    advanceText: "20% Advance Se Shuru",
    planSummary: "3, 6, aur 9 Mahine ke Plans",

    // Advance payment k options (percentages mein)
    advanceOptions: [20, 30, 50],

    // Mahinay (months) k hisab se plans aur unka TOTAL markup rate (plan ki muddat k liye)
    plans: [
        { months: 3, markup: 18 }, // 3 mahine k plan pe total 18% markup
        { months: 6, markup: 36 },   // 6 mahine k plan pe total 36% markup
        { months: 9, markup: 54 } // 9 mahine k plan pe total 54% markup
    ]
};

// Helper function to generate URL-friendly slugs
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/\+/g, '-plus') // '+' ko '-plus' se badal dein
        .replace(/\s+/g, '-')   // spaces ko '-' se badal dein
        .replace(/[()]/g, '');  // brackets hata dein
}

// =================================================================================
// Products List
// =================================================================================
const products = [
    // =================================================================================
    // Samsung
    // =================================================================================
    {
    id: 1001,
    name: "Infinix Hot 60 Pro (8GB-128GB)",
    brand: "Infinix",
    price: 77999,
    description: "Infinix Hot 60 Pro with 8GB RAM and 128GB storage.",
    images: ["https://images.priceoye.pk/infinix-hot-60-pro-pakistan-priceoye-38od9-500x500.webp"],
    specs: { ram: "8GB", storage: "128GB", battery: "5160 Mah" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1002,
    name: "Infinix Hot 70 Pro 5G (8GB-128GB)",
    brand: "Infinix",
    price: 89999,
    description: "Infinix Hot 70 Pro 5G with 8GB RAM and 128GB storage.",
    images: ["https://mymobile.pk/images/272-6a76e90cdf6b9-infinix-hot-70-pro-7.webp"],
    specs: { ram: "8GB", storage: "128GB", battery: "6000 Mah" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1003,
    name: "Infinix Smart 20 (4GB-64GB)",
    brand: "Infinix",
    price: 41999,
    description: "Infinix Smart 20 with 4GB RAM and 64GB storage.",
    images: ["https://www.mabdullah.pk/cdn/shop/files/InfinixSmart20128GBStorage4GBRam4.webp?v=1784301911"],
    specs: { ram: "4GB", storage: "64GB", battery: "5200 Mah" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1004,
    name: "Infinix Smart 20 (4GB-128GB)",
    brand: "Infinix",
    price: 49999,
    description: "Infinix Smart 20 with 4GB RAM and 128GB storage.",
    images: ["https://www.mabdullah.pk/cdn/shop/files/InfinixSmart20128GBStorage4GBRam4.webp?v=1784301911"],
    specs: { ram: "4GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1005,
    name: "Infinix Hot 60i (6GB-128GB)",
    brand: "Infinix",
    price: 58999,
    description: "Infinix Hot 60i with 6GB RAM and 128GB storage.",
    images: ["https://images.priceoye.pk/infinix-hot-60i-pakistan-priceoye-1r9tw.jpg"],
    specs: { ram: "6GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1006,
    name: "Infinix Hot 70 (6GB-128GB)",
    brand: "Infinix",
    price: 68999,
    description: "Infinix Hot 70 with 6GB RAM and 128GB storage.",
    images: ["https://global.pro.infinixmobility.com/media/wysiwyg/X6895_X6895B_HOT70_Family_series_Base_4.webp"],
    specs: { ram: "6GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1007,
    name: "Infinix Note Edge 5g (8GB-256GB)",
    brand: "Infinix",
    price: 99999,
    description: "Infinix Note Edge with 8GB RAM and 256GB storage.",
    images: ["https://www.lahorecentre.com/cdn/shop/files/InfinixNoteEdge256GBStorage_8GBRamBlack.webp?v=1784114215&width=1200"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1008,
    name: "Infinix Hot 60 Pro Plus (8GB-256GB)",
    brand: "Infinix",
    price: 84999,
    description: "Infinix Hot 60 Pro Plus with 8GB RAM and 256GB storage.",
    images: ["https://images.priceoye.pk/infinix-hot-60-pro-plus-pakistan-priceoye-kerst-500x500.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1009,
    name: "Infinix Note 60 Pro (8GB-256GB)",
    brand: "Infinix",
    price: 125999,
    description: "Infinix Note 60 Pro with 8GB RAM and 256GB storage.",
    images: ["https://d3o31au25zfcly.cloudfront.net/newfileadmin/usp/note/note-60-pro/sec8/wap/p3.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1010,
    name: "Tecno Spark 50 (6GB-128GB)",
    brand: "Tecno",
    price: 64999,
    description: "Tecno Spark 50 with 6GB RAM and 128GB storage.",
    images: ["https://d13pvy8xd75yde.cloudfront.net/global/spark50_kn4_kn4n/800%2A800/halo-blue.png"],
    specs: { ram: "6GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1011,
    name: "Tecno Spark Go 3 (4GB-64GB)",
    brand: "Tecno",
    price: 41999,
    description: "Tecno Spark Go 3 with 4GB RAM and 64GB storage.",
    images: ["https://d13pvy8xd75yde.cloudfront.net/global/sparkgo3-pop20/800%2A800/KN3-%E6%B7%B1%E8%93%9D%E8%89%B2.png"],
    specs: { ram: "4GB", storage: "64GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1012,
    name: "Tecno Spark 40 Pro Plus (8GB-256GB)",
    brand: "Tecno",
    price: 84999,
    description: "Tecno Spark 40 Pro Plus with 8GB RAM and 256GB storage.",
    images: ["https://d13pvy8xd75yde.cloudfront.net/global/phones/spark-40-pro-%2B/assets/images-color-7-r-3-mo-1.jpg.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1013,
    name: "Tecno Spark Go 3 (4GB-128GB)",
    brand: "Tecno",
    price: 49999,
    description: "Tecno Spark Go 3 with 4GB RAM and 128GB storage.",
    images: ["https://d13pvy8xd75yde.cloudfront.net/global/sparkgo3-pop20/800%2A800/KN3-%E6%B7%B1%E8%93%9D%E8%89%B2.png"],
    specs: { ram: "4GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1014,
    name: "Tecno Spark 50 Pro (8GB-128GB)",
    brand: "Tecno",
    price: 74999,
    description: "Tecno Spark 50 Pro with 8GB RAM and 128GB storage.",
    images: ["https://st.gsmarena.com/imgroot/news/26/06/tecno-spark-50-pro-ofic/inline/-1200/gsmarena_005.jpg"],
    specs: { ram: "8GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1015,
    name: "Tecno Spark 40 Pro (8GB-256GB)",
    brand: "Tecno",
    price: 73999,
    description: "Tecno Spark 40 Pro with 8GB RAM and 256GB storage.",
    images: ["https://d13pvy8xd75yde.cloudfront.net/global/phones/spark-40-pro/assets/images-color-6-r-3-mo-1.jpg.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1016,
    name: "Tecno Camon 50 Pro (8GB-256GB)",
    brand: "Tecno",
    price: 109999,
    description: "Tecno Camon 50 Pro with 8GB RAM and 256GB storage.",
    images: ["https://images.priceoye.pk/tecno-camon-50-pro-pakistan-priceoye-3vbs7.jpg"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1017,
    name: "Tecno Camon 50 (8GB-256GB)",
    brand: "Tecno",
    price: 99999,
    description: "Tecno Camon 50 with 8GB RAM and 256GB storage.",
    images: ["https://d13pvy8xd75yde.cloudfront.net/global/camon50/CN5-en_v1.0.0_complete/assets/images-CN5-image-mo-lens-1.png.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1018,
    name: "Tecno Camon 50 Ultra 5G (8GB-256GB)",
    brand: "Tecno",
    price: 119999,
    description: "Tecno Camon 50 Ultra 5G with 8GB RAM and 256GB storage.",
    images: ["https://d13pvy8xd75yde.cloudfront.net/camon/CN7C-%E6%99%A8%E9%9B%BE%E7%B4%AB.png"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1019,
    name: "itel City 200 (4GB-128GB)",
    brand: "itel",
    price: 39999,
    description: "itel City 200 with 4GB RAM and 128GB storage.",
    images: ["https://advancetelecom.com.pk/wp-content/uploads/2026/03/Silver_Back-Right-45-2-600x600.webp"],
    specs: { ram: "4GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1020,
    name: "itel A100C Special Edition (3GB-128GB)",
    brand: "itel",
    price: 29999,
    description: "itel A100C Special Edition with 3GB RAM and 128GB storage.",
    images: ["https://itel-pk.com/cdn/shop/files/itel-a100c-special-edition.png?v=1790160959"],
    specs: { ram: "3GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1021,
    name: "itel S26 Ultra (8GB-128GB)",
    brand: "itel",
    price: 45999,
    description: "itel S26 Ultra with 8GB RAM and 128GB storage.",
    images: ["https://alkayconcepts.com/wp-content/uploads/2025/10/6-2.jpg"],
    specs: { ram: "8GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1022,
    name: "itel S26 Ultra (8GB-256GB)",
    brand: "itel",
    price: 61999,
    description: "itel S26 Ultra with 8GB RAM and 256GB storage.",
    images: ["https://alkayconcepts.com/wp-content/uploads/2025/10/6-2.jpg"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1023,
    name: "itel A50C (2GB-64GB)",
    brand: "itel",
    price: 24999,
    description: "itel A50C with 2GB RAM and 64GB storage.",
    images: ["https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/38/6650024/1.jpg?2504"],
    specs: { ram: "2GB", storage: "64GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
// {
//     id: 1024,
//     name: "Realme Note 70 (4GB-128GB)",
//     brand: "Realme",
//     price: 44999,
//     description: "Realme Note 70 with 4GB RAM and 128GB storage.",
//     images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH9lucVG-azer8RW_KsqgBMMA5FoCTnbRvGjMlirDsnYVqh3sQP6NFTSk&s=10"],
//     specs: { ram: "4GB", storage: "128GB" },
//     stock: 8,
//     freeDelivery: true,
//     installment: true
// },
// {
//     id: 1025,
//     name: "Realme Note 70 (6GB-128GB)",
//     brand: "Realme",
//     price: 46999,
//     description: "Realme Note 70 with 6GB RAM and 128GB storage.",
//     images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTH9lucVG-azer8RW_KsqgBMMA5FoCTnbRvGjMlirDsnYVqh3sQP6NFTSk&s=10"],
//     specs: { ram: "6GB", storage: "128GB" },
//     stock: 8,
//     freeDelivery: true,
//     installment: true
// },
{
    id: 1026,
    name: "Realme C100i (4GB-64GB)",
    brand: "Realme",
    price: 40999,
    description: "Realme C100i with 4GB RAM and 64GB storage.",
    images: ["https://media.wisemarket.com.pk/variant/RealmeC100iDawnPurple64GB4GBRAMBrandNew-52630.webp"],
    specs: { ram: "4GB", storage: "64GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1027,
    name: "Realme C100i (6GB-128GB)",
    brand: "Realme",
    price: 64999,
    description: "Realme C100i with 6GB RAM and 128GB storage.",
    images: ["https://media.wisemarket.com.pk/variant/RealmeC100iDawnPurple64GB4GBRAMBrandNew-52630.webp"],
    specs: { ram: "6GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1028,
    name: "Realme C100i (4GB-128GB)",
    brand: "Realme",
    price: 52999,
    description: "Realme C100i with 4GB RAM and 128GB storage.",
    images: ["https://media.wisemarket.com.pk/variant/RealmeC100iDawnPurple64GB4GBRAMBrandNew-52630.webp"],
    specs: { ram: "4GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1029,
    name: "Realme Note 60x (4GB-64GB)",
    brand: "Realme",
    price: 38999,
    description: "Realme Note 60x with 4GB RAM and 64GB storage.",
    images: ["https://images.priceoye.pk/realme-note-60x-pakistan-priceoye-1qlcp-500x500.webp"],
    specs: { ram: "4GB", storage: "64GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1030,
    name: "Realme C100 (8GB-256GB)",
    brand: "Realme",
    price: 94999,
    description: "Realme C100 with 8GB RAM and 256GB storage.",
    images: ["https://static2.realme.net/images/realme-c100/17744900586952b389c416de64c15b47c4497896e4f08.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1031,
    name: "Realme C100x (8GB-128GB)",
    brand: "Realme",
    price: 79999,
    description: "Realme C100x with 8GB RAM and 128GB storage.",
    images: ["https://rukminim3.flixcart.com/image/480/640/xif0q/mobile/b/b/c/-original-imahp9fxtfedkdue.jpeg?q=90"],
    specs: { ram: "8GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1032,
    name: "Realme C100x (6GB-128GB)",
    brand: "Realme",
    price: 69999,
    description: "Realme C100x with 6GB RAM and 128GB storage.",
    images: ["https://rukminim3.flixcart.com/image/480/640/xif0q/mobile/b/b/c/-original-imahp9fxtfedkdue.jpeg?q=90"],
    specs: { ram: "6GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1033,
    name: "Realme 16 (8GB-256GB)",
    brand: "Realme",
    price: 129999,
    description: "Realme 16 with 8GB RAM and 256GB storage.",
    images: ["https://images.priceoye.pk/realme-16-5g-pakistan-priceoye-xp75s-500x500.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1034,
    name: "ZTE Nubia A36 (4GB-64GB)",
    brand: "ZTE Nubia",
    price: 32999,
    description: "ZTE Nubia A36 with 4GB RAM and 64GB storage.",
    images: ["https://www.nubia.com/content/dam/nubia/pakistan/owais-khan-2/WhatsApp%20Image%202025-09-23%20at%2010.44.56%20AM%20(1).jpeg"],
    specs: { ram: "4GB", storage: "64GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1035,
    name: "ZTE Nubia V80 Max (8GB-256GB)",
    brand: "ZTE Nubia",
    price: 50999,
    description: "ZTE Nubia V80 Max with 8GB RAM and 256GB storage.",
    images: ["https://zmobiles.pk/_next/image/?url=https%3A%2F%2Fcdn.zmobiles.pk%2Fuploads%2F2026%2F09%2Fzte-nubia-v80-max4-k9fCHOyD.webp&w=1920&q=70"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1036,
    name: "ZTE Nubia V80 Pro (8GB-256GB)",
    brand: "ZTE Nubia",
    price: 55999,
    description: "ZTE Nubia V80 Pro with 8GB RAM and 256GB storage.",
    images: ["https://www.nubia.com/content/dam/nubia/pakistan/pro-/Colors.jpg"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1037,
    name: "Oppo A6c (4GB-128GB)",
    brand: "Oppo",
    price: 55999,
    description: "Oppo A6c with 4GB RAM and 128GB storage.",
    images: ["https://npcdn.ratopati.com/media/news/pic_HQwTCouG73.jpg"],
    specs: { ram: "4GB", storage: "128GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1038,
    name: "Oppo A6c (4GB-64GB)",
    brand: "Oppo",
    price: 44999,
    description: "Oppo A6c with 4GB RAM and 64GB storage.",
    images: ["https://npcdn.ratopati.com/media/news/pic_HQwTCouG73.jpg"],
    specs: { ram: "4GB", storage: "64GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1039,
    name: "Oppo Reno 15 Pro 5G (12GB-512GB)",
    brand: "Oppo",
    price: 249999,
    description: "Oppo Reno 15 Pro 5G with 12GB RAM and 512GB storage.",
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRTrKpF21MUq-QGS6_QAwNYIndwRgswu1Mc_0KDFof9T0RRyNas5lUCDz_o&s=10"],
    specs: { ram: "12GB", storage: "512GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1040,
    name: "Oppo Reno 15F (8GB-256GB)",
    brand: "Oppo",
    price: 134999,
    description: "Oppo Reno 15F with 8GB RAM and 256GB storage.",
    images: ["https://images.priceoye.pk/oppo-reno-15f-pakistan-priceoye-4uiqa-500x500.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1041,
    name: "Oppo A6s Pro (8GB-256GB)",
    brand: "Oppo",
    price: 119999,
    description: "Oppo A6s Pro with 8GB RAM and 256GB storage.",
    images: ["https://images.priceoye.pk/oppo-a6-pro-pakistan-priceoye-4ztwe-270x270.webp"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1042,
    name: "Oppo A6k (4GB-128GB)",
    brand: "Oppo",
    price: 56999,
    description: "Oppo A6k with 4GB RAM and 128GB storage.",
    images: ["https://www.mabdullah.pk/cdn/shop/files/OppoA6k128GBStorage_6GBRam2.webp?v=1778855848"],
    specs: { ram: "4GB", storage: "128GB", battery: "6500 Mah" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1043,
    name: "Oppo A6k (6GB-128GB)",
    brand: "Oppo",
    price: 69999,
    description: "Oppo A6k with 6GB RAM and 128GB storage.",
    images: ["https://www.mabdullah.pk/cdn/shop/files/OppoA6k128GBStorage_6GBRam2.webp?v=1778855848"],
    specs: { ram: "6GB", storage: "128GB", battery: "6500 Mah" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1044,
    name: "Oppo A6s (8GB-256GB)",
    brand: "Oppo",
    price: 99999,
    description: "Oppo A6s with 8GB RAM and 256GB storage.",
    images: ["https://www.oppo.com/content/dam/oppo/common/mkt/v2-2/a6-series/b4/specs/a6s/brown-white.png"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1045,
    name: "Oppo Reno 16F 5G (8GB-256GB)",
    brand: "Oppo",
    price: 159999,
    description: "Oppo Reno 16F 5G with 8GB RAM and 256GB storage.",
    images: ["https://www.oppo.com/content/dam/oppo_com/common/mkt/v2-2/oppo-reno16-series-en/navigation/reno16-f/440-440-white.png"],
    specs: { ram: "8GB", storage: "256GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
},
{
    id: 1046,
    name: "Villaon V50S (4GB-64GB)",
    brand: "Villaon",
    price: 26999,
    description: "Villaon V50S with 4GB RAM and 64GB storage.",
    images: ["https://lipamdogomdogo.com/wp-content/uploads/2026/03/Villaon-V50s-Main.webp"],
    specs: { ram: "4GB", storage: "64GB" },
    stock: 8,
    freeDelivery: true,
    installment: true
}
];

/**
 * Initializes products by generating slugs for them.
 * This function should be called once after the products array is defined.
 */
function initializeProducts() {
    products.forEach(p => {
        if (!p.slug) {
            p.slug = generateSlug(p.name);
        }
    });
}

// Call the function to process the products array.
initializeProducts();