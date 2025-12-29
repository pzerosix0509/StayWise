import { loadMasterHotelsData, translateText } from "./hotels_loader.js";
import { loadInfoPageReviews } from "./reviews_loader.js";

// ============================================================
// 1. IMPORT & CẤU HÌNH FIREBASE
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, 
    query, where, orderBy, deleteDoc, doc, setDoc,
    increment, updateDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyACfhRC94Wt-_q7h1f-1cJjOV06nP9SVag",
    authDomain: "staywise-8d5dd.firebaseapp.com",
    projectId: "staywise-8d5dd",
    storageBucket: "staywise-8d5dd.firebasestorage.app",
    messagingSenderId: "308886745296",
    appId: "1:308886745296:web:a43170c671e27df804aed5",
    measurementId: "G-NZ1VYTTCGY"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================
// 2. BIẾN TOÀN CỤC & HẰNG SỐ
// ============================================================
const USER_STORAGE_KEY = 'currentUser';
const FAV_KEY_PREFIX = "staywise_favorites_"; 
const ITEMS_PER_PAGE = 5;
const EXCHANGE_RATE = 25000; 

let reviewIdToDelete = null;

// Từ điển icon tiện ích
const FACILITIES_MAP = {
    "maylanh": ["Máy lạnh", "bi bi-snow", "Air Conditioning"], 
    "nhahang": ["Nhà hàng", "fas fa-utensils", "Restaurant"],
    "chodeuxe": ["Chỗ đậu xe", "fas fa-parking", "Parking"], 
    "thangmay": ["Thang máy", "fas fa-elevator", "Elevator"],
    "wifi": ["Wifi", "fas fa-wifi", "Wifi"], 
    "hobo": ["Hồ bơi", "fas fa-swimming-pool", "Swimming Pool"],
    "letan24h": ["Lễ tân 24h", "fas fa-concierge-bell", "24h Front Desk"], 
    "spa": ["Spa", "fas fa-spa", "Spa"],
    "phongtap": ["Phòng tập", "fas fa-dumbbell", "Gym"]
};

// ============================================================
// 3. CÁC HÀM TIỆN ÍCH
// ============================================================

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

function getLang() {
    return localStorage.getItem('staywise_lang') || 'vi';
}
// --- HÀM GHI NHẬN LỊCH SỬ XEM (MỚI) ---
// --- HÀM GHI NHẬN LỊCH SỬ XEM (BẢN DEBUG) ---
async function logViewAggregated(hotelId) {
    console.log("🚀 [DEBUG] Bắt đầu chạy hàm lưu lịch sử xem...");

    try {
        // 1. Kiểm tra đăng nhập
        const raw = localStorage.getItem(USER_STORAGE_KEY);
        if (!raw) {
            console.warn("❌ [DEBUG] Dừng lại: Người dùng CHƯA ĐĂNG NHẬP (localStorage trống).");
            return; // Dừng tại đây nếu chưa đăng nhập
        }

        const user = JSON.parse(raw);
        const userId = user.uid;
        if (!userId) {
            console.warn("❌ [DEBUG] Dừng lại: Dữ liệu user bị lỗi (Không có UID).");
            return;
        }

        console.log(`✅ [DEBUG] User hợp lệ: ${userId}. Đang lưu hotel ID: ${hotelId}`);

        const docRef = doc(db, "user_views", userId);
        
        // 2. Đọc dữ liệu cũ
        const snap = await getDoc(docRef);
        let viewedList = [];
        
        if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.viewedList)) {
                viewedList = data.viewedList;
            }
        }

        const strId = String(hotelId);

        // 3. Xử lý mảng (Xóa cũ, thêm mới vào đầu)
        viewedList = viewedList.filter(id => String(id) !== strId);
        viewedList.unshift(strId);

        // Giới hạn 20 item
        if (viewedList.length > 20) {
            viewedList = viewedList.slice(0, 20);
        }

        // 4. Lưu vào Firestore
        await setDoc(docRef, {
            viewedList: viewedList,
            [`views.${strId}`]: increment(1),       
            [`lastViewed.${strId}`]: Date.now(),    
            updatedAt: Date.now()
        }, { merge: true });

        // Xóa cache
        try { localStorage.removeItem(`reco_cache_${userId}`); } catch (e) {}
        
        console.log("🎉 [DEBUG] LƯU THÀNH CÔNG LÊN FIRESTORE!");

    } catch (e) {
        console.error("🔥 [DEBUG] LỖI NGHIÊM TRỌNG:", e);
        if (e.code === 'permission-denied') {
            alert("Lỗi quyền truy cập Firestore! Bạn chưa setup Rule cho phép ghi vào 'user_views'.");
        }
    }
}
function getHotelTypeIcon(type) {
    const key = (type || '').toLowerCase().trim();
    if (key === 'hotel') return '<i class="bi bi-building"></i>';
    if (key === 'apartment') return '<i class="bi bi-house-door"></i>';
    if (key === 'resort') return '<i class="fas fa-umbrella-beach"></i>'; 
    if (key === 'homestay') return '<i class="bi bi-house-heart"></i>';   
    if (key === 'guesthouse') return '<i class="bi bi-person-workspace"></i>';
    if (key.includes('khách sạn')) return '<i class="bi bi-building"></i>';
    return '<i class="bi bi-geo-alt"></i>'; 
}

