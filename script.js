// Initialize map centered at Ghaziabad
const map = L.map('map').setView([28.6757, 77.5018], 13);

// Tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Custom Bus Icon
const busIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/61/61231.png',
    iconSize: [40, 40]
});

// Marker
let marker = L.marker([28.6757, 77.5018], { icon: busIcon }).addTo(map);

// State variables
let lastPosition = null;
let currentPosition = null;
let lastUpdateTime = Date.now();
let speed = 0;
let isOffline = false;

// Adaptive polling interval
let fetchInterval = 2000;

// Detect network speed (basic)
function adjustFetchInterval() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        if (connection.downlink < 1) {
            fetchInterval = 5000; // slow network
        } else {
            fetchInterval = 2000; // fast network
        }
    }
}

// Smooth interpolation
function interpolatePosition() {
    if (!lastPosition || !currentPosition) return;

    const now = Date.now();
    const t = (now - lastUpdateTime) / fetchInterval;

    const lat = lastPosition.lat + (currentPosition.lat - lastPosition.lat) * t;
    const lng = lastPosition.lng + (currentPosition.lng - lastPosition.lng) * t;

    marker.setLatLng([lat, lng]);
}

// Store-and-forward fallback (predict movement)
function predictMovement() {
    if (!currentPosition || !lastPosition) return;

    const dt = 1; // seconds
    const lat = currentPosition.lat + speed * dt * 0.0001;
    const lng = currentPosition.lng + speed * dt * 0.0001;

    marker.setLatLng([lat, lng]);
}

// Fetch API
async function fetchBusData() {
    try {
        const res = await fetch('http://localhost:3000/bus-location');
        const data = await res.json();

        // ✅ ONLINE
        document.getElementById("status").innerText = "Status: Online";
        isOffline = false;

        lastPosition = currentPosition || { lat: data.lat, lng: data.lng };
        currentPosition = { lat: data.lat, lng: data.lng };

        speed = data.speed;
        lastUpdateTime = Date.now();

        document.getElementById("eta").innerText = data.eta + " mins";

        // 🚌 Marker update
        if (!marker) {
            marker = L.marker([data.lat, data.lng]).addTo(map);
        } else {
            marker.setLatLng([data.lat, data.lng]);
        }

    } catch (err) {
        console.log("Offline mode");

        // 🔴 OFFLINE
        document.getElementById("status").innerText = "Status: Reconnecting...";
        isOffline = true;

        // 🟡 Prediction logic (IMPORTANT 🔥)
        if (currentPosition && marker) {
            let newLat = currentPosition.lat + 0.0001;
            let newLng = currentPosition.lng + 0.0001;

            marker.setLatLng([newLat, newLng]);

            currentPosition = { lat: newLat, lng: newLng };
        }
    }
}

// Animation loop
function animate() {
    if (isOffline) {
        predictMovement();
    } else {
        interpolatePosition();
    }
    requestAnimationFrame(animate);
}

// Start system
function start() {
    adjustFetchInterval();
    setInterval(fetchBusData, fetchInterval);
    animate();
}

start();