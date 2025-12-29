// js/hotel_renderer.js

// Tỷ giá quy đổi (Giả định: 1 USD = 25,000 VND)
const EXCHANGE_RATE = 25000;

// ============================================================
// 1. TỪ ĐIỂN DỊCH THUẬT (STATIC TEXT)
// ============================================================
const RENDER_TEXT = {
    vi: {
        nightInfo: "1 đêm, 1 người lớn",
        avgScore: "Điểm trung bình:",
        reviews: "đánh giá",
        rank: "Hạng",
        taxFee: "Đã bao gồm thuế và phí",
        types: {
            hotel: "Khách sạn",
            apartment: "Căn hộ",
            resort: "Khu nghỉ dưỡng",
            homestay: "Homestay",
            guesthouse: "Nhà khách",
            other: "Khác"
        }
    },
    en: {
        nightInfo: "1 night, 1 adult",
        avgScore: "Average Score:",
        reviews: "reviews",
        rank: "No.",
        taxFee: "Includes taxes and fees",
        types: {
            hotel: "Hotel",
            apartment: "Apartment",
            resort: "Resort",
            homestay: "Homestay",
            guesthouse: "Guest House",
            other: "Other"
        }
    }
};

// Hàm lấy ngôn ngữ hiện tại
function getLang() {
    return localStorage.getItem('staywise_lang') || 'vi';
}

// Hàm dịch Loại hình khách sạn (Chuẩn hóa song ngữ)
function translateHotelType(typeId) {
    const lang = getLang();
    const key = (typeId || 'other').toLowerCase().trim();
    return RENDER_TEXT[lang].types[key] || RENDER_TEXT[lang].types['other'];
}

function getHotelTypeIcon(typeId) {
    const key = (typeId || '').toLowerCase().trim();
    if (key === 'hotel') return '<i class="bi bi-building"></i>';
    if (key === 'apartment') return '<i class="bi bi-house-door"></i>';
    if (key === 'resort') return '<i class="fas fa-umbrella-beach"></i>'; 
    if (key === 'homestay') return '<i class="bi bi-house-heart"></i>';
    if (key === 'guesthouse') return '<i class="bi bi-person-workspace"></i>';
    return '<i class="bi bi-geo-alt"></i>'; 
}

// Hàm format giá tiền (Chỉ nhận số và trả về chuỗi tiền tệ)
function formatCurrencyValue(value) {
    const currentCurr = localStorage.getItem('staywise_curr') || 'VND';
    
    if (currentCurr === 'USD') {
        const priceUSD = value / EXCHANGE_RATE;
        return priceUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    } else {
        return parseInt(value).toLocaleString('vi-VN') + ' VND';
    }
}

// ⭐ HÀM XỬ LÝ KHOẢNG GIÁ (Logic Mới) ⭐
function getPriceDisplay(hotel) {
    // Ưu tiên lấy minPrice/maxPrice từ dữ liệu mới, nếu không có thì fallback về price cũ
    const min = hotel.minPrice || hotel.price || 0;
    const max = hotel.maxPrice || 0;

    // Nếu có khoảng giá hợp lệ (Max > Min)
    if (max > min) {
        // Trả về chuỗi dạng "500.000 VND - 1.200.000 VND"
        return `${formatCurrencyValue(min)} - ${formatCurrencyValue(max)}`;
    } else {
        // Chỉ hiển thị 1 giá
        return formatCurrencyValue(min);
    }
}