function formatPrice(priceVND) {
    const curr = localStorage.getItem('staywise_curr') || 'VND';
    if (curr === 'USD') {
        return (priceVND / EXCHANGE_RATE).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    }
    return priceVND.toLocaleString('vi-VN') + ' VND';
}

function getRatingLabel(score) {
    const lang = getLang();
    const s = parseFloat(score);
    if (lang === 'en') {
        if (s >= 9) return 'Excellent';
        if (s >= 8) return 'Great';
        return 'Good';
    } else {
        if (s >= 9) return 'Xuất sắc';
        if (s >= 8) return 'Tuyệt vời';
        return 'Khá tốt';
    }
}

document.querySelector(".copy-link-btn")?.addEventListener("click", () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const msg = getLang() === 'en' ? "Link copied!" : "Đã sao chép liên kết!";
        showBlackToast(msg);
    });
});

// ============================================================
// 4. LOGIC YÊU THÍCH (FAVORITE)
// ============================================================

async function syncFavoritesToCloud(userId, favIds) {
    try {
        await setDoc(doc(db, "favorites", userId), { hotels: favIds });
    } catch (e) {
        console.error("[SYNC ERROR]", e);
    }
}

async function toggleFavorite(hotelId) {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) {
        const loginModal = document.getElementById('login-modal-overlay');
        if (loginModal) loginModal.classList.add('visible');
        showBlackToast(getLang() === 'en' ? "Please login to save favorites!" : "Vui lòng đăng nhập để lưu yêu thích!");
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

    localStorage.setItem(key, JSON.stringify(favIds));
    await syncFavoritesToCloud(userId, favIds);
    return isLiked;
}

function checkIsFavorite(hotelId) {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return false;
    const user = JSON.parse(userJson);
    const key = FAV_KEY_PREFIX + user.uid;
    let favIds = [];
    try { favIds = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { return false; }
    return favIds.includes(String(hotelId));
}

function setupFavoriteButton(currentHotelId) {
    const btn = document.querySelector(".favorite-btn");
    if (!btn) return;

    if (checkIsFavorite(currentHotelId)) btn.classList.add("liked");
    else btn.classList.remove("liked");

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", async function (e) {
        e.stopPropagation();
        const isLiked = await toggleFavorite(currentHotelId);
        const userJson = localStorage.getItem(USER_STORAGE_KEY);
        if (userJson) {
            const lang = getLang();
            if (isLiked) {
                this.classList.add("liked");
                showBlackToast(lang === 'en' ? "Added to favorites ❤️" : "Đã thêm vào yêu thích ❤️");
            } else {
                this.classList.remove("liked");
                showBlackToast(lang === 'en' ? "Removed from favorites 💔" : "Đã bỏ yêu thích 💔");
            }
        }
    });
}

// ============================================================
// 5. HIỂN THỊ CHI TIẾT KHÁCH SẠN (RENDER)
// ============================================================

function normalizeHotelType(rawType) {
    if (!rawType) return 'other';
    const lower = rawType.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
    if (lower.includes('resort') || lower.includes('nghi duong')) return 'resort';
    if (lower.includes('homestay') || lower.includes('home stay')) return 'homestay';
    if (lower.includes('hotel') || lower.includes('khach san')) return 'hotel';
    if (lower.includes('apartment') || lower.includes('can ho') || lower.includes('chung cu')) return 'apartment';
    if (lower.includes('guest') || lower.includes('nha khach') || lower.includes('nha nghi')) return 'guesthouse';
    if (lower.includes('villa') || lower.includes('biet thu')) return 'resort';
    return 'other'; 
}

function translateHotelType(normalizedType) {
    const lang = getLang(); 
    const key = (normalizedType || 'other').toLowerCase().trim();
    const dictionary = {
        'hotel': { vi: "Khách sạn", en: "Hotel" },
        'apartment': { vi: "Căn hộ", en: "Apartment" },
        'resort': { vi: "Khu nghỉ dưỡng", en: "Resort" },
        'homestay': { vi: "Homestay", en: "Homestay" },
        'guesthouse': { vi: "Nhà khách", en: "Guest House" },
        'other': { vi: "Khác", en: "Accommodation" }
    };
    const entry = dictionary[key] || dictionary['other'];
    return lang === 'en' ? entry.en : entry.vi;
}

