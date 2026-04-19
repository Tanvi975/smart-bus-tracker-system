// 🗺️ Map initialize
const busIcon = L.icon({
    iconUrl: 'https://img.icons8.com/emoji/48/bus-emoji.png',
    iconSize: [55, 55],
    iconAnchor: [25, 25],
    popupAnchor: [0, -40]
});

const map = L.map('map').setView([28.6757, 77.5018], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// 🚌 Marker
let marker = L.marker([28.6757, 77.5018], { icon: busIcon }).addTo(map);

// 📊 State variables
let lastPosition = null;
let currentPosition = null;
let lastUpdateTime = Date.now();
let speed = 0;
let isOffline = false;

let fetchInterval = 2000;

// 🌐 Network speed detect
function adjustFetchInterval() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
        fetchInterval = connection.downlink < 1 ? 5000 : 2000;
    }
}

// 🔄 Smooth interpolation (online)
function interpolatePosition() {
    if (!lastPosition || !currentPosition) return;

    const now = Date.now();
    const t = (now - lastUpdateTime) / fetchInterval;

    const lat = lastPosition.lat + (currentPosition.lat - lastPosition.lat) * t;
    const lng = lastPosition.lng + (currentPosition.lng - lastPosition.lng) * t;

    marker.setLatLng([lat, lng]);
}

// 🔮 Offline prediction
function predictMovement() {
    if (!currentPosition) return;

    const newLat = currentPosition.lat + 0.0001;
    const newLng = currentPosition.lng + 0.0001;

    marker.setLatLng([newLat, newLng]);
    currentPosition = { lat: newLat, lng: newLng };
}

// 📡 Fetch API
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

    } catch (err) {
        console.log("Offline mode");

        // 🔴 OFFLINE
        document.getElementById("status").innerText = "Status: Reconnecting...";
        isOffline = true;

        // Prediction movement
        predictMovement();
    }
}

// 🎞️ Animation loop (IMPORTANT)
function animate() {
    if (isOffline) {
        predictMovement();
    } else {
        interpolatePosition();
    }
    requestAnimationFrame(animate);
}

// 🚀 Start system
function start() {
    adjustFetchInterval();
    setInterval(fetchBusData, fetchInterval);
    animate();
}

start();

// 🌐 Network events
window.addEventListener('offline', () => {
    isOffline = true;
    const statusElement = document.getElementById("status");
    if (statusElement) {
        statusElement.innerText = "Status: Reconnecting...";
        statusElement.style.color = "orange";
    }
});

window.addEventListener('online', () => {
    console.log("Internet back");
});