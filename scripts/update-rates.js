const fs = require('fs');
const path = require('path');

async function updateRates() {
    try {
        console.log("Fetching latest exchange rates...");
        // In a real app, use a free API like ExchangeRate-API
        // const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        // const data = await res.json();
        // const rates = data.rates;

        // For this demo, we'll simulate fetching new rates
        // (If you sign up for a real API, uncomment the code above)
        const mockRates = {
            "USD": 1.0,
            "GBP": (0.75 + Math.random() * 0.05).toFixed(2),
            "EUR": (0.90 + Math.random() * 0.05).toFixed(2),
            "CAD": (1.30 + Math.random() * 0.1).toFixed(2),
            "INR": (82.0 + Math.random() * 3.0).toFixed(2)
        };

        const configPath = path.join(__dirname, '../config.json');
        const configRaw = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configRaw);

        // Update the metadata and rates
        const date = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        config.lastUpdated = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        config.exchangeRates = mockRates; // Replace with `rates` if using real API

        // Write back
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log("config.json successfully updated.");
    } catch (err) {
        console.error("Failed to update rates:", err);
        process.exit(1);
    }
}

updateRates();