function displayHotelDetails(hotel) {
    if (!hotel) return;
    const setSafeText = (elementId, textContent) => {
        const el = document.getElementById(elementId);
        if (el) el.innerText = textContent;
    };

    setSafeText("hotel-name", hotel.hotelName);
    setSafeText("hotel-location-text", hotel.location);
    
    const starCount = Math.floor(hotel.star || 0);
    const starVal = (hotel.star || 0).toFixed(1); 
    setSafeText("hotel-rating-text", `${'⭐'.repeat(starCount)} ${starVal}`);
    
    const priceBtn = document.getElementById("hotel-price-btn");
    if (priceBtn) {
        if (hotel.minPrice && hotel.maxPrice && hotel.minPrice !== hotel.maxPrice) {
            priceBtn.innerText = `${formatPrice(hotel.minPrice)} - ${formatPrice(hotel.maxPrice)}`;
        } else {
            priceBtn.innerText = formatPrice(hotel.price || hotel.minPrice || 0);
        }
    }
    
    const typeEl = document.getElementById("hotel-type-text");
    if (typeEl) {
        const standardType = normalizeHotelType(hotel.type);
        const translatedType = translateHotelType(standardType); 
        const iconHtml = getHotelTypeIcon(standardType);
        typeEl.innerHTML = `${iconHtml} ${translatedType}`;
    }
}

function formatPlainText(text) {
    if (!text) return '';
    let cleanedText = text.trim(); 
    cleanedText = cleanedText.replace(/(\\n|\n|\r)/gm, '<br><br>');
    const infoTitle = '<strong>Thông tin chi tiết:</strong><br><br>';
    cleanedText = cleanedText.replace(/Thông tin về/i, infoTitle);
    return cleanedText;
}

async function renderHotelDescription(hotel) {
    const contentDiv = document.getElementById("hotel-description-content");
    const fullContentDiv = document.getElementById("full-description-content");
    const readMoreBtn = document.getElementById("show-full-description");
    const modal = document.getElementById('description-modal-overlay');
    const lang = getLang();
    
    if (!contentDiv) return;

    if (!hotel?.description || hotel.description.trim() === "") {
        contentDiv.innerHTML = `<p>${lang === 'en' ? 'No description available.' : 'Không có mô tả chi tiết.'}</p>`;
        if (readMoreBtn) readMoreBtn.classList.add('hidden');
        return;
    }

    let descriptionToShow = hotel.description.trim();

    if (lang === 'en') {
        contentDiv.innerHTML = `
            <div style="color:#666; font-style:italic; padding:10px 0;">
                <span class="spinner-border spinner-border-sm"></span> Translating...
            </div>`;
        try {
            // Đánh dấu xuống dòng
            let textForApi = descriptionToShow
                .replace(/<br\s*\/?>/gi, " [BR] ") 
                .replace(/(\\n|\n|\r)/gm, " [BR] "); 

            let translated = await translateText(textForApi, 'en');
            let formattedEn = translated.replace(/\[\s*br\s*\]/gi, "<br><br>");

            // Format tiêu đề Details
            formattedEn = formattedEn.replace(
                /Information\s+about.*?(?::|\.)/i, 
                "<br><br><strong>Details:</strong><br><br>"
            );
            
            if (!formattedEn.includes("<strong>Details")) {
                formattedEn = formattedEn.replace(
                    /Information\s+about/i, 
                    "<br><br><strong>Details:</strong><br><br>"
                );
            }
            descriptionToShow = formattedEn;
        } catch (e) {
            console.error("Lỗi dịch:", e);
            descriptionToShow = formatPlainText(descriptionToShow);
        }
    } else {
        descriptionToShow = formatPlainText(descriptionToShow);
    }
    
    contentDiv.innerHTML = descriptionToShow;
    if (fullContentDiv) fullContentDiv.innerHTML = descriptionToShow;

    if (readMoreBtn) {
        readMoreBtn.innerText = lang === 'en' ? "Read more" : "Xem thêm";
        contentDiv.classList.add('collapsed');
        setTimeout(() => {
            const isOverflow = contentDiv.scrollHeight > contentDiv.clientHeight;
            if (isOverflow) readMoreBtn.classList.remove('hidden');
            else {
                contentDiv.classList.remove('collapsed');
                readMoreBtn.classList.add('hidden');
            }
        }, 50);

        readMoreBtn.onclick = () => {
            if (modal) {
                modal.classList.add('visible');
                document.body.style.overflow = 'hidden';
            }
        };
    }

    if (modal) {
        const closeBtn = document.getElementById('description-close-btn') || modal.querySelector('.modal-close-btn');
        const closeModal = () => {
            modal.classList.remove('visible');
            document.body.style.overflow = '';
        };
        if (closeBtn) closeBtn.onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
        });
    }
}

function renderMainFacilities(hotel) {
    const container = document.getElementById("main-facilities-list");
    if (!container || !hotel?.mainFacilities) return;
    
    const lang = getLang();
    const normalizedInput = hotel.mainFacilities.map(s => 
        s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '')
    );

    let html = '';
    for (const key in FACILITIES_MAP) {
        if (normalizedInput.some(f => f.includes(key))) {
            const viName = FACILITIES_MAP[key][0];
            const enName = FACILITIES_MAP[key][2] || viName; 
            const iconClass = FACILITIES_MAP[key][1];
            const displayName = lang === 'en' ? enName : viName;
            
            html += `
                <div class="facility-item">
                    <i class="${iconClass}"></i>
                    <span>${displayName}</span>
                </div>`;
        }
    }
    container.innerHTML = html;
}

