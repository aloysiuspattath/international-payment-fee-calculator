let config = null;

const elements = {
    badge: document.getElementById('last-updated-badge'),
    amountInput: document.getElementById('amount'),
    originSelect: document.getElementById('origin-country'),
    destSelect: document.getElementById('destination-country'),
    currencySymbol: document.getElementById('input-currency-symbol'),
    currencyDisplays: document.querySelectorAll('.currency-display'),
    
    // Stripe
    stripeTotalPercent: document.getElementById('stripe-total-percent'),
    stripeTotalSent: document.getElementById('stripe-total-sent'),
    stripeBaseRate: document.getElementById('stripe-base-rate'),
    stripeBaseFee: document.getElementById('stripe-base-fee'),
    stripeIntlRow: document.getElementById('stripe-intl-row'),
    stripeIntlRate: document.getElementById('stripe-intl-rate'),
    stripeIntlFee: document.getElementById('stripe-intl-fee'),
    stripeFxRow: document.getElementById('stripe-fx-row'),
    stripeFxRate: document.getElementById('stripe-fx-rate'),
    stripeFxFee: document.getElementById('stripe-fx-fee'),
    stripeFixedFee: document.getElementById('stripe-fixed-fee'),
    stripeNetReceived: document.getElementById('stripe-net-received'),
    stripeNetReceivedDest: document.getElementById('stripe-net-received-dest'),

    // PayPal
    paypalTotalPercent: document.getElementById('paypal-total-percent'),
    paypalTotalSent: document.getElementById('paypal-total-sent'),
    paypalBaseRate: document.getElementById('paypal-base-rate'),
    paypalBaseFee: document.getElementById('paypal-base-fee'),
    paypalIntlRow: document.getElementById('paypal-intl-row'),
    paypalIntlRate: document.getElementById('paypal-intl-rate'),
    paypalIntlFee: document.getElementById('paypal-intl-fee'),
    paypalFxRow: document.getElementById('paypal-fx-row'),
    paypalFxRate: document.getElementById('paypal-fx-rate'),
    paypalFxFee: document.getElementById('paypal-fx-fee'),
    paypalFixedFee: document.getElementById('paypal-fixed-fee'),
    paypalNetReceived: document.getElementById('paypal-net-received'),
    paypalNetReceivedDest: document.getElementById('paypal-net-received-dest')
};

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (!response.ok) {
            throw new Error('Failed to load config');
        }
        config = await response.json();
        
        elements.badge.textContent = `Rates updated: ${config.lastUpdated}`;
        
        populateDropdowns();
        calculate();
        
        elements.amountInput.addEventListener('input', calculate);
        elements.originSelect.addEventListener('change', calculate);
        elements.destSelect.addEventListener('change', calculate);
    } catch (e) {
        elements.badge.textContent = 'Error loading rates';
        console.error("Make sure you are serving via a local server so fetch() works, or deploy to a static host.", e);
    }
}

function populateDropdowns() {
    const countries = Object.keys(config.stripe);
    
    let optionsHtml = '';
    countries.forEach(code => {
        const c = config.stripe[code];
        optionsHtml += `<option value="${code}">${c.name} (${code})</option>`;
    });

    elements.originSelect.innerHTML = optionsHtml;
    elements.destSelect.innerHTML = optionsHtml;
    
    // Set some defaults
    elements.originSelect.value = 'US';
    elements.destSelect.value = 'UK';
}

function formatCurrency(amount, currencyCode) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
    }).format(amount);
}

function calculate() {
    if (!config) return;

    const amountStr = elements.amountInput.value;
    const amount = parseFloat(amountStr) || 0;
    const origin = elements.originSelect.value;
    const dest = elements.destSelect.value;
    
    const isIntl = origin !== dest;

    // Update UI labels for origin currency
    const originConfig = config.stripe[origin];
    const currency = originConfig.currency;
    const destCurrency = config.stripe[dest].currency;
    
    elements.currencySymbol.textContent = originConfig.currencySymbol;
    elements.currencyDisplays.forEach(el => el.textContent = currency);

    // Calc Stripe
    calcProvider('stripe', config.stripe[origin], amount, isIntl, currency, destCurrency);
    
    // Calc PayPal
    calcProvider('paypal', config.paypal[origin], amount, isIntl, currency, destCurrency);
}

