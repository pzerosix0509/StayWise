// js/top_reviews.js

// [FIX 1] Import loadMasterHotelsData để đảm bảo ID đồng bộ với trang chi tiết
import { loadMasterHotelsData } from "./hotels_loader.js"; 
import { createHorizontalHotelCard } from "./hotel_renderer.js";
import { loadReviewsByCity } from "./reviews_loader.js";

// ⭐ DANH SÁCH ĐỊA ĐIỂM ⭐
const POPULAR_LOCATIONS = [
    { name: "Hà Nội", image: "https://asiatravel.net.vn/img_23/images/dia-diem-du-lich-o-ha-noi-1.jpg", searchKey: "Hà Nội" },
    { name: "Đà Nẵng", image: "https://cdn3.ivivu.com/2022/07/Gi%E1%BB%9Bi-thi%E1%BB%87u-du-l%E1%BB%8Bch-%C4%90%C3%A0-N%E1%BA%B5ng-ivivu-1-e1743500641858.jpg", searchKey: "Đà Nẵng" },
    { name: "TP Hồ Chí Minh", image: "https://bcp.cdnchinhphu.vn/thumb_w/777/334894974524682240/2025/6/30/tphcm-1-1751245519173693919081.jpg", searchKey: "Hồ Chí Minh" },
    { name: "Đà Lạt", image: "https://samtenhills.vn/wp-content/uploads/2024/11/kinh-nghiem-du-lich-da-lat-1-minh.jpg", searchKey: "Đà Lạt" },
    { name: "Phú Quốc", image: "https://thoibaotaichinhvietnam.vn/stores/news_dataimages/2024/102024/18/14/phu-quoc20241018144932.1152350.jpg", searchKey: "Phú Quốc" },
    { name: "Nha Trang", image: "https://xaviahotel.com/vnt_upload/news/11_2017/nha-trang_1.jpg", searchKey: "Nha Trang" },
    { name: "Hội An", image: "https://daivietourist.vn/wp-content/uploads/2025/05/gioi-thieu-ve-pho-co-hoi-an-14.jpg", searchKey: "Hội An" },
    { name: "Vũng Tàu", image: "https://vandungcar.vn/wp-content/uploads/2023/10/trai-nghiem-thanh-pho-bien-vung-tau-2-1.jpg", searchKey: "Vũng Tàu" },
    { name: "Sapa", image: "https://sapanomad.com/wp-content/uploads/Overvie-of-Sapa-Town.webp", searchKey: "Sa Pa" },
    { name: "Cần Thơ", image: "https://ik.imagekit.io/tvlk/blog/2021/11/dia-diem-du-lich-can-tho-cover.jpg", searchKey: "Cần Thơ" },
    { name: "Huế", image: "https://file.huengaynay.vn/data2/image/fckeditor/upload/2022/20220405/images/image001.jpg", searchKey: "Huế" },
    { name: "Quy Nhơn", image: "https://static-images.vnncdn.net/files/publish/2022/7/22/280762356-359581132902753-2117815975823559575-n-1225.jpg", searchKey: "Quy Nhơn" },
    { name: "Phan Thiết", image: "https://static.vinwonders.com/production/phan-thiet-4.jpg", searchKey: "Phan Thiết" },
    { name: "Hạ Long", image: "https://cms.junglebosstours.com/assets/67dd442f-1793-40a1-a3bb-391c3998dffa?format=webp", searchKey: "Hạ Long" },
    { name: "Thanh Hóa", image: "https://media.vneconomy.vn/images/upload/2022/12/30/001-1.jpeg", searchKey: "Thanh Hóa" },
    { name: "Quảng Ninh", image: "https://bvhttdl.mediacdn.vn/291773308735864832/2021/7/2/1-1625210736154-16252107374091578824352.jpg", searchKey: "Quảng Ninh" },
    { name: "Phan Rang", image: "https://static.vinwonders.com/production/phan-rang-o-dau-1.jpg", searchKey: "Phan Rang" },
    { name: "Mộc Châu", image: "https://media.vietravel.com/images/Content/du-lich-moc-chau-1.jpg", searchKey: "Mộc Châu" },
    { name: "Tam Đảo", image: "https://vinhphuc.gov.vn/ct/IMG_CTV/PublishingImages/2024/02/Tri/04022024.tamdao01.png", searchKey: "Tam Đảo" },
    { name: "Côn Đảo", image: "https://condao.com.vn/uploads/news/2023_03/toan-canh-thi-tran-con-dao_1.jpg", searchKey: "Côn Đảo" }
];