// ⭐ [FIXED] Hàm renderGroupedFacilities đã sửa lỗi xuống dòng
async function renderGroupedFacilities(hotel) {
    const groups = ["servicesFacilities", "publicFacilities", "generalFacilities", "roomFacilities"];
    const lang = getLang();

    if (lang === 'en') {
        groups.forEach(key => {
            const container = document.getElementById(key + "-list");
            if (container && hotel[key] && hotel[key].length > 0) {
                container.innerHTML = '<div style="color:#888; font-style:italic;">Translating...</div>';
            }
        });
    }

    const promises = groups.map(async (key) => {
        const container = document.getElementById(key + "-list");
        if (!container || !hotel[key]) return;

        let items = hotel[key].filter(f => f && f.trim().toUpperCase() !== 'OTHER');
        if (items.length === 0) return;

        if (lang === 'en') {
            try {
                // Nối chuỗi để dịch
                const textToTranslate = items.join(" ||| ");
                const translated = await translateText(textToTranslate, 'en');
                
                // [QUAN TRỌNG] Regex linh hoạt để tách chuỗi:
                // Tách khi gặp 1 hoặc nhiều dấu gạch đứng (bắt trường hợp API gộp ||| thành |)
                items = translated.split(/\s*\|+\s*/).map(s => s.trim());
            } catch (e) {
                console.error(`Lỗi dịch nhóm ${key}:`, e);
            }
        }

        container.innerHTML = items.map(f => 
            `<div class="all-facility-item"><span>${f}</span></div>`
        ).join('');
    });

    await Promise.all(promises);
}

function renderAttractions(hotel) {
    const container = document.getElementById("attractions-list");
    if(!container || !hotel?.attractions) return;
    container.innerHTML = hotel.attractions.map(raw => {
        const match = raw.match(/\(([^)]+)\)$/);
        const name = match ? raw.replace(match[0], '').trim() : raw;
        const dist = match ? match[1] : '';
        return name ? `<div class="attraction-card"><span class="attraction-name">${name}</span><span class="attraction-distance">${dist}</span></div>` : '';
    }).join('');
}

// ============================================================
// 6. HỆ THỐNG REVIEW
// ============================================================

function setupReviewTabs() {
    const tabs = document.querySelectorAll('.review-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.review-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.review-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const source = tab.dataset.source; 
            const contentId = source === 'staywise' ? 'staywise-content' : 'other-content';
            const contentDiv = document.getElementById(contentId);
            if(contentDiv) contentDiv.classList.add('active');
        });
    });
}

