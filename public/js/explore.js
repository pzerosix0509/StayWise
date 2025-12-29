
import { loadMasterHotelsData } from "./hotels_loader.js"; // Đã sửa tên hàm cho đúng chuẩn
import { createHotelCard } from "./hotel_renderer.js";

// Firebase modular imports
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ----------------------- CONFIG -----------------------
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

// ----------------------- APP STATE -----------------------
let hotels = [];
let originalHotels = [];
let currentPage = 1;
let itemsPerPage = 30;

// Constants & tuning
const EXCHANGE_RATE = 25000;
const FAV_KEY_PREFIX = "staywise_favorites_";
const USER_STORAGE_KEY = "currentUser";

const RECO_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const VIEW_COUNT_CAP = 5;

// ----------------------- UI HELPERS -----------------------
function getLang() {
  return localStorage.getItem('staywise_lang') || 'vi';
}

function showBlackToast(message) {
  let toast = document.getElementById('black-toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'black-toast-notification';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.85)', color: '#fff', padding: '12px 24px',
      borderRadius: '8px', zIndex: '9999', opacity: '0', transition: 'all 0.4s ease',
      pointerEvents: 'none', fontSize: '15px'
    });
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}

// ----------------------- CORE HELPERS (NORMALIZE / UTILS) -----------------------
function normalizeStr(s) {
  if (s === undefined || s === null) return "";
  return String(s).toLowerCase().trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '');
}

function removeAccents(str) {
  if (!str) return '';
  return String(str).normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

function mapRawTypeToId(rawType) {
  const s = normalizeStr(rawType);
  if (!s) return 'other';
  if (s.includes('khach') || s.includes('hotel')) return 'hotel';
  if (s.includes('can ho') || s.includes('apartment') || s.includes('condo')) return 'apartment';
  if (s.includes('resort') || s.includes('nghi duong')) return 'resort';
  if (s.includes('homestay') || s.includes('nha nghi')) return 'homestay';
  if (s.includes('guest house') || s.includes('nha khach')) return 'guesthouse';
  return 'other';
}

function stableHashToInt(s) {
  const str = String(s || '');
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function normalizePrice(v) {
  if (v === undefined || v === null || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

// ----------------------- PRICE HELPERS (FIXED) -----------------------
function getComparePrice(hotel) {
  // Trả về number luôn để tránh NaN ở chỗ tính toán
  return normalizePrice(hotel?.minPrice ?? hotel?.price ?? 0);
}

function getRealPriceFilter(val) {
  if (val === '' || val == null) return null;
  const n = normalizePrice(val);
  if (n === 0 && String(val).trim() !== '0') return null;
  const curr = localStorage.getItem('staywise_curr') || 'VND';
  return curr === 'USD' ? n * EXCHANGE_RATE : n;
}

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.uid || null;
  } catch (e) {
    return null;
  }
}

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

// ----------------------- FIRESTORE: VIEWS (AGGREGATED) with Timestamp handling -----------------------
async function logViewAggregated(hotelId) {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return;
    const userId = JSON.parse(raw).uid;
    if (!userId) return;
    const docRef = doc(db, "user_views", userId);

    try {
      await updateDoc(docRef, {
        [`views.${hotelId}`]: increment(1),
        [`lastViewed.${hotelId}`]: Date.now(),
        updatedAt: Date.now()
      });
    } catch (err) {
      try {
        await setDoc(docRef, {
          views: { [hotelId]: 1 },
          lastViewed: { [hotelId]: Date.now() },
          updatedAt: Date.now()
        });
      } catch (err2) {
        console.warn("logViewAggregated setDoc failed", err2);
      }
    }
    try { localStorage.removeItem(`reco_cache_${userId}`); } catch (e) {}
  } catch (e) {
    console.warn("logViewAggregated failed", e);
  }
}

async function getUserViewsAgg(userId) {
  if (!userId) return { views: {}, lastViewed: {} };
  const cacheKey = `reco_cache_${userId}`;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts < RECO_CACHE_TTL_MS) return parsed.data;
    }
  } catch (e) {}

  try {
    const docRef = doc(db, "user_views", userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      const empty = { views: {}, lastViewed: {} };
      try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: empty })); } catch(e){}
      return empty;
    }
    const data = snap.data();

    // Normalize lastViewed values (may come as server Timestamp)
    const rawLast = data.lastViewed || {};
    const normalLast = {};
    for (const k in rawLast) {
      const v = rawLast[k];
      if (!v) { normalLast[k] = 0; continue; }
      if (typeof v.toMillis === 'function') normalLast[k] = v.toMillis();
      else if (v && v.seconds) normalLast[k] = (v.seconds * 1000) + (v.nanoseconds ? Math.floor(v.nanoseconds/1e6) : 0);
      else normalLast[k] = Number(v) || 0;
    }

    const out = { views: data.views || {}, lastViewed: normalLast };
    try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: out })); } catch(e) {}
    return out;
  } catch (e) {
    console.warn("getUserViewsAgg failed", e);
    return { views: {}, lastViewed: {} };
  }
}

