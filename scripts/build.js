const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config.json');
const templatePath = path.join(__dirname, '../template.html');
const distPath = path.join(__dirname, '../dist');

if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath);
}

// Copy assets
['styles.css', 'script.js', 'config.json'].forEach(file => {
    fs.copyFileSync(path.join(__dirname, '..', file), path.join(distPath, file));
});

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const template = fs.readFileSync(templatePath, 'utf8');

const countries = Object.keys(config.stripe);
const baseUrl = 'https://fees.techfliq.com'; // Custom domain

let sitemapUrls = [];

function generatePage(origin, dest, isIndex = false) {
    const originName = config.stripe[origin].name;
    const destName = config.stripe[dest].name;

    const title = isIndex 
        ? "Free Stripe & PayPal International Fee Calculator | B2B Costs"
        : `Stripe & PayPal Fees: ${originName} to ${destName} | Exact Calculator`;
        
    const description = isIndex
        ? "Calculate the exact net profit after Stripe and PayPal international payment fees for B2B and SaaS."
        : `Calculate the exact Stripe and PayPal cross-border fees when charging customers in ${destName} from ${originName}. See hidden currency conversion costs.`;
        
    const h1 = isIndex
        ? "Global Payment Fee Matrix"
        : `Fees: ${originName} to ${destName}`;
        
    const fileName = isIndex ? 'index.html' : `${origin.toLowerCase()}-to-${dest.toLowerCase()}.html`;
    const canonicalUrl = `${baseUrl}/${fileName}`;
    
    // Schema Markup
    const schema = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "${title}",
      "description": "${description}",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All"
    }
    </script>
    `;

    // Educational SEO Content
    const seoContent = `
    <section class="seo-content" style="padding: 2rem; color: var(--text-secondary); max-width: 800px; margin: 0 auto; line-height: 1.6; background: rgba(0,0,0,0.2); border-radius: 16px; margin-top: 2rem; border: 1px solid rgba(255,255,255,0.05);">
        <h2 style="color: var(--text-primary); margin-bottom: 1rem; font-size: 1.5rem;">Understanding Cross-Border Fees from ${originName} to ${destName}</h2>
        <p style="margin-bottom: 1.5rem;">When processing international payments between ${originName} and ${destName}, businesses often overlook hidden costs. Both Stripe and PayPal charge a base domestic fee, but international transactions trigger additional surcharges.</p>
        
        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.25rem;">The Hidden Cost of Cross-Border Payments</h3>
        <p style="margin-bottom: 1.5rem;">If your business is located in ${originName} and you charge a customer's card issued in ${destName}, you typically face an <strong>International Card Surcharge</strong>. Furthermore, if the transaction requires currency conversion, a <strong>Currency Conversion Surcharge</strong> is applied. Our calculator breaks down these exact percentages so you know your true net profit.</p>
        
        <h3 style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.25rem;">Stripe vs. PayPal for Global B2B</h3>
        <p>While Stripe often separates the international card fee and currency conversion fee, PayPal often bundles them into a higher flat percentage or applies differing fixed fees based on the specific corridor. Always compare the <strong>Net Received</strong> amount to determine the most cost-effective gateway for your ${destName} customers.</p>
    </section>
    `;

    const dropdownScript = `
    <script>
        window.INITIAL_ORIGIN = '${origin}';
        window.INITIAL_DEST = '${dest}';
    </script>
    `;

    let html = template
        .replace('{{TITLE}}', title)
        .replace('{{DESCRIPTION}}', description)
        .replace('{{CANONICAL_URL}}', canonicalUrl)
        .replace('{{SCHEMA}}', schema)
        .replace('{{H1}}', h1)
        .replace('{{SEO_CONTENT}}', seoContent)
        .replace('{{DROPDOWN_SCRIPT}}', dropdownScript);

    fs.writeFileSync(path.join(distPath, fileName), html);
    
    sitemapUrls.push(`
  <url>
    <loc>${canonicalUrl}</loc>
    <changefreq>weekly</changefreq>
  </url>`);
}

// Generate all permutations
countries.forEach(origin => {
    countries.forEach(dest => {
        generatePage(origin, dest, false);
    });
});

// Generate main index page (defaulting to US to UK)
generatePage('US', 'UK', true);

// Generate Sitemap
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.join('')}
</urlset>`;

fs.writeFileSync(path.join(distPath, 'sitemap.xml'), sitemap);

console.log(`Successfully generated ${countries.length * countries.length + 1} pages and sitemap.xml in dist/`);