async function fetchReviewsFromFirestore(hotelId) {
    const reviews = [];
    try {
        const targetId = String(hotelId);
        const q = query(collection(db, "reviews"), where("hotelId", "==", targetId), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((docSnapshot) => { 
            reviews.push({ id: docSnapshot.id, ...docSnapshot.data() }); 
        });
    } catch (error) { console.error("Lỗi tải review:", error); }
    return reviews;
}

async function saveReviewToFirestore(reviewData) {
    try { await addDoc(collection(db, "reviews"), reviewData); return true; } catch (e) { return false; }
}

function updateReviewStats(reviews) {
    const count = reviews.length;
    const avg = count > 0 ? (reviews.reduce((a,b)=>a+parseFloat(b.score),0)/count).toFixed(1) : 0;
    
    const countEl = document.getElementById("staywise-count");
    if(countEl) countEl.innerText = count;
    const totalEl = document.getElementById("review-total-count");
    if(totalEl) totalEl.innerText = count;
    
    if(count > 0) {
        document.getElementById("overall-score").innerText = avg;
        document.getElementById("overall-summary-text-staywise").innerText = getRatingLabel(avg);
    }
}

function updateOtherReviewStats(reviews) {
    const count = reviews.length;
    const avg = count > 0 ? (reviews.reduce((a,b)=>a+parseFloat(b.score),0)/count).toFixed(1) : 0;
    
    const countEl = document.getElementById("other-count");
    if(countEl) countEl.innerText = count;
    const totalEl = document.getElementById("review-total-count-other");
    if(totalEl) totalEl.innerText = count;
    
    if(count > 0) {
        document.getElementById("overall-score-other").innerText = avg;
        document.getElementById("overall-summary-text-other").innerText = getRatingLabel(avg);
    }
}

function createReviewCard(review) {
    const lang = getLang();
    const locale = lang === 'en' ? 'en-US' : 'vi-VN';
    
    let dateDisplay = '';
    if (review.date) {
        const dateObj = new Date(review.date);
        dateDisplay = !isNaN(dateObj) ? dateObj.toLocaleDateString(locale) : review.date;
    }

    const avatar = review.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=random`;
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    const currentUser = userJson ? JSON.parse(userJson) : null;
    
    let deleteBtnHtml = '';
    if (currentUser && review.userId && String(currentUser.uid) === String(review.userId)) {
        const delText = lang === 'en' ? 'Delete' : 'Xóa';
        deleteBtnHtml = `
            <div class="delete-review-btn" data-id="${review.id}" style="
                position: absolute; bottom: 15px; right: 15px; 
                color: #dc3545; cursor: pointer; font-size: 13px; font-weight: 500;
                display: flex; align-items: center; gap: 5px; background: #fff; padding: 2px 5px; border-radius:4px; z-index: 2;">
                <i class="bi bi-trash3-fill"></i> ${delText}
            </div>`;
    }

    let sourceHtml = '';
    if (review.source && review.source.trim() !== '') {
        const label = lang === 'en' ? 'Source' : 'Nguồn';
        sourceHtml = `
            <div class="review-source" style="
                position: absolute; bottom: 12px; right: 15px; font-size: 11px; 
                color: #888; font-style: italic; background-color: #f9f9f9;
                padding: 2px 8px; border-radius: 4px; border: 1px solid #eee;">
                ${label}: <strong>${review.source}</strong>
            </div>`;
    }

    if (deleteBtnHtml !== '') sourceHtml = ''; 

    return `<div class="review-card" style="position: relative; padding-bottom: 45px;">
            <div class="review-header">
                <div class="user-info">
                    <img src="${avatar}" class="user-avatar" alt="${review.userName}">
                    <span class="user-name">${review.userName}</span>
                </div>
                <div class="review-score">
                    <i class="bi bi-star-fill"></i>
                    <span>${review.score}/10</span>
                </div>
            </div>
            <div class="review-meta">
                <span class="review-date">${dateDisplay}</span>
            </div>
            <div class="review-content-text">${review.content}</div>
            ${sourceHtml}     ${deleteBtnHtml}  </div>`;
}

function renderReviews(reviewsArray, listId, paginationId, page = 1, filterScore = 'all') {
    const listContainer = document.getElementById(listId);
    const paginationContainer = document.getElementById(paginationId);
    if (!listContainer) return;

    let filteredReviews = reviewsArray;
    if (filterScore !== 'all') {
        const minScore = parseFloat(filterScore);
        const maxScore = minScore + 1;
        filteredReviews = reviewsArray.filter(r => {
            const score = parseFloat(r.score);
            if (minScore === 9) return score >= 9 && score <= 10;
            return score >= minScore && score < maxScore;
        });
    }

    const lang = getLang();
    if (filteredReviews.length === 0) {
        const msg = lang === 'en' ? 'No reviews found in this score range.' : 'Không tìm thấy đánh giá nào trong khoảng điểm này.';
        listContainer.innerHTML = `<p style="text-align:center; color:#888; padding: 20px;">${msg}</p>`;
        paginationContainer.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const paginated = filteredReviews.slice(start, start + ITEMS_PER_PAGE);
    
    listContainer.innerHTML = paginated.map(createReviewCard).join('');

    let html = '';
    if (totalPages > 1) {
        for(let i=1; i<=totalPages; i++) {
            html += `<button class="page-btn-review ${i===page?'active':''}" data-page="${i}" data-list="${listId}">${i}</button>`;
        }
    }
    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
            const list = this.dataset.list;
            const arr = list === 'staywise-reviews-list' ? window.StaywiseReviews : window.OtherReviews;
            const currentFilter = document.getElementById('review-sort-select')?.value || 'all';
            renderReviews(arr, list, paginationId, parseInt(this.dataset.page), currentFilter);
        });
    });

    if (listId === 'staywise-reviews-list') {
        const deleteButtons = listContainer.querySelectorAll('.delete-review-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                reviewIdToDelete = id; 
                const modal = document.getElementById('delete-confirm-modal');
                if (modal) modal.classList.add('visible');
            });
        });
    }
}

function setupReviewSort() {
    const lang = getLang();
    const labelText = lang === 'en' ? 'Filter by score:' : 'Lọc theo khoảng điểm:';
    const allText = lang === 'en' ? 'All Reviews' : 'Tất cả đánh giá';
    const pointsText = lang === 'en' ? 'points' : 'điểm';

    const sortTargets = [
        { containerId: 'staywise-content', listId: 'staywise-reviews-list', paginationId: 'staywise-pagination', dataSource: 'StaywiseReviews' },
        { containerId: 'other-content', listId: 'other-reviews-list', paginationId: 'other-pagination', dataSource: 'OtherReviews' }
    ];

    let optionsHtml = `<option value="all">${allText}</option>`;
    for (let i = 9; i >= 0; i--) {
        optionsHtml += `<option value="${i}">${i} - ${i + 1} ${pointsText}</option>`;
    }

    sortTargets.forEach(target => {
        const container = document.getElementById(target.containerId);
        if (!container) return;
        if (container.querySelector('.review-sort-container')) return;

        const sortDiv = document.createElement('div');
        sortDiv.className = 'review-sort-container';
        sortDiv.style.marginBottom = '15px';
        sortDiv.style.display = 'flex';
        sortDiv.style.alignItems = 'center';
        sortDiv.style.gap = '10px';

        sortDiv.innerHTML = `
            <label style="font-weight:600; font-size:14px; color:#555;">${labelText}</label>
            <select class="sort-select" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ddd; outline: none; font-size: 14px;">
                ${optionsHtml}
            </select>
        `;

        const listEl = document.getElementById(target.listId);
        if (listEl) container.insertBefore(sortDiv, listEl);

        const selectEl = sortDiv.querySelector('select');
        selectEl.addEventListener('change', function() {
            const selectedRange = this.value;
            const data = window[target.dataSource]; 
            if (data) {
                renderReviews(data, target.listId, target.paginationId, 1, selectedRange);
            }
        });
    });
}

function setupDeleteModalEvents() {
    const modal = document.getElementById('delete-confirm-modal');
    const btnCancel = document.getElementById('btn-cancel-delete');
    const btnConfirm = document.getElementById('btn-confirm-delete');
    if (!modal || !btnCancel || !btnConfirm) return;

    btnCancel.addEventListener('click', () => {
        modal.classList.remove('visible');
        reviewIdToDelete = null;
    });

    btnConfirm.addEventListener('click', async () => {
        if (reviewIdToDelete) {
            modal.classList.remove('visible');
            await executeDeleteReview(reviewIdToDelete);
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
            reviewIdToDelete = null;
        }
    });
}

async function executeDeleteReview(reviewId) {
    const lang = getLang();
    try {
        showBlackToast(lang === 'en' ? "Deleting..." : "⏳ Đang xóa bình luận...");
        await deleteDoc(doc(db, "reviews", reviewId));
        const index = window.StaywiseReviews.findIndex(r => r.id === reviewId);
        if (index > -1) {
            window.StaywiseReviews.splice(index, 1);
        }
        updateReviewStats(window.StaywiseReviews);
        
        const activeBtn = document.querySelector('.page-btn-review.active');
        let currentPage = activeBtn ? parseInt(activeBtn.dataset.page) : 1;
        const currentTotalPages = Math.ceil(window.StaywiseReviews.length / ITEMS_PER_PAGE);
        if (currentPage > currentTotalPages && currentPage > 1) {
            currentPage = currentPage - 1;
        }
        
        renderReviews(window.StaywiseReviews, 'staywise-reviews-list', 'staywise-pagination', currentPage);
        showBlackToast(lang === 'en' ? "Deleted successfully!" : "✅ Đã xóa bình luận thành công!");
    } catch (error) {
        console.error("Lỗi xóa:", error);
        showBlackToast(lang === 'en' ? "Error deleting review." : "❌ Lỗi khi xóa bình luận.");
    }
}

function setupReviewForm(hotelId) {
    const container = document.getElementById('review-form-container');
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    const user = userJson ? JSON.parse(userJson) : null;
    const lang = getLang();

    if (user) {
        container.style.display = 'block';
        const oldForm = document.getElementById('submit-review-form');
        const newForm = oldForm.cloneNode(true);
        oldForm.parentNode.replaceChild(newForm, oldForm);
        const scoreInput = document.getElementById('review-score');
        
        scoreInput.oninput = function() {
            let v = parseFloat(this.value.replace(',', '.'));
            if(!isNaN(v)) { if(v<1) this.value=1; if(v>10) this.value=10; }
        };
        
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = this.querySelector('button[type="submit"]');
            const score = parseFloat(scoreInput.value);
            const content = document.getElementById('review-comment').value.trim();
            
            if (isNaN(score) || score < 1 || score > 10) return showBlackToast(lang === 'en' ? "Invalid score" : "Điểm số không hợp lệ");
            if (content.length < 5) return showBlackToast(lang === 'en' ? "Content too short" : "Nội dung quá ngắn");

            const originalText = btn.innerText;
            btn.innerText = lang === 'en' ? "Sending..." : "Đang gửi...";
            btn.disabled = true;

            const newReview = {
                hotelId: String(hotelId),
                userName: user.name || user.email,
                score: score.toFixed(1),
                content: content,
                date: new Date().toISOString(),
                avatarUrl: user.avatarUrl,
                userId: user.uid
            };
            const success = await saveReviewToFirestore(newReview);
            if (success) {
                window.StaywiseReviews = await fetchReviewsFromFirestore(hotelId);
                updateReviewStats(window.StaywiseReviews);
                renderReviews(window.StaywiseReviews, 'staywise-reviews-list', 'staywise-pagination', 1);
                showBlackToast(lang === 'en' ? "Review submitted!" : "Đánh giá thành công!");
                this.reset();
            } else {
                showBlackToast(lang === 'en' ? "Connection error." : "Lỗi kết nối.");
            }
            btn.innerText = originalText;
            btn.disabled = false;
        });
    } else {
        const msg = lang === 'en' 
            ? 'Please <a href="#" id="trigger-login">Login</a> to review.' 
            : 'Vui lòng <a href="#" id="trigger-login">Đăng nhập</a> để bình luận.';
        container.innerHTML = `<div class="login-prompt-box" style="text-align:center; padding:20px;">${msg}</div>`;
        setTimeout(() => document.getElementById('trigger-login')?.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('login-modal-overlay')?.classList.add('visible'); }), 100);
    }
}

// ============================================================
// 7. GALLERY MODAL (ZOOM & PAN)
// ============================================================

let currentImageIndex = 0;
let imageSources = []; 
const galleryModal = document.getElementById('gallery-modal-overlay');
const modalImage = document.getElementById('modal-main-image');
const prevBtnModal = document.getElementById('gallery-prev-btn');
const nextBtnModal = document.getElementById('gallery-next-btn');
const closeBtnModal = document.getElementById('gallery-close-btn');
const caption = document.getElementById('modal-image-caption');

let currentZoomLevel = 1.0; 
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 4.0;
let imagePosition = { x: 0, y: 0 };

function applyZoom() {
    let transformValue;
    if (currentZoomLevel > MIN_ZOOM) {
        transformValue = `translate(-50%, -50%) translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${currentZoomLevel})`;
        modalImage.style.cursor = 'grab';
    } else {
        imagePosition = { x: 0, y: 0 };
        transformValue = `translate(-50%, -50%) scale(1.0)`;
        modalImage.style.cursor = 'default';
    }
    modalImage.style.transform = transformValue;
}

function handleImageZoom(e) {
    e.preventDefault(); 
    e.stopPropagation();

    const rect = modalImage.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;

    const xPercent = (mouseX - rect.width / 2) / (rect.width / currentZoomLevel);
    const yPercent = (mouseY - rect.height / 2) / (rect.height / currentZoomLevel);

    const oldZoomLevel = currentZoomLevel;
    const direction = Math.sign(e.deltaY); 

    if (direction < 0) {
        currentZoomLevel = Math.min(MAX_ZOOM, currentZoomLevel + ZOOM_STEP);
    } else {
        currentZoomLevel = Math.max(MIN_ZOOM, currentZoomLevel - ZOOM_STEP);
    }

    const zoomDelta = currentZoomLevel - oldZoomLevel;
    if (zoomDelta === 0) return;

    const dx = xPercent * (zoomDelta * rect.width / 2);
    const dy = yPercent * (zoomDelta * rect.height / 2);
    
    if (currentZoomLevel > MIN_ZOOM) {
        imagePosition.x -= dx * 1.5;
        imagePosition.y -= dy * 1.5;
    } else {
        imagePosition = { x: 0, y: 0 };
    }
    applyZoom();
}

function updateModalImage(index) {
    if (imageSources.length === 0) return;
    currentZoomLevel = 1.0; 
    imagePosition = { x: 0, y: 0 };
    applyZoom(); 

    currentImageIndex = (index + imageSources.length) % imageSources.length;
    modalImage.src = imageSources[currentImageIndex];
    
    const txt = getLang() === 'en' ? 'Image' : 'Hình ảnh';
    caption.innerText = `${txt} ${currentImageIndex + 1} / ${imageSources.length}`;
}

function openGalleryModal(startIndex) {
    if (imageSources.length === 0) return;
    currentZoomLevel = 1.0; 
    imagePosition = { x: 0, y: 0 };
    applyZoom();

    updateModalImage(startIndex);
    galleryModal.classList.add('visible');
    document.body.style.overflow = 'hidden'; 
}

function closeGalleryModal() {
    galleryModal.classList.remove('visible');
    document.body.style.overflow = '';
}

function setupGalleryEvents() {
    closeBtnModal?.addEventListener('click', closeGalleryModal);
    prevBtnModal?.addEventListener('click', () => updateModalImage(currentImageIndex - 1));
    nextBtnModal?.addEventListener('click', () => updateModalImage(currentImageIndex + 1));

    modalImage?.addEventListener('wheel', handleImageZoom, { passive: false });
    
    let isDragging = false;
    let startX, startY;

    modalImage?.addEventListener('mousedown', (e) => {
        if (currentZoomLevel > MIN_ZOOM) {
            isDragging = true;
            modalImage.style.cursor = 'grabbing';
            startX = e.clientX;
            startY = e.clientY;
            e.preventDefault(); 
            e.stopPropagation();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        imagePosition.x += dx;
        imagePosition.y += dy;
        startX = e.clientX;
        startY = e.clientY;
        applyZoom();
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            modalImage.style.cursor = 'grab';
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && galleryModal.classList.contains('visible')) {
            closeGalleryModal();
        }
    });
    
    galleryModal?.addEventListener('click', function(e) {
        if (e.target.id === 'gallery-modal-overlay') {
            closeGalleryModal();
        }
    });
}

function initSlider(total) {
    if(total <= 1) return;
    let index = 0;
    const track = document.getElementById("slider-track");
    
    track.querySelectorAll('.slide').forEach((slide, i) => {
        slide.style.cursor = 'pointer'; 
        slide.addEventListener('click', () => openGalleryModal(i));
    });

    const update = () => track.style.transform = `translateX(-${index * 100}%)`;
    document.querySelector(".next-btn")?.addEventListener("click", () => { index = (index + 1) % total; update(); });
    document.querySelector(".prev-btn")?.addEventListener("click", () => { index = (index - 1 + total) % total; update(); });
}

async function loadEmbedLinks() {
    try {
        const response = await fetch('../data/embed_links.json');
        if (!response.ok) return [];
        return await response.json();
    } catch (error) { return []; }
}

// ============================================================
// 8. MAIN LOAD (HÀM CHẠY CHÍNH)
// ============================================================

async function loadPageData() {
    const isInfoPage = document.getElementById("hotel-name");
    if (!isInfoPage) return; 

    console.log("%c🚀 [START] Bắt đầu tải trang chi tiết...", "color: #00ff00; font-weight: bold; font-size: 14px;");

    try {
        setupDeleteModalEvents();

        console.time("⏱️ Thời gian tải data");
        const [hotels, embedLinks, allExternalReviews] = await Promise.all([
            loadMasterHotelsData(), 
            loadEmbedLinks(),
            loadInfoPageReviews() 
        ]);
        console.timeEnd("⏱️ Thời gian tải data");

        console.log(`📦 [DATA] Đã tải: ${hotels.length} khách sạn, ${embedLinks ? embedLinks.length : 0} link maps.`);

        hotels.forEach((hotel, index) => { 
            if (hotel.id === undefined || hotel.id === null) hotel.id = index; 
        });

        const urlParams = new URLSearchParams(window.location.search);
        let rawId = urlParams.get('id'); 
        if (!rawId) rawId = sessionStorage.getItem('activeHotelId');

        console.log(`🆔 [ID CHECK] Raw ID từ URL/Session: "${rawId}"`);

        let hotel = null;
        if (rawId !== null && rawId !== undefined && rawId !== "") {
            const targetId = parseInt(rawId);
            hotel = hotels.find(h => h.id === targetId);
            
            if (hotel) {
                console.log(`✅ [FOUND] Tìm thấy theo ID ${targetId}:`, hotel.hotelName);
            } else {
                console.warn(`⚠️ [NOT FOUND] Không tìm thấy hotel có ID ${targetId}.`);
                if (targetId >= 0 && targetId < hotels.length) {
                    hotel = hotels[targetId];
                    console.log(`🔄 [FALLBACK] Tìm thấy theo Index mảng ${targetId}:`, hotel.hotelName);
                }
            }
        }

        if (!hotel) {
            console.error("❌ [ERROR] Không xác định được khách sạn nào. Load mặc định hotel[0].");
            hotel = hotels[0]; 
        }

        if (hotel) {
            const currentHotelId = hotel.id;
            document.body.dataset.hotelId = currentHotelId;

            displayHotelDetails(hotel);
            renderHotelDescription(hotel); 
            renderMainFacilities(hotel);
            renderAttractions(hotel);
            renderGroupedFacilities(hotel);
            logViewAggregated(currentHotelId);

            // --- [MAP LOGIC] ---
            const mapFrame = document.getElementById("hotel-map-frame");
            console.group("%c🗺️ DEBUG MAP LOGIC", "color: orange; font-size: 12px;");
            
            let linkToUse = "";
            if (embedLinks && Array.isArray(embedLinks) && embedLinks[hotel.id]) {
                linkToUse = embedLinks[hotel.id];
                console.log(`3. Link lấy được theo ID ${hotel.id}:`, linkToUse);
            } else {
                console.warn(`⚠️ Không lấy được link cho ID ${hotel.id}`);
            }
            console.groupEnd();

            if (mapFrame && linkToUse) {
                mapFrame.src = linkToUse;
            }

            setupFavoriteButton(currentHotelId);

            window.StaywiseReviews = await fetchReviewsFromFirestore(currentHotelId);
            
            if (allExternalReviews && Array.isArray(allExternalReviews)) {
                 window.OtherReviews = allExternalReviews.filter(review =>
                    review.hotelName && hotel.hotelName &&
                    review.hotelName.trim().toLowerCase() === hotel.hotelName.trim().toLowerCase()
                );
            } else {
                window.OtherReviews = [];
            }

            console.log(`💬 [REVIEWS] Nội bộ: ${window.StaywiseReviews.length}, Bên ngoài: ${window.OtherReviews.length}`);

            updateReviewStats(window.StaywiseReviews);
            updateOtherReviewStats(window.OtherReviews);
            
            renderReviews(window.StaywiseReviews, 'staywise-reviews-list', 'staywise-pagination');
            renderReviews(window.OtherReviews, 'other-reviews-list', 'other-pagination');
            
            setupReviewTabs();      
            setupReviewSort();      
            setupReviewForm(currentHotelId); 

            // Slider
            const track = document.getElementById("slider-track");
            const images = hotel.images || [];
            
            if (track && images.length > 0) {
                imageSources = images; 
                track.innerHTML = images.map(src => `<div class="slide"><img src="${src}" alt="Hotel Image"></div>`).join("");
                track.style.width = `${images.length * 100}%`;
                initSlider(images.length);
                setupGalleryEvents(); 
            } else {
                const prevBtn = document.querySelector(".prev-btn");
                const nextBtn = document.querySelector(".next-btn");
                if(prevBtn) prevBtn.style.display = "none";
                if(nextBtn) nextBtn.style.display = "none";
            }
        }
    } catch (err) {
        console.error("🔥 [CRITICAL PAGE ERROR]", err);
    }
}
loadPageData();