const fs = require('fs');
const path = require('path');

// Paths
const productsPath = path.join(__dirname, 'products.js');
const sitemapPath = path.join(__dirname, 'sitemap.xml');

// --- Load Products ---
const productsContent = fs.readFileSync(productsPath, 'utf8');
let products = [];

// A safer way to get the products array without using eval()
const context = {
    products: [],
    installmentConfig: {},
    generateSlug: (name) => name.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '').replace(/\+/g, '-plus'),
    initializeProducts: function() {
        this.products.forEach(p => {
            if (!p.slug) {
                p.slug = this.generateSlug(p.name);
            }
        });
    }
};

const script = new (require('vm').Script)(productsContent);
script.runInNewContext(context);
products = context.products;

if (!Array.isArray(products)) {
    console.error('Error: Could not load products array from products.js. Ensure products.js defines a global "products" array.');
    process.exit(1);
}

const baseUrl = 'https://shahabmobile.netlify.app/';

let sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
    <loc>${baseUrl}gadgets.html</loc>
    <priority>0.8</priority>
  </url>
`;

products.forEach(product => {
    sitemapXml += `  <url>
    <loc>${baseUrl}product.html?slug=${product.slug}</loc>
    <priority>0.7</priority>
  </url>
`;
});

sitemapXml += `</urlset>`;

fs.writeFileSync(sitemapPath, sitemapXml, 'utf8');
console.log('sitemap.xml generated successfully with all product links!');