function normalizeHotelType(rawType) {
    if (!rawType) return 'other';
    
    // Chuyển về chữ thường, bỏ khoảng trắng và bỏ dấu tiếng Việt
    const lower = rawType.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 

    if (lower.includes('resort') || lower.includes('nghi duong')) return 'resort';
    if (lower.includes('homestay') || lower.includes('home stay')) return 'homestay';
    if (lower.includes('hotel') || lower.includes('khach san')) return 'hotel';
    if (lower.includes('apartment') || lower.includes('can ho') || lower.includes('chung cu')) return 'apartment';
    if (lower.includes('guest') || lower.includes('nha khach') || lower.includes('nha nghi')) return 'guesthouse';
    if (lower.includes('villa') || lower.includes('biet thu')) return 'resort';

    return 'other'; 
}
// ============================================================
// 2. RENDER CARD DỌC (Trang Home/Explore)
// ============================================================
export async function createHotelCard(hotel, uniqueId, isFavorite = false) {
    const lang = getLang();
    const txt = RENDER_TEXT[lang];

    // [FIX] Chuẩn hóa loại hình (type) trước để đảm bảo Icon và Dịch thuật đúng
    const standardType = normalizeHotelType(hotel.type); 

    const typeIcon = getHotelTypeIcon(standardType);
    const typeTranslated = translateHotelType(standardType); 
    const detailUrl = `information_page.html?id=${uniqueId}`; 
    
    // [LOGIC GIỮ NGUYÊN] CHỈ HIỂN THỊ MIN PRICE
    const priceValue = hotel.minPrice || hotel.price || 0;
    const displayPrice = formatCurrencyValue(priceValue);

    let starsHtml = '';
    const starCount = Math.floor(hotel.star || 0);
    for(let i=0; i < starCount; i++) {
        starsHtml += '<i class="fas fa-star text-warning" style="font-size: 12px;"></i>';
    }

    // Logic hiển thị Badge "Gợi ý tốt"
    const badgeHtml = (hotel.recoScore && hotel.recoScore > 20) 
        ? `<span class="badge-recommend" style="position: absolute; top: 10px; left: 10px; background: #ff7a18; color: white; padding: 4px 8px; font-size: 10px; border-radius: 4px; font-weight: bold; z-index: 5;">${lang === 'vi' ? 'Gợi ý tốt' : 'Recommended'}</span>` 
        : '';

    const heartColor = isFavorite ? '#ff4757' : 'rgba(255, 255, 255, 0.9)'; 
    const activeClass = isFavorite ? 'liked' : '';

    return `
    <div class="hotel-card" data-hotel-id="${uniqueId}" data-url="${detailUrl}" style="cursor: pointer; display: flex; flex-direction: column; height: 100%;">
        
        <div class="image-wrapper" style="position: relative; height: 180px; flex-shrink: 0;">
            <img src="${hotel.imageUrl || '../assets/images/default-hotel.jpg'}" alt="${hotel.hotelName}" loading="lazy" 
                 style="width: 100%; height: 100%; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px;">
            
            <button class="favorite-btn ${activeClass}" 
                    style="position: absolute; top: 10px; right: 10px; z-index: 10; 
                           background: transparent; box-shadow: none; border: none; padding: 0;
                           display: flex; align-items: center; justify-content: center; 
                           cursor: pointer; transition: transform 0.2s;">
                
                <i class="fas fa-heart" 
                   style="color: ${heartColor}; font-size: 24px; transition: color 0.2s; 
                          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));"></i>
            </button>
            
            ${badgeHtml}
        </div>

        <div class="card-content" style="padding: 15px; flex-grow: 1; display: flex; flex-direction: column;">
            
            <h3 class="hotel-name" style="
                font-size: 16px; margin: 0 0 5px 0; font-weight: 700; line-height: 1.4;
                min-height: 44px; display: -webkit-box; -webkit-line-clamp: 2;
                -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;
            ">${hotel.hotelName}</h3>
            
            <div class="location" style="color: #666; font-size: 13px; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <i class="fas fa-map-marker-alt"></i> ${hotel.searchLocation}
            </div>
            
            <div class="rating" style="margin-bottom: 5px;">
                ${starsHtml}
            </div>

            <div class="type" style="font-size: 13px; color: #555;">
                ${typeIcon} ${typeTranslated}
            </div>

            <div class="price-section" style="margin-top: auto; text-align: right; padding-top: 10px; border-top: 1px solid #f0f0f0;">
                <div style="font-size: 11px; color: #888;">${txt.nightInfo}</div>
                <div class="price-number" style="font-size: 18px; font-weight: 700; color: #3498db; white-space: nowrap;">${displayPrice}</div>
                <div class="tax-info" style="font-size: 11px; color: #999;">${txt.taxFee}</div>
            </div>
        </div>
    </div>
    `;
}