// ----------------------- SCORING: view-based (improvements) -----------------------
function timeDecayScore(lastTs, now = Date.now()) {
  if (!lastTs) return 0;
  let ts = lastTs;
  if (typeof lastTs === 'object') {
    if (typeof lastTs.toMillis === 'function') ts = lastTs.toMillis();
    else if (lastTs.seconds) ts = (lastTs.seconds * 1000) + (lastTs.nanoseconds ? Math.floor(lastTs.nanoseconds/1e6) : 0);
    else ts = Number(lastTs);
  } else {
    ts = Number(lastTs);
  }
  if (!ts || Number.isNaN(ts)) return 0;
  const days = (now - ts) / 86400000;
  const lambda = 0.7;
  return Math.exp(-lambda * days);
}

const WEIGHTS = {
  view: 1.5,
  recency: 1.5,
  favorite: 3,
  star: 1.0,
  rating: 0.5,
  price: 0.5,
  unseen: 1.0,
  jitter: 0.3
};

async function applyRecommendationScores(hotelsArr) {
  const rawUser = localStorage.getItem(USER_STORAGE_KEY);
  let userId = null;
  if (rawUser) {
     try { userId = JSON.parse(rawUser).uid; } catch(e) {}
  }

  let agg = { views: {}, lastViewed: {} };
  if (userId) {
     agg = await getUserViewsAgg(userId);
  }

  const viewMap = agg.views || {};
  const lastMap = agg.lastViewed || {};

  const prices = hotelsArr.map(h => getComparePrice(h));
  const validPrices = prices.filter(p => p > 0);
  const minP = validPrices.length ? Math.min(...validPrices) : 0;
  const maxP = validPrices.length ? Math.max(...validPrices) : 1;
  const priceRange = Math.max(1, maxP - minP);

  const now = Date.now();

  hotelsArr.forEach(h => {
    const hid = String(h.id);
    const rawCount = Number(viewMap[hid] || 0);
    const viewCount = Math.min(rawCount, VIEW_COUNT_CAP);

    const viewScore = viewCount * WEIGHTS.view;
    const decay = timeDecayScore(lastMap[hid], now);
    const recencyScore = decay * WEIGHTS.recency;
    const favScore = checkIsFavorite(h.id) ? WEIGHTS.favorite : 0;

    const starVal = Number(h.star) || 0;
    const ratingVal = Number(h.score) || 0;
    // Normalize star/rating to 0..1 if you expect different scales
    const qualityScore = ((starVal / 5) * WEIGHTS.star) + ((ratingVal / 5) * WEIGHTS.rating);

    const price = getComparePrice(h);
    let normPrice = 0;
    if (price > 0) normPrice = Math.max(0, Math.min(1, (1 - (price - minP) / priceRange)));

    const unseenBoost = rawCount === 0 ? WEIGHTS.unseen : 0;
    const jitter = Math.random() * WEIGHTS.jitter;

    const score = viewScore + recencyScore + favScore + qualityScore + (normPrice * WEIGHTS.price) + unseenBoost + jitter;
    h.recoScore = Number(score.toFixed(6));
  });
}

// ----------------------- FILTER TYPE MATCH -----------------------
function isHotelTypeMatch(hotelTypeDB, filterTypeInput) {
  if (!filterTypeInput) return true;
  const filterCanonical = mapRawTypeToId(filterTypeInput);
  let candidate = '';
  if (!hotelTypeDB && hotelTypeDB !== 0) candidate = '';
  else if (typeof hotelTypeDB === 'string') candidate = hotelTypeDB;
  else if (typeof hotelTypeDB === 'object') {
    candidate = hotelTypeDB.typeId || hotelTypeDB.typeLabel || hotelTypeDB.type || hotelTypeDB.category || '';
  } else candidate = String(hotelTypeDB);
  const hotelCanonical = mapRawTypeToId(candidate);
  return hotelCanonical === filterCanonical;
}

