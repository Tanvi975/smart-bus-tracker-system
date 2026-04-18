const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const PORT = 3000;

// Test route (IMPORTANT)
app.get('/', (req, res) => {
    res.send("Server is working!");
});

// Bus route
const route = [
    { lat: 28.6757, lng: 77.5018 },
    { lat: 28.6765, lng: 77.5050 },
    { lat: 28.6780, lng: 77.5080 },
    { lat: 28.6800, lng: 77.5100 },
    { lat: 28.6820, lng: 77.5120 }
];

let index = 0;

// Distance function
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// API
app.get('/bus-location', (req, res) => {
    const current = route[index];
    const next = route[(index + 1) % route.length];

    const distance = getDistance(current.lat, current.lng, next.lat, next.lng);
    const speed = 30;
    const eta = ((distance / speed) * 60).toFixed(2);

    index = (index + 1) % route.length;

    res.json({
        lat: current.lat,
        lng: current.lng,
        speed: speed,
        eta: eta
    });
});

// Start server (MOST IMPORTANT)
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});