// ============================================================
// 3. RENDER CARD NGANG (Trang Top Reviews)
// ============================================================
export function createHorizontalHotelCard(hotel, uniqueId, rank, isFavorite = false) {
    const lang = getLang();
    const txt = RENDER_TEXT[lang];

    // 1. Xử lý Sao
    const starCount = Math.floor(hotel.star || 0);
    const starHTML = '<i class="fas fa-star text-warning" style="font-size: 12px;"></i>'.repeat(starCount);

    // 2. Xử lý Loại hình (Chuẩn hóa -> Icon -> Dịch)
    const standardType = normalizeHotelType(hotel.type); 
    const typeIcon = getHotelTypeIcon(standardType);
    const typeTranslated = translateHotelType(standardType);
    
    // 3. URL chi tiết
    const detailUrl = `information_page.html?id=${uniqueId}`;

    // 4. Xử lý Điểm số
    let scoreVal = parseFloat(hotel.score);
    if (isNaN(scoreVal)) scoreVal = 0.0;
    const scoreFormatted = scoreVal.toFixed(1);
    const reviewCount = hotel.numberRating || 0;

    // 5. Xử lý Giá (Price)
    const min = hotel.minPrice || hotel.price || 0;
    const max = hotel.maxPrice || 0;
    let priceHtml = '';
    
    // Màu chủ đạo: Xanh dương (#3498db)
    const priceColor = '#3498db'; 

    if (max > min) {
        // --- KHOẢNG GIÁ (Min ~ Max) ---
        const minStr = formatCurrencyValue(min);
        const maxStr = formatCurrencyValue(max);
        
        priceHtml = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.2;">
                <span style="font-size: 15px; font-weight: 700; color: ${priceColor};">${minStr}</span>
                <span style="font-size: 16px; color: ${priceColor}; font-weight: 400; margin: 2px 0;">~</span>
                <span style="font-size: 15px; font-weight: 700; color: ${priceColor};">${maxStr}</span>
            </div>
        `;
    } else {
        // --- GIÁ ĐƠN LẺ ---
        priceHtml = `<span style="font-size: 18px; font-weight: 700; color: ${priceColor};">${formatCurrencyValue(min)}</span>`;
    }

    // 6. Xử lý Tim (Yêu thích)
    const heartColor = isFavorite ? '#ff4757' : 'rgba(255, 255, 255, 0.9)';
    const activeClass = isFavorite ? 'liked' : '';

    return `
    <div class="hotel-card hotel-card-top-style hotel-card-minimal-600"
         data-hotel-id="${uniqueId}"
         data-rank="${rank}"
         data-url="${detailUrl}"
         style="display: flex; gap: 0; text-decoration: none; color: inherit; border: 1px solid #eee; border-radius: 12px; padding: 15px; margin-bottom: 15px; background: #fff; cursor: pointer; transition: box-shadow 0.2s; position: relative; min-height: 150px;">

        <div class="card-media-col" style="position: relative; width: 30%; flex-shrink: 0; padding-right: 15px;">
            <div class="rank-badge" style="position: absolute; top: 0; left: 0; background: #ff4757; color: white; padding: 4px 10px; border-radius: 8px 0 8px 0; font-size: 12px; font-weight: bold; z-index: 2; box-shadow: 2px 2px 5px rgba(0,0,0,0.2);">
                ${txt.rank} ${rank}
            </div>

            <img src="${hotel.imageUrl || '../assets/images/default-hotel.jpg'}" alt="${hotel.hotelName}" class="main-hotel-image"
                 style="width: 100%; height: 100%; min-height: 150px; object-fit: cover; border-radius: 8px;" loading="lazy">

            <button class="favorite-btn ${activeClass}"
                    style="position: absolute; top: 10px; right: 25px; background: transparent; border: none; padding: 0; cursor: pointer; z-index: 5;">
                <i class="fas fa-heart" style="color: ${heartColor}; font-size: 22px; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4)); transition: color 0.2s;"></i>
            </button>
        </div>

        <div class="card-content-wrapper" style="width: 70%; display: flex; gap: 0;">
            <div class="card-info-col" style="width: 57%; flex-shrink: 0; display: flex; flex-direction: column; justify-content: flex-start; overflow: hidden; padding-right: 15px;">
                <h3 class="hotel-name" style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; line-height: 1.3; color: #333;
                    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${hotel.hotelName}
                </h3>

                <div class="hotel-details" style="font-size: 13px; color: #666; margin-bottom: 8px;">
                    <p class="type-line" style="margin: 0 0 5px 0; display: flex; align-items: center; gap: 6px;">
                        ${typeIcon} <span>${typeTranslated}</span> <span style="color: #ddd;">|</span> ${starHTML}
                    </p>
                    <p class="location-line" style="margin: 0 0 8px 0; font-size: 12px; color: #888; display: flex; align-items: center; gap: 4px;">
                        <i class="fas fa-map-marker-alt"></i> <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${hotel.searchLocation}</span>
                    </p>
                    <div class="review-score-line" style="display: flex; align-items: center; gap: 8px;">
                        <div style="background: #003580; color: white; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 14px;">
                            ${scoreFormatted}
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            <span class="review-count-display">(${reviewCount.toLocaleString()} ${txt.reviews})</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-price-col" style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 43%; flex-shrink: 0; border-left: 1px solid #f0f0f0; padding-left: 15px;">
                <p class="price-condition" style="font-size: 11px; color: #888; margin: 0 0 6px 0;">${txt.nightInfo}</p>

                <div class="final-price-wrapper">
                    ${priceHtml}
                </div>

                <p class="tax-fee-note" style="font-size: 10px; color: #999; margin: 6px 0 0 0;">
                    ${txt.taxFee}
                </p>
            </div>
        </div>

    </div>
    `;
}