const LAST_SELECTED_CITY = 'lastSelectedCityReview';
const MINIMUM_REVIEWS = 50;
const FAV_KEY_PREFIX = "staywise_favorites_"; 
const USER_STORAGE_KEY = "currentUser";

// --- TOAST NOTIFICATION ---
function showBlackToast(message, type = 'info') {
    let toast = document.getElementById('black-toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'black-toast-notification';
        Object.assign(toast.style, {
            position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.85)', color: '#fff', padding: '12px 24px',
            borderRadius: '8px', zIndex: '9999', opacity: '0', transition: 'all 0.4s ease',
            pointerEvents: 'none', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px'
        });
        document.body.appendChild(toast);
    }
    
    let icon = '';
    if (type === 'error') icon = '<i class="fas fa-exclamation-circle" style="color: #ff6b6b;"></i>';
    else if (type === 'success') icon = '<i class="fas fa-check-circle" style="color: #51cf66;"></i>';
    
    toast.innerHTML = `${icon} <span>${message}</span>`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
}

// --- LOGIC YÊU THÍCH ---
function toggleFavorite(hotelId) {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) {
        const currentLang = localStorage.getItem('staywise_lang') || 'vi';
        const msg = currentLang === 'en' ? "Please login to save favorites!" : "Vui lòng đăng nhập để lưu yêu thích!";
        showBlackToast(msg, 'error'); 
        return false; 
    }

    const user = JSON.parse(userJson);
    const userId = user.uid;
    const key = FAV_KEY_PREFIX + userId;

    let favIds = [];
    try { favIds = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { favIds = []; }

    const strId = String(hotelId);

    if (favIds.includes(strId)) {
        favIds = favIds.filter(id => id !== strId);
        localStorage.setItem(key, JSON.stringify(favIds));
        showBlackToast("Đã xóa khỏi yêu thích", 'success');
        return false;
    } else {
        favIds.push(strId);
        localStorage.setItem(key, JSON.stringify(favIds));
        showBlackToast("Đã thêm vào yêu thích", 'success');
        return true;
    }
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

// --- TÍNH TOÁN ĐIỂM ---
function calculateAggregateReviews(hotel, externalReviews) {
    const externalForHotel = externalReviews.filter(r => 
        r.hotelName.trim().toLowerCase() === hotel.hotelName.trim().toLowerCase()
    );
    
    const externalTotalScore = externalForHotel.reduce((sum, r) => sum + parseFloat(r.score), 0);
    const totalReviews = externalForHotel.length;
    const overallAvgScore = totalReviews > 0 ? (externalTotalScore / totalReviews) : 0;

    return {
        overallScore: overallAvgScore,
        totalReviews: totalReviews
    };
}

function updateDynamicTitle(element, cityName) {
    const currentLang = localStorage.getItem('staywise_lang') || 'vi';
    if (currentLang === 'en') {
        element.innerText = `Top 10 Best Hotels in ${cityName}`;
    } else {
        element.innerText = `Top 10 khách sạn tốt nhất tại ${cityName}`;
    }
}

function getNoResultMsg(cityName) {
    const currentLang = localStorage.getItem('staywise_lang') || 'vi';
    if (currentLang === 'en') {
        return `No hotels found in ${cityName} with over ${MINIMUM_REVIEWS} reviews for Top 10 ranking.`;
    } else {
        return `Không tìm thấy khách sạn nào ở ${cityName} đạt trên ${MINIMUM_REVIEWS} đánh giá để xếp hạng Top 10.`;
    }
}

// --- [HIỆU ỨNG] HÀM RENDER SKELETON LOADING ---
function renderSkeletonLoading(container) {
    // Tạo 5 khung xương thẻ ngang
    const skeletonHTML = Array(5).fill(0).map(() => `
        <div class="skeleton-card" style="display: flex; gap: 15px; border: 1px solid #eee; border-radius: 12px; padding: 15px; margin-bottom: 15px; background: #fff;">
            <div style="width: 180px; height: 125px; background: #eee; border-radius: 8px; animation: pulse 1.5s infinite;"></div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center;">
                <div style="width: 70%; height: 24px; background: #eee; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                <div style="width: 40%; height: 16px; background: #eee; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                <div style="width: 30%; height: 16px; background: #eee; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
            </div>
            <div style="width: 130px; display: flex; flex-direction: column; gap: 10px; justify-content: center; align-items: flex-end;">
                <div style="width: 60%; height: 16px; background: #eee; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
                <div style="width: 80%; height: 24px; background: #eee; border-radius: 4px; animation: pulse 1.5s infinite;"></div>
            </div>
        </div>
    `).join('');
    
    // Thêm style animation nếu chưa có
    if (!document.getElementById('skeleton-style')) {
        const style = document.createElement('style');
        style.id = 'skeleton-style';
        style.innerHTML = `
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
        `;
        document.head.appendChild(style);
    }
    
    container.innerHTML = skeletonHTML;
}

// --- HÀM LOAD CHÍNH ---
async function loadTopReviews(citySearchKey) {
    sessionStorage.setItem(LAST_SELECTED_CITY, citySearchKey);
    const heroSection = document.getElementById('review-hero');
    const listContainer = document.getElementById('top-hotels-list');
    const titleElement = document.getElementById('list-title');
    const selectedCity = POPULAR_LOCATIONS.find(c => c.searchKey === citySearchKey);

    if (!selectedCity) {
         if(listContainer) listContainer.innerHTML = '';
         return;
    }

    if (heroSection) heroSection.style.backgroundImage = `url('${selectedCity.image}')`;
    if (titleElement) updateDynamicTitle(titleElement, selectedCity.name);

    // Hiển thị Skeleton Loading
    if(listContainer) renderSkeletonLoading(listContainer);

    try {
        const [masterHotels, cityReviewsData] = await Promise.all([
            loadMasterHotelsData(),      
            loadReviewsByCity(citySearchKey)    
        ]);

        const hotelsData = masterHotels.filter(h => {
                    // 1. Kiểm tra địa điểm (Logic cũ)
            const matchLocation = String(h.searchLocation).toLowerCase().includes(citySearchKey.toLowerCase()) ||
                                        String(h.location).toLowerCase().includes(citySearchKey.toLowerCase());
                    
                    // 2. [MỚI] Kiểm tra Type phải là Hotel
                    // Chuyển về chữ thường để so sánh
            const type = String(h.type || '').toLowerCase();
                    
                    // Chấp nhận nếu có chữ "hotel" hoặc "khách sạn"
                    // Loại bỏ các trường hợp Resort, Homestay, Apartment nếu tên type không chứa từ khóa hotel
            const isHotel = type.includes('hotel') || type.includes('khách sạn');

                    // Nếu bạn muốn loại trừ hẳn Resort (vì có một số nơi ghi "Resort Hotel"), hãy thêm:
                    // const isNotResort = !type.includes('resort') && !type.includes('nghỉ dưỡng');
                    // return matchLocation && isHotel && isNotResort;

            return matchLocation && isHotel;
        });
        hotelsData.forEach((hotel, index) => { 
            if (hotel.id === undefined) hotel.id = index; 
        });

        let ratedHotels = [];
        
        hotelsData.forEach(hotel => {
            const aggregate = calculateAggregateReviews(hotel, cityReviewsData);
            
            if (aggregate.totalReviews >= MINIMUM_REVIEWS) { 
                // CHUYỂN ĐỔI AN TOÀN
                let finalScore = 0;
                if (!isNaN(aggregate.overallScore)) {
                    finalScore = Number(aggregate.overallScore); // Giữ nguyên là số
                }

                ratedHotels.push({
                    ...hotel,
                    score: finalScore, 
                    numberRating: aggregate.totalReviews 
                });
            }
        });

        ratedHotels.sort((a, b) => b.score - a.score);
        const top10Hotels = ratedHotels.slice(0, 10);
        
        if(listContainer) {
            listContainer.innerHTML = ''; // Xóa skeleton
            
            if (top10Hotels.length === 0) {
                const msg = getNoResultMsg(selectedCity.name);
                listContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px; font-size: 1.1em; color: #666;">${msg}</p>`;
            } else {
                const cardsHtml = top10Hotels.map((hotel, index) => {
                    const rank = index + 1;
                    const isFav = checkIsFavorite(hotel.id);
                    return createHorizontalHotelCard(hotel, hotel.id, rank, isFav);
                }).join('');
                
                listContainer.innerHTML = cardsHtml;
                setupCardListeners();
            }
        }

    } catch (error) {
        console.error("Lỗi tải dữ liệu Top Review:", error);
        if(listContainer) listContainer.innerHTML = ''; 
        // Dùng Toast thay vì in chữ đỏ
        showBlackToast("Đã xảy ra lỗi khi xử lý dữ liệu. Vui lòng thử lại.", 'error');
    }
}

function setupCardListeners() {
    const cards = document.querySelectorAll(".hotel-card"); 

    cards.forEach(card => {
        card.addEventListener("click", function (e) {
            if (e.target.closest(".favorite-btn")) return;
            
            const hotelId = this.dataset.hotelId;
            const detailUrl = this.dataset.url || `information_page.html?id=${hotelId}`; 

            if (hotelId) {
                // Lưu ID vào session để trang chi tiết đọc được
                sessionStorage.setItem('activeHotelId', hotelId);
                window.location.href = detailUrl;
            }
        });
    });

    const favButtons = document.querySelectorAll(".favorite-btn");
    favButtons.forEach(btn => {
        const card = btn.closest(".hotel-card");
        const hotelId = card?.dataset.hotelId;

        if (checkIsFavorite(hotelId)) {
            btn.classList.add("liked");
        } else {
            btn.classList.remove("liked");
        }

        btn.addEventListener("click", function (e) {
            e.stopPropagation(); 
            const isLiked = toggleFavorite(hotelId);
            
            if (localStorage.getItem(USER_STORAGE_KEY)) {
                this.classList.toggle("liked", isLiked);
                // Update màu icon ngay lập tức
                const icon = this.querySelector('i');
                if(icon) {
                    icon.style.color = isLiked ? '#ff4757' : 'rgba(255, 255, 255, 0.9)';
                }
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const citySelect = document.getElementById('city-select');
    
    const DEFAULT_CITY_KEY = 'Hồ Chí Minh'; 
    const storedCityKey = sessionStorage.getItem(LAST_SELECTED_CITY);
    const initialCityKey = storedCityKey || DEFAULT_CITY_KEY;
    
    if (citySelect) {
        const currentLang = localStorage.getItem('staywise_lang') || 'vi';
        const defaultText = currentLang === 'en' ? "Select a destination" : "Chọn địa điểm du lịch";
        
        citySelect.innerHTML = `<option value="" disabled selected>${defaultText}</option>`; 
        
        POPULAR_LOCATIONS.forEach(city => {
            const option = document.createElement('option');
            option.value = city.searchKey;
            option.innerText = city.name; 
            citySelect.appendChild(option);
        });
        
        citySelect.addEventListener('change', (e) => {
            const selectedCityKey = e.target.value;
            loadTopReviews(selectedCityKey);
        });

        citySelect.value = initialCityKey; 
        
        await loadTopReviews(citySelect.value); 
    }
});