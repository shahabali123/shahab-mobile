const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ================================
// Paths
// ================================
const productsPath = path.join(__dirname, 'products.js');
const sitemapPath = path.join(__dirname, 'sitemap.xml');

// ================================
// Load Products
// ================================
const productsContent = fs.readFileSync(productsPath, 'utf8');

const context = {
    products: [],
    installmentConfig: {},

    // Generate URL slug from product name
    generateSlug: (name) => {
        return name
            .toString()
            .toLowerCase()
            .trim()
            .replace(/&/g, 'and')
            .replace(/\+/g, '-plus')
            .replace(/[()]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    // Generate slug if product doesn't already have one
    initializeProducts: function () {
        this.products.forEach(product => {
            if (!product.slug || product.slug.trim() === '') {
                product.slug = this.generateSlug(product.name);
            }
        });
    }
};

// Run products.js safely
try {
    const script = new vm.Script(productsContent);
    script.runInNewContext(context);
} catch (error) {
    console.error('❌ Error loading products.js:');
    console.error(error.message);
    process.exit(1);
}

const products = context.products;

// ================================
// Validate Products
// ================================
if (!Array.isArray(products)) {
    console.error(
        '❌ Error: Could not load products array from products.js.'
    );
    process.exit(1);
}

// Generate missing slugs
context.initializeProducts();

// ================================
// Website URL
// ================================
const baseUrl = 'https://shahabmobile.netlify.app/';

// ================================
// XML Escape Function
// ================================
function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// ================================
// Start Sitemap
// ================================
let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

    <!-- Main Pages -->

    <url>
        <loc>${baseUrl}index.html</loc>
        <priority>1.0</priority>
    </url>

    <url>
        <loc>${baseUrl}offers.html</loc>
        <priority>0.8</priority>
    </url>

    <url>
        <loc>${baseUrl}installments.html</loc>
        <priority>0.8</priority>
    </url>

    <url>
        <loc>${baseUrl}calculator.html</loc>
        <priority>0.8</priority>
    </url>

    <url>
        <loc>${baseUrl}guide.html</loc>
        <priority>0.9</priority>
    </url>

    <url>
        <loc>${baseUrl}gadgets.html</loc>
        <priority>0.8</priority>
    </url>

`;

// ================================
// Add Product URLs
// ================================
products.forEach(product => {

    if (!product.name) {
        console.warn('⚠️ Product skipped because name is missing.');
        return;
    }

    const slug = product.slug || context.generateSlug(product.name);

    const productUrl =
        `${baseUrl}product.html?slug=${encodeURIComponent(slug)}`;

    sitemapXml += `
    <url>
        <loc>${escapeXml(productUrl)}</loc>
        <priority>0.7</priority>
    </url>
`;
});

// ================================
// Close Sitemap
// ================================
sitemapXml += `
</urlset>
`;

// ================================
// Write sitemap.xml
// ================================
fs.writeFileSync(
    sitemapPath,
    sitemapXml,
    'utf8'
);

console.log('======================================');
console.log('✅ sitemap.xml generated successfully!');
console.log(`📦 Products included: ${products.length}`);
console.log(`📄 Sitemap: ${sitemapPath}`);
console.log('======================================');