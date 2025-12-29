// nearby_search.js
import { loadHotelsWithCoordinates } from "./hotels_loader.js";
import { createHotelCard } from "./hotel_renderer.js";

// Firebase for favorites
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyACfhRC94Wt-_q7h1f-1cJjOV06nP9SVag",
    authDomain: "staywise-8d5dd.firebaseapp.com",
    projectId: "staywise-8d5dd",
    storageBucket: "staywise-8d5dd.firebasestorage.app",
    messagingSenderId: "308886745296",
    appId: "1:308886745296:web:a43170c671e27df804aed5",
    measurementId: "G-NZ1VYTTCGY"
};

const app = (!getApps().length) ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Constants
const FAV_KEY_PREFIX = "staywise_favorites_";
const USER_STORAGE_KEY = "currentUser";
const ITEMS_PER_PAGE = 30;
const SEARCH_STATE_KEY = "nearby_search_state";

// State
let allHotels = [];
let filteredHotels = [];
let currentPage = 1;
let map = null;
let searchMarker = null;
let hotelMarkers = [];
let currentSearchParams = null;

// =========================================
// GEOCODING & DISTANCE CALCULATION
// =========================================

/**
 * Geocode địa điểm sử dụng Nominatim API
 */
async function geocodeLocation(location, city = '') {
    try {
        const query = city ? `${location}, ${city}, Vietnam` : `${location}, Vietnam`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Tính khoảng cách giữa 2 điểm (Haversine formula)
 * Trả về khoảng cách tính bằng mét
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of Earth in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
}

/**
 * Format khoảng cách thành chuỗi dễ đọc
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    } else {
        return `${(meters / 1000).toFixed(1)} km`;
    }
}

// =========================================
// MAP INITIALIZATION
// =========================================

function initMap() {
    // Initialize Leaflet map
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }

    map = L.map('map-container').setView([10.8231, 106.6297], 13); // Default: Ho Chi Minh City

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Force map to update size after init
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 100);

    console.log('✅ Map initialized');
}

function updateMapMarker(lat, lon, popupText = '') {
    // Remove existing search marker
    if (searchMarker) {
        map.removeLayer(searchMarker);
    }

    // Add new marker
    searchMarker = L.marker([lat, lon], {
        icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }).addTo(map);

    if (popupText) {
        searchMarker.bindPopup(popupText).openPopup();
    }

    // Center map on marker
    map.setView([lat, lon], 14);
}

function addHotelMarkers(hotels) {
    // Clear existing hotel markers
    hotelMarkers.forEach(marker => map.removeLayer(marker));
    hotelMarkers = [];

    // Add new markers for each hotel
    hotels.forEach(hotel => {
        if (hotel.lat && hotel.lon) {
            const marker = L.marker([hotel.lat, hotel.lon], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map);

            marker.bindPopup(`
                <strong>${hotel.hotelName}</strong><br>
                ${hotel.distance ? formatDistance(hotel.distance) : ''}
            `);

            hotelMarkers.push(marker);
        }
    });
}

// =========================================
// SEARCH FUNCTIONALITY
// =========================================

async function performSearch() {
    console.log('🔍 [Search] Starting search...');
    
    const location = document.getElementById('location-input').value.trim();
    const city = document.getElementById('city-select').value;
    const radius = parseInt(document.getElementById('radius-input').value) || 1000;
    const maxPrice = parseInt(document.getElementById('max-price-input').value) || Infinity;

    console.log('📝 [Search] Parameters:', { location, city, radius, maxPrice });

    if (!location) {
        alert('Vui lòng nhập địa điểm bạn muốn tìm kiếm!');
        console.warn('⚠️  [Search] No location provided');
        return;
    }

    if (!city) {
        alert('Vui lòng chọn thành phố!');
        console.warn('⚠️  [Search] No city selected');
        return;
    }

    // Save search params
    currentSearchParams = { location, city, radius, maxPrice };

    // Show loading
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('results-header').style.display = 'none';
    document.getElementById('hotel-list').innerHTML = '';

    try {
        console.log('🌍 [Search] Geocoding location...');
        // 1. Geocode search location
        const searchLocation = await geocodeLocation(location, city);
        
        if (!searchLocation) {
            alert('Không tìm thấy địa điểm này. Vui lòng thử lại!');
            console.error('❌ [Search] Geocoding failed');
            document.getElementById('loading-spinner').style.display = 'none';
            return;
        }

        console.log('✅ [Search] Geocoded location:', searchLocation);

        // 2. Update map with search location
        updateMapMarker(searchLocation.lat, searchLocation.lon, location);
        document.getElementById('search-location-name').textContent = location;

        console.log(`🏨 [Search] Filtering hotels by city: ${city}`);
        console.log(`📊 [Search] Total hotels available: ${allHotels.length}`);

        // 3. Filter hotels by city (hotels already have coordinates from CSV)
        let cityHotels = allHotels.filter(hotel => {
            const hotelCity = normalizeCity(hotel.searchLocation || hotel.city || '');
            const targetCity = normalizeCity(city);
            return hotelCity.includes(targetCity) && hotel.lat && hotel.lon;
        });

        console.log(`✅ [Search] Found ${cityHotels.length} hotels in ${city} with coordinates`);

        // 4. Calculate distance for hotels with coordinates
        const hotelsWithDistance = cityHotels.map(hotel => {
            const distance = calculateDistance(
                searchLocation.lat,
                searchLocation.lon,
                hotel.lat,
                hotel.lon
            );
            return { ...hotel, distance };
        }).filter(hotel => {
            // Filter by radius and price
            if (hotel.distance > radius) return false;
            const price = hotel.minPrice || hotel.price || 0;
            return price <= maxPrice;
        });

        console.log(`📏 [Search] After distance filter (${radius}m): ${hotelsWithDistance.length} hotels`);

        // 5. Sort by distance (nearest first)
        hotelsWithDistance.sort((a, b) => a.distance - b.distance);

        filteredHotels = hotelsWithDistance;
        currentPage = 1;

        console.log(`✅ [Search] Final results: ${filteredHotels.length} hotels`);

        // 6. Save search state to sessionStorage
        saveSearchState({
            searchLocation: {
                lat: searchLocation.lat,
                lon: searchLocation.lon,
                name: location
            },
            params: currentSearchParams,
            results: filteredHotels,
            timestamp: Date.now()
        });

        // 7. Update UI
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('results-header').style.display = 'block';
        document.getElementById('results-count').textContent = filteredHotels.length;

        // 8. Add hotel markers to map
        addHotelMarkers(filteredHotels.slice(0, 50)); // Limit to first 50 for performance

        // 9. Render results
        renderPage();

        console.log('✅ [Search] Search completed successfully');

    } catch (error) {
        console.error('❌ [Search] Error:', error);
        alert('Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại!');
        document.getElementById('loading-spinner').style.display = 'none';
    }
}

function normalizeCity(city) {
    return city.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .trim();
}

// =========================================
// RENDER FUNCTIONS
// =========================================

async function renderPage() {
    const list = document.getElementById('hotel-list');
    if (!list) return;

    if (filteredHotels.length === 0) {
        list.innerHTML = '<div class="no-result-box" style="text-align: center; padding: 60px 20px; color: #888; font-size: 18px;">Không tìm thấy khách sạn nào phù hợp với yêu cầu của bạn.</div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    let html = '';

    for (let i = start; i < end && i < filteredHotels.length; i++) {
        const hotel = filteredHotels[i];
        const isFav = checkIsFavorite(hotel.id);
        
        // Create hotel card
        let cardHtml = await createHotelCard(hotel, hotel.id, isFav);
        
        // Add distance badge before closing card div
        const distanceBadge = `<div class="distance-badge"><i class="fas fa-map-marker-alt"></i> ${formatDistance(hotel.distance)}</div>`;
        cardHtml = cardHtml.replace('</div>\n    </div>\n    </div>', `${distanceBadge}</div>\n    </div>\n    </div>`);
        
        html += cardHtml;
    }

    list.innerHTML = html;
    updateHeartVisuals();
    setupCardListeners();
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredHotels.length / ITEMS_PER_PAGE);
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    let html = '';
    function addPageButton(p) {
        html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    addPageButton(1);
    if (currentPage > 3) html += `<span class="page-ellipsis">…</span>`;
    if (currentPage > 2 && currentPage < totalPages) addPageButton(currentPage - 1);
    if (currentPage !== 1 && currentPage !== totalPages) addPageButton(currentPage);
    if (currentPage < totalPages - 1) addPageButton(currentPage + 1);
    if (currentPage < totalPages - 2) html += `<span class="page-ellipsis">…</span>`;
    if (totalPages > 1) addPageButton(totalPages);
    
    pagination.innerHTML = html;
    
    pagination.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = Number(btn.dataset.page);
            renderPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// =========================================
// FAVORITES LOGIC
// =========================================

function checkIsFavorite(hotelId) {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return false;
    try {
        const user = JSON.parse(userJson);
        const key = FAV_KEY_PREFIX + user.uid;
        const favsRaw = localStorage.getItem(key);
        const favs = favsRaw ? JSON.parse(favsRaw) : [];
        return favs.includes(String(hotelId));
    } catch (e) {
        return false;
    }
}

function updateHeartVisuals() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const hotelId = btn.closest('.hotel-card')?.dataset.hotelId;
        if (hotelId && checkIsFavorite(hotelId)) {
            btn.classList.add('liked');
            const icon = btn.querySelector('i');
            if (icon) icon.style.color = '#ff4757';
        }
    });
}

function setupCardListeners() {
    // Card click to navigate
    document.querySelectorAll('.hotel-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.favorite-btn')) {
                const url = card.dataset.url;
                if (url) window.location.href = url;
            }
        });
    });

    // Favorite button click
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const hotelId = btn.closest('.hotel-card')?.dataset.hotelId;
            if (hotelId) {
                const isLiked = await toggleFavorite(hotelId);
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.style.color = isLiked ? '#ff4757' : 'rgba(255, 255, 255, 0.9)';
                }
                btn.classList.toggle('liked', isLiked);
            }
        });
    });
}

async function toggleFavorite(hotelId) {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) {
        alert('Vui lòng đăng nhập để lưu yêu thích!');
        return false;
    }
    const user = JSON.parse(userJson);
    const userId = user.uid;
    const key = FAV_KEY_PREFIX + userId;
    let favIds = [];
    try { favIds = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { favIds = []; }
    const strId = String(hotelId);
    let isLiked = false;
    if (favIds.includes(strId)) {
        favIds = favIds.filter(id => id !== strId);
        isLiked = false;
    } else {
        favIds.push(strId);
        isLiked = true;
    }
    try { localStorage.setItem(key, JSON.stringify(favIds)); } catch (e) {}
    try { await setDoc(doc(db, "favorites", userId), { hotels: favIds }); } catch (e) { console.warn("Could not sync favs", e); }
    return isLiked;
}

// =========================================
// SAVE/RESTORE SEARCH STATE
// =========================================

function saveSearchState(state) {
    try {
        sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
        console.log('💾 Search state saved');
    } catch (e) {
        console.error('Failed to save search state:', e);
    }
}

function loadSearchState() {
    try {
        const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
        if (!saved) return null;
        
        const state = JSON.parse(saved);
        
        // Check if state is not too old (1 hour)
        if (Date.now() - state.timestamp > 60 * 60 * 1000) {
            sessionStorage.removeItem(SEARCH_STATE_KEY);
            return null;
        }
        
        return state;
    } catch (e) {
        console.error('Failed to load search state:', e);
        return null;
    }
}

function restoreSearchState(state) {
    if (!state) return;

    console.log('🔄 Restoring search state...');

    // Restore input values
    if (state.params) {
        document.getElementById('location-input').value = state.params.location || '';
        document.getElementById('city-select').value = state.params.city || '';
        document.getElementById('radius-input').value = state.params.radius || 1000;
        document.getElementById('max-price-input').value = state.params.maxPrice || '';
    }

    // Restore results
    if (state.results) {
        filteredHotels = state.results;
        currentPage = 1;
        currentSearchParams = state.params;

        // Update UI
        document.getElementById('results-header').style.display = 'block';
        document.getElementById('results-count').textContent = filteredHotels.length;
        document.getElementById('search-location-name').textContent = state.searchLocation?.name || '';

        // Restore map
        if (state.searchLocation) {
            updateMapMarker(
                state.searchLocation.lat,
                state.searchLocation.lon,
                state.searchLocation.name
            );
            addHotelMarkers(filteredHotels.slice(0, 50));
        }

        // Render results
        renderPage();
    }
}

// =========================================
// INITIALIZATION
// =========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 [Nearby Search] DOMContentLoaded event fired');
    console.log('🔍 [Nearby Search] Checking Leaflet:', typeof L);

    // Load hotels with coordinates from geocoded CSV
    try {
        console.log('📂 [Nearby Search] Loading hotels from CSV...');
        allHotels = await loadHotelsWithCoordinates('hotels_with_coordinates_test.csv');
        console.log(`✅ [Nearby Search] Loaded ${allHotels.length} hotels with coordinates`);
        
        if (allHotels.length > 0) {
            console.log('📋 [Nearby Search] Sample hotel:', allHotels[0]);
        }
        
        // Assign IDs if missing
        allHotels.forEach((hotel, index) => {
            if (hotel.id === undefined || hotel.id === null || hotel.id === '') {
                hotel.id = index;
            }
        });
    } catch (error) {
        console.error('❌ [Nearby Search] Error loading hotels:', error);
        allHotels = [];
    }

    // Initialize map
    console.log('🗺️  [Nearby Search] Initializing map...');
    try {
        initMap();
    } catch (error) {
        console.error('❌ [Nearby Search] Error initializing map:', error);
    }

    // Check if returning from hotel detail page
    const savedState = loadSearchState();
    if (savedState) {
        console.log('🔄 [Nearby Search] Found saved state, restoring...');
        restoreSearchState(savedState);
    } else {
        console.log('ℹ️  [Nearby Search] No saved state found');
    }

    // Setup search button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
        console.log('✅ [Nearby Search] Search button listener added');
    } else {
        console.error('❌ [Nearby Search] Search button not found!');
    }

    // Allow Enter key in inputs
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
    });

    console.log('✅ [Nearby Search] Initialization complete!');
});