// ----------------------- UI INIT & EVENTS -----------------------

// On page load we also attempt to flush pending favorite syncs and load favorites from cloud
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 [Explore] Init");
  updateItemsPerPage();
  // 1. Load data
  try {
      if (typeof loadMasterHotelsData === 'function') {
          hotels = await loadMasterHotelsData();
      } else {
          const module = await import("./hotels_loader.js");
          hotels = await module.loadMasterHotelsData();
      }
  } catch(e) {
      console.error("Lỗi load data:", e);
      hotels = [];
  }

  hotels.forEach((hotel, index) => {
    if (hotel.id === undefined || hotel.id === null || hotel.id === '') {
      hotel.id = index;
    }
    hotel.typeLabel = hotel.typeLabel || hotel.type || '';
  });
  originalHotels = [...hotels];

  // 2. restore sort/page
  const storedSortType = sessionStorage.getItem('currentSortType');
  const storedPage = sessionStorage.getItem('currentPage');
  const sortSelect = document.getElementById("sortType");
  if (storedSortType && sortSelect) sortSelect.value = storedSortType;
  if (storedPage) currentPage = Number(storedPage);

  // 3. setup filters & restore
  setupFilterEvents();
  restoreFilters();
  checkAndLoadChatbotResults();

  // 4. quick render
  applyCurrentSort();
  renderPage();

  // 5. background: compute recommendation scores
  (async () => {
    try {
      await applyRecommendationScores(hotels);
      const sortSelectEl = document.getElementById('sortType');
      if (!sortSelectEl || sortSelectEl.value === "" || sortSelectEl.value === "recommended") {
        applyCurrentSort();
        renderPage();
      }
    } catch (e) {
      console.warn("Background recompute failed", e);
    }
  })();

  // Try flush pending fav syncs (if any)
  tryFlushPendingFavs();
});

// ----------------------- CHATBOT INTEGRATION (unchanged) -----------------------
function checkAndLoadChatbotResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromChatbot = urlParams.get('from');
  if (fromChatbot === 'chatbot') {
    const savedData = sessionStorage.getItem('chatbotSearchResults');
    if (savedData) {
      try {
        const { hotels: chatbotHotels, criteria, timestamp } = JSON.parse(savedData);
        if (Date.now() - timestamp < 15 * 60 * 1000) {
          console.log(`🤖 Loading ${chatbotHotels.length} hotels from chatbot`);
          const chatbotHotelNames = chatbotHotels.map(h => h.hotelName);
          hotels = originalHotels.filter(h => chatbotHotelNames.includes(h.hotelName));
          applyChatbotFilters(criteria);
          showChatbotResultsBanner(criteria, hotels.length);
          sessionStorage.removeItem('chatbotSearchResults');
          return true;
        }
      } catch (e) {
        console.error('Error loading chatbot results:', e);
      }
    }
  }
  return false;
}

function applyChatbotFilters(criteria) {
  if (criteria.city) {
    const citySelect = document.getElementById('location');
    if (citySelect) citySelect.value = criteria.city;
  }
  const filters = {
    city: criteria.city || '',
    star: criteria.star || '',
    priceMin: criteria.price_min || '',
    priceMax: criteria.price_max || '',
    rating: criteria.min_score || '',
    amenity: criteria.amenity || ''
  };
  // note: appliedFilters is informational; real restore uses filter* session keys
  sessionStorage.setItem('appliedFilters', JSON.stringify(filters));
}