function calcProvider(providerName, providerConfig, amount, isIntl, currency, destCurrency) {
    const basePercent = providerConfig.basePercent || 0;
    const intlPercent = isIntl ? (providerConfig.intlCardSurcharge || 0) : 0;
    const fxPercent = isIntl ? (providerConfig.currencyConversionSurcharge || 0) : 0;
    const fixedFee = providerConfig.fixedFee || 0;
    
    const totalPercent = basePercent + intlPercent + fxPercent;
    
    const baseFeeAmount = amount * (basePercent / 100);
    const intlFeeAmount = amount * (intlPercent / 100);
    const fxFeeAmount = amount * (fxPercent / 100);
    
    const totalFee = baseFeeAmount + intlFeeAmount + fxFeeAmount + fixedFee;
    const netReceived = amount - totalFee;

    const p = providerName === 'stripe' ? {
        totalPercent: elements.stripeTotalPercent,
        totalSent: elements.stripeTotalSent,
        baseRate: elements.stripeBaseRate,
        baseFee: elements.stripeBaseFee,
        intlRow: elements.stripeIntlRow,
        intlRate: elements.stripeIntlRate,
        intlFee: elements.stripeIntlFee,
        fxRow: elements.stripeFxRow,
        fxRate: elements.stripeFxRate,
        fxFee: elements.stripeFxFee,
        fixedFee: elements.stripeFixedFee,
        netReceived: elements.stripeNetReceived,
        netReceivedDest: elements.stripeNetReceivedDest
    } : {
        totalPercent: elements.paypalTotalPercent,
        totalSent: elements.paypalTotalSent,
        baseRate: elements.paypalBaseRate,
        baseFee: elements.paypalBaseFee,
        intlRow: elements.paypalIntlRow,
        intlRate: elements.paypalIntlRate,
        intlFee: elements.paypalIntlFee,
        fxRow: elements.paypalFxRow,
        fxRate: elements.paypalFxRate,
        fxFee: elements.paypalFxFee,
        fixedFee: elements.paypalFixedFee,
        netReceived: elements.paypalNetReceived,
        netReceivedDest: elements.paypalNetReceivedDest
    };

    p.totalPercent.textContent = `~${totalPercent.toFixed(2)}% + ${formatCurrency(fixedFee, currency)}`;
    p.totalSent.textContent = formatCurrency(amount, currency);
    
    p.baseRate.textContent = basePercent.toFixed(2);
    p.baseFee.textContent = '-' + formatCurrency(baseFeeAmount, currency);
    
    if (intlPercent > 0) {
        p.intlRow.style.display = 'flex';
        p.intlRate.textContent = intlPercent.toFixed(2);
        p.intlFee.textContent = '-' + formatCurrency(intlFeeAmount, currency);
    } else {
        p.intlRow.style.display = 'none';
    }

    if (p.fxRow) {
        if (fxPercent > 0) {
            p.fxRow.style.display = 'flex';
            p.fxRate.textContent = fxPercent.toFixed(2);
            p.fxFee.textContent = '-' + formatCurrency(fxFeeAmount, currency);
        } else {
            p.fxRow.style.display = 'none';
        }
    }

    p.fixedFee.textContent = '-' + formatCurrency(fixedFee, currency);
    
    p.netReceived.textContent = formatCurrency(netReceived > 0 ? netReceived : 0, currency);
    
    if (isIntl && currency !== destCurrency && config.exchangeRates[currency] && config.exchangeRates[destCurrency]) {
        const netReceivedUSD = (netReceived > 0 ? netReceived : 0) / config.exchangeRates[currency];
        const netReceivedDest = netReceivedUSD * config.exchangeRates[destCurrency];
        p.netReceivedDest.textContent = `~ ${formatCurrency(netReceivedDest, destCurrency)}`;
    } else {
        p.netReceivedDest.textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', loadConfig);