function showChatbotResultsBanner(criteria, count) {
  const container = document.querySelector('.destination-cards') || document.querySelector('main');
  if (!container) return;
  const banner = document.createElement('div');
  banner.className = 'chatbot-results-banner';
  banner.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  `;
  let criteriaText = [];
  if (criteria.city) criteriaText.push(`📍 ${criteria.city}`);
  if (criteria.star) criteriaText.push(`⭐ ${criteria.star} sao`);
  if (criteria.price_min || criteria.price_max) {
    const priceRange = [criteria.price_min, criteria.price_max].filter(Boolean).join(' - ');
    criteriaText.push(`💰 ${priceRange} VNĐ`);
  }
  banner.innerHTML = `
    <div>
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">
        🤖 Kết quả từ Chatbot: ${count} khách sạn
      </div>
      <div style="font-size: 14px; opacity: 0.9;">
        ${criteriaText.join(' • ') || 'Theo gợi ý của bạn'}
      </div>
    </div>
    <button onclick="this.parentElement.remove(); window.location.href='explore.html'" style="
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    ">✕ Xem tất cả</button>
  `;
  container.insertBefore(banner, container.firstChild);
}

// ----------------------- FILTERS SETUP (unchanged except price parse) -----------------------
function setupFilterEvents() {
  const locationInput = document.getElementById("location");
  const stayTypeSelect = document.getElementById("stayType");
  const priceMinInput = document.getElementById("priceMin");
  const priceMaxInput = document.getElementById("priceMax");
  const starRatingSelect = document.getElementById("starRating");
  const applyBtn = document.querySelector(".apply-btn");
  const resetBtn = document.getElementById("resetFilter");
  const mainFacilitiesFilter = document.getElementById("mainFacilitiesFilter");
  const extraFacilitiesFilter = document.getElementById("extraFacilitiesFilter");
  const sortSelect = document.getElementById("sortType");

  function sanitizePriceInput(input) {
    if (!input) return;
    input.addEventListener("input", () => {
      const value = parseFloat(input.value);
      if (value < 0) input.value = 0;
    });
  }
  sanitizePriceInput(priceMinInput);
  sanitizePriceInput(priceMaxInput);

  // --- TÁCH HÀM APPLY CHUNG (reuse cho nút và Enter) ---
  function applyFilters() {
    const rawLocationText = locationInput ? locationInput.value.trim().toLowerCase() : "";
    const searchKeyword = removeAccents(rawLocationText);
    const stayType = stayTypeSelect ? stayTypeSelect.value.trim() : "";
    const rawMin = priceMinInput ? priceMinInput.value.trim() : "";
    const rawMax = priceMaxInput ? priceMaxInput.value.trim() : "";
    const rawStar = starRatingSelect ? starRatingSelect.value.trim() : "";

    const selectedMainFac = getSelectedCheckboxes(mainFacilitiesFilter);
    const selectedExtraFac = getSelectedCheckboxes(extraFacilitiesFilter);

    sessionStorage.setItem('filterLocation', rawLocationText);
    sessionStorage.setItem('filterStayType', stayType);
    sessionStorage.setItem('filterPriceMin', rawMin);
    sessionStorage.setItem('filterPriceMax', rawMax);
    sessionStorage.setItem('filterStarRating', rawStar);
    sessionStorage.setItem('filterMainFac', JSON.stringify(selectedMainFac));
    sessionStorage.setItem('filterExtraFac', JSON.stringify(selectedExtraFac));

    const priceMin = getRealPriceFilter(rawMin) || 0;
    const priceMax = getRealPriceFilter(rawMax) || Infinity;
    const minStar = parseFloat(rawStar) || 0;

    const noFilter = rawLocationText === "" && stayType === "" && rawMin === "" && rawMax === "" && rawStar === "" && selectedMainFac.length === 0 && selectedExtraFac.length === 0;

    if (noFilter) {
      hotels = [...originalHotels];
      ['filterLocation','filterStayType','filterPriceMin','filterPriceMax','filterStarRating','filterMainFac','filterExtraFac'].forEach(k => sessionStorage.removeItem(k));
    } else {
      hotels = originalHotels.filter(h => {
        if (searchKeyword) {
            const hName = removeAccents((h.hotelName || '').toLowerCase());
            const hLocation = removeAccents((h.location || '').toLowerCase());
            const hSearchLoc = removeAccents((h.searchLocation || '').toLowerCase());
            const matchName = hName.includes(searchKeyword);
            const matchLoc = hLocation.includes(searchKeyword) || hSearchLoc.includes(searchKeyword);
            if (!matchName && !matchLoc) return false;
        }

        if (stayType && !isHotelTypeMatch(h, stayType)) return false;
        
        const p = getComparePrice(h);
        if (p < priceMin || p > priceMax) return false;
        if (minStar > 0 && (Number(h.star) || 0) < minStar) return false;

        if (selectedMainFac.length > 0) {
          const hotelMainFac = (h.mainFacilities || []).map(f => String(f).toLowerCase().trim());
          if (!selectedMainFac.every(reqFac => hotelMainFac.some(fac => fac.includes(reqFac)))) return false;
        }

        if (selectedExtraFac.length > 0) {
          const hotelExtraFac = [...(h.servicesFacilities||[]), ...(h.publicFacilities||[]), ...(h.generalFacilities||[]), ...(h.roomFacilities||[])].map(f => String(f).toLowerCase().trim());
          if (!selectedExtraFac.every(reqFac => hotelExtraFac.includes(reqFac))) return false;
        }
        return true;
      });
    }

    applyCurrentSort();
    if (sortSelect) sessionStorage.setItem('currentSortType', sortSelect.value);
    currentPage = 1;
    renderPage();

    (async () => {
      try { await applyRecommendationScores(hotels); } catch(e) {}
    })();
  }

  // --- kết nối nút Apply với hàm chung ---
  if (applyBtn) {
    applyBtn.removeEventListener('click', applyFilters); // safe remove if rebind
    applyBtn.addEventListener("click", applyFilters);
  }

  // --- Thêm handler Enter: trên các input cần thiết ---
  const enterTargets = [locationInput, priceMinInput, priceMaxInput, starRatingSelect];
  enterTargets.forEach(inputEl => {
    if (!inputEl) return;
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); // tránh submit form nếu có
        // chỉ kích hoạt nếu có dữ liệu (tránh apply rỗng khi không cần)
        const hasData = (locationInput && locationInput.value.trim() !== '') ||
                        (priceMinInput && priceMinInput.value.trim() !== '') ||
                        (priceMaxInput && priceMaxInput.value.trim() !== '') ||
                        (starRatingSelect && starRatingSelect.value && starRatingSelect.value !== '');
        if (hasData) applyFilters();
        else {
          // nếu bạn muốn Enter luôn áp dụng (even khi rỗng), bỏ kiểm tra hasData và gọi applyFilters() trực tiếp
        }
      }
    });
  });

  // --- giữ nguyên reset và sort listeners ---
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (locationInput) locationInput.value = "";
      if (stayTypeSelect) stayTypeSelect.value = "";
      if (priceMinInput) priceMinInput.value = "";
      if (priceMaxInput) priceMaxInput.value = "";
      if (starRatingSelect) starRatingSelect.value = "";

      if (mainFacilitiesFilter) mainFacilitiesFilter.querySelectorAll('input[type=\"checkbox\"]').forEach(cb => cb.checked = false);
      if (extraFacilitiesFilter) extraFacilitiesFilter.querySelectorAll('input[type=\"checkbox\"]').forEach(cb => cb.checked = false);

      ['filterLocation','filterStayType','filterPriceMin','filterPriceMax','filterStarRating','filterMainFac','filterExtraFac'].forEach(k => sessionStorage.removeItem(k));
      hotels = [...originalHotels];

      applyCurrentSort();
      currentPage = 1;
      renderPage();

      (async () => {
        try { await applyRecommendationScores(hotels); } catch(e) {}
      })();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      applyCurrentSort();
      sessionStorage.setItem('currentSortType', sortSelect.value);
      currentPage = 1;
      renderPage();
    });
  }
}
function getGridColumns() {
  const width = window.innerWidth;
  
  // Match with explore.css media queries exactly
  if (width <= 480) {
    return 1; // Mobile: 1 column
  } else if (width >= 481 && width <= 768) {
    return 2; // Tablet portrait: 2 columns
  } else if (width >= 769 && width <= 1024) {
    return 3; // Tablet landscape: 3 columns
  } else if (width >= 1025 && width <= 1440) {
    return 3; // Desktop: 3 columns
  } else {
    return 4; // Large desktop (1441px and up): 4 columns
  }
}
function updateItemsPerPage() {
  const columns = getGridColumns();
  const rowsPerPage = 10;
  itemsPerPage = columns * rowsPerPage;
}

function restoreFilters() {
  const locationInput = document.getElementById("location");
  const stayTypeSelect = document.getElementById("stayType");
  const priceMinInput = document.getElementById("priceMin");
  const priceMaxInput = document.getElementById("priceMax");
  const starRatingSelect = document.getElementById("starRating");
  const mainFacilitiesFilter = document.getElementById("mainFacilitiesFilter");
  const extraFacilitiesFilter = document.getElementById("extraFacilitiesFilter");

  const storedLocation = sessionStorage.getItem('filterLocation');
  const storedStayType = sessionStorage.getItem('filterStayType');
  const storedPriceMin = sessionStorage.getItem('filterPriceMin');
  const storedPriceMax = sessionStorage.getItem('filterPriceMax');
  const storedStarRating = sessionStorage.getItem('filterStarRating');
  const storedMainFacRaw = sessionStorage.getItem('filterMainFac');
  const storedExtraFacRaw = sessionStorage.getItem('filterExtraFac');

  const hasStoredFilter = storedLocation || storedStayType || storedPriceMin || storedPriceMax || storedStarRating || storedMainFacRaw || storedExtraFacRaw;

  if (!hasStoredFilter) return;
  const applyBtn = document.querySelector('.apply-btn');
  if (!applyBtn) return;

  if (storedLocation && locationInput) locationInput.value = storedLocation;
  if (storedStayType && stayTypeSelect) stayTypeSelect.value = storedStayType;
  if (storedPriceMin && priceMinInput) priceMinInput.value = storedPriceMin;
  if (storedPriceMax && priceMaxInput) priceMaxInput.value = storedPriceMax;
  if (storedStarRating && starRatingSelect) starRatingSelect.value = storedStarRating;

  if (storedMainFacRaw && mainFacilitiesFilter) setCheckboxesState(mainFacilitiesFilter, JSON.parse(storedMainFacRaw));
  if (storedExtraFacRaw && extraFacilitiesFilter) setCheckboxesState(extraFacilitiesFilter, JSON.parse(storedExtraFacRaw));

  applyBtn.click();
}

function getSelectedCheckboxes(container) {
  if (!container) return [];
  const out = [];
  container.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => out.push(cb.value.toLowerCase().trim()));
  return out;
}

function setCheckboxesState(container, valuesArray) {
  if (!container) return;
  const normalized = (valuesArray || []).map(v => String(v).toLowerCase().trim());
  container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    const val = checkbox.value.toLowerCase().trim();
    checkbox.checked = normalized.includes(val);
  });
}

// ----------------------- SORTING -----------------------
function applyCurrentSort() {
  const sortSelect = document.getElementById("sortType");
  const type = sortSelect ? sortSelect.value : "recommended";

  if (type === "" || type === "recommended") {
    if (hotels.length > 0 && hotels[0].recoScore !== undefined) {
      hotels.sort((a, b) => (b.recoScore || 0) - (a.recoScore || 0));
    } else {
      hotels.sort((a, b) => {
         const scoreA = (Number(a.star)||0) + (Number(a.score)||0)/2;
         const scoreB = (Number(b.star)||0) + (Number(b.score)||0)/2;
         return scoreB - scoreA; 
      });
    }
    return;
  }

  hotels.sort((a, b) => {
    const pa = getComparePrice(a);
    const pb = getComparePrice(b);
    switch (type) {
      case "priceAsc": 
        return pa - pb || String(a.hotelName || '').localeCompare(b.hotelName || '');
      case "priceDesc": 
        return pb - pa || String(a.hotelName || '').localeCompare(b.hotelName || '');
      case "nameAsc": 
        return String(a.hotelName || '').localeCompare(b.hotelName || '');
      case "nameDesc": 
        return String(b.hotelName || '').localeCompare(a.hotelName || '');
      case "starDesc": 
        return (Number(b.star) || 0) - (Number(a.star) || 0) || (Number(b.score)||0) - (Number(a.score)||0);
      default: 
        return 0;
    }
  });
}

// ----------------------- RENDER & LISTENERS -----------------------
export function setupCardListeners() {
  const list = document.getElementById("hotel-list");
  if (!list) return;

  // 1. Click vào Card để xem chi tiết
  const cards = list.querySelectorAll(".hotel-card");
  cards.forEach(card => {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".favorite-btn")) return;
      const hotelId = this.dataset.hotelId;
      const detailUrl = this.dataset.url;
      const sortSelect = document.getElementById("sortType");
      sessionStorage.setItem('currentSortType', sortSelect?.value || "");
      sessionStorage.setItem('currentPage', currentPage || 1);
      sessionStorage.setItem('activeHotelId', hotelId);
      if (detailUrl) {
        try { sessionStorage.setItem('view_candidate', JSON.stringify({ hotelId, ts: Date.now(), url: detailUrl })); } catch(e){}
        window.location.href = detailUrl;
      } else {
        setTimeout(() => logViewAggregated(hotelId), 2000);
      }
    });
  });

  // 2. Click vào nút Tim (Yêu thích)
  const favButtons = list.querySelectorAll(".favorite-btn");
  favButtons.forEach(btn => {
    btn.addEventListener("click", async function (e) {
      e.stopPropagation();
      e.preventDefault();

      const userJson = localStorage.getItem(USER_STORAGE_KEY);
      if (!userJson) {
         showBlackToast(getLang() === 'en' ? "Please login to save favorites!" : "Vui lòng đăng nhập để lưu yêu thích!");
         return;
      }

      const isCurrentlyLiked = this.classList.contains("liked");
      const nextState = !isCurrentlyLiked;
      this.classList.toggle("liked", nextState);
      const icon = this.querySelector('i, svg, .icon');
      if (icon) {
          const tag = icon.tagName ? icon.tagName.toLowerCase() : '';
          if (tag === 'svg') icon.style.fill = nextState ? '#ff4757' : 'rgba(255, 255, 255, 0.8)';
          else icon.style.color = nextState ? '#ff4757' : 'rgba(255, 255, 255, 0.8)';
          icon.style.transition = "transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
          icon.style.transform = "scale(1.4)";
          setTimeout(() => { icon.style.transform = "scale(1)"; }, 200);
      }

      const card = this.closest(".hotel-card");
      const hotelId = card?.dataset.hotelId;

      const finalState = await toggleFavorite(hotelId);
      const lang = getLang();
      if (finalState) showBlackToast(lang === 'en' ? "Added to favorites ❤️" : "Đã thêm vào yêu thích ❤️");
      else showBlackToast(lang === 'en' ? "Removed from favorites 💔" : "Đã bỏ yêu thích 💔");

      (async () => { try { await applyRecommendationScores(hotels); } catch (err) {} })();
    });
  });
}

function updateHeartVisuals() {
  document.querySelectorAll('#hotel-list .hotel-card').forEach(card => {
    const btn = card.querySelector('.favorite-btn');
    const hotelId = card.dataset.hotelId;
    if (!btn) return;
    const isFav = checkIsFavorite(hotelId);
    btn.classList.toggle('liked', isFav);
    const icon = btn.querySelector('i, svg, .icon');
    if (icon) {
        const tag = icon.tagName ? icon.tagName.toLowerCase() : '';
        if (tag === 'svg') icon.style.fill = isFav ? '#ff4757' : 'rgba(255, 255, 255, 0.8)';
        else icon.style.color = isFav ? '#ff4757' : 'rgba(255, 255, 255, 0.8)';
    }
  });
}

// ----------------------- RENDER PAGE & PAGINATION -----------------------
async function renderPage(activeId = null) {
  const list = document.getElementById("hotel-list");
  if (!list) return;
  if (hotels.length === 0) {
    list.innerHTML = `<div class="no-result-box">Không có kết quả phù hợp với yêu cầu của bạn.</div>`;
    const pagination = document.getElementById("pagination");
    if (pagination) pagination.innerHTML = "";
    return;
  }
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  let html = "";
  for (let i = start; i < end && i < hotels.length; i++) {
    const hotelData = { ...hotels[i] };
    const rawType = hotelData.typeLabel || hotelData.type || "";
    hotelData.type = mapRawTypeToId(rawType);
    const isFav = checkIsFavorite(hotelData.id);
    html += await createHotelCard(hotelData, hotelData.id, isFav);
  }
  list.innerHTML = html;
  updateHeartVisuals();
  setupCardListeners();
  if (activeId !== null) {
    const activeCard = document.querySelector(`.hotel-card[data-hotel-id="${activeId}"]`);
    if (activeCard) activeCard.classList.add("active");
  }
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(hotels.length / itemsPerPage);
  const pagination = document.getElementById("pagination");
  if (!pagination) return;
  let html = "";
  function addPageButton(p) {
    html += `<button class="page-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
  }
  addPageButton(1);
  if (currentPage > 3) html += `<span class="page-ellipsis">…</span>`;
  if (currentPage > 2 && currentPage < totalPages) addPageButton(currentPage - 1);
  if (currentPage !== 1 && currentPage !== totalPages) addPageButton(currentPage);
  if (currentPage < totalPages - 1) addPageButton(currentPage + 1);
  if (currentPage < totalPages - 2) html += `<span class="page-ellipsis">…</span>`;
  if (totalPages > 1) addPageButton(totalPages);
  pagination.innerHTML = html;
  pagination.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      renderPage();
    });
  });
}

// ----------------------- FAVORITES SYNC (improved) -----------------------
async function syncFavoritesToCloud(userId, favIds) {
  try {
    await setDoc(doc(db, "favorites", userId), { hotels: favIds, updatedAt: Date.now() }, { merge: true });
    return true;
  } catch (e) {
    console.error("SYNC ERROR:", e);
    queuePendingFavSync(userId, favIds);
    return false;
  }
}

function queuePendingFavSync(userId, favIds) {
  try {
    const key = `pending_fav_sync_${userId}`;
    localStorage.setItem(key, JSON.stringify({ favIds, ts: Date.now() }));
  } catch (e) { console.warn('queuePendingFavSync failed', e); }
}

async function tryFlushPendingFavs() {
  const userId = getCurrentUserId();
  if (!userId) return;
  const key = `pending_fav_sync_${userId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return;
  try {
    const { favIds } = JSON.parse(raw);
    await setDoc(doc(db, "favorites", userId), { hotels: favIds, updatedAt: Date.now() }, { merge: true });
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('flush pending favs failed', e);
  }
}

window.addEventListener('online', tryFlushPendingFavs);

async function loadFavoritesFromCloudAndApply(userId) {
  if (!userId) return [];
  try {
    const docRef = doc(db, "favorites", userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return [];
    const data = snap.data();
    const favs = Array.isArray(data.hotels) ? data.hotels.map(String) : [];
    try { localStorage.setItem(FAV_KEY_PREFIX + userId, JSON.stringify(favs)); } catch(e){}
    updateHeartVisuals();
    return favs;
  } catch (e) {
    console.warn('loadFavoritesFromCloud failed', e);
    return [];
  }
}

async function toggleFavorite(hotelId) {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  if (!userJson) return false;
  const user = JSON.parse(userJson);
  const userId = user.uid;
  const key = FAV_KEY_PREFIX + userId;
  let favIds = [];
  try { favIds = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { favIds = []; }
  const strId = String(hotelId);
  const willLike = !favIds.includes(strId);
  if (willLike) favIds.push(strId); else favIds = favIds.filter(id => id !== strId);
  try { localStorage.setItem(key, JSON.stringify(favIds)); } catch (e) {}
  const ok = await syncFavoritesToCloud(userId, favIds);
  if (!ok) {
    // already queued in syncFavoritesToCloud
    return willLike;
  }
  return willLike;
}

// ----------------------- COMMENTS (basic Firestore-backed) -----------------------
// Schema: collection 'hotel_comments', each doc: { hotelId, authorId, authorName, text, createdAt }

async function postComment(hotelId, authorId, authorName, text) {
  if (!hotelId || !authorId || !text) throw new Error('invalid');
  try {
    const colRef = collection(db, 'hotel_comments');
    const docRef = await addDoc(colRef, {
      hotelId: String(hotelId),
      authorId: String(authorId),
      authorName: authorName || '',
      text: String(text),
      createdAt: Date.now()
    });
    return { id: docRef.id };
  } catch (e) {
    console.error('postComment failed', e);
    throw e;
  }
}

async function loadCommentsForHotel(hotelId, limit = 50) {
  if (!hotelId) return [];
  try {
    const colRef = collection(db, 'hotel_comments');
    const q = query(colRef, where('hotelId', '==', String(hotelId)), orderBy('createdAt', 'desc'));
    const snaps = await getDocs(q);
    const out = [];
    snaps.forEach(s => out.push({ id: s.id, ...s.data() }));
    return out.slice(0, limit);
  } catch (e) {
    console.warn('loadCommentsForHotel failed', e);
    return [];
  }
}

// ----------------------- EXPORTS (optional) -----------------------
export {
  getComparePrice,
  applyRecommendationScores,
  toggleFavorite,
  loadFavoritesFromCloudAndApply,
  postComment,
  loadCommentsForHotel
};
  let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const oldItemsPerPage = itemsPerPage;
    updateItemsPerPage();
    
    // Only re-render if items per page changed
    if (oldItemsPerPage !== itemsPerPage) {
      console.log(` Window resized: ${oldItemsPerPage}  ${itemsPerPage} items per page`);
      currentPage = 1; // Reset to first page
      renderPage();
    }
  }, 250); // Debounce 250ms
});
// ----------------------- END -----------------------
