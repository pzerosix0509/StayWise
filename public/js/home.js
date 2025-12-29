// js/home.js
import { loadHotelsData } from "./hotels_loader.js";

document.addEventListener("DOMContentLoaded", () => {
    const searchBtn = document.getElementById("home-search-btn");
    const locationInput = document.getElementById("home-location");
    const priceMinInput = document.getElementById("home-price-min");
    const priceMaxInput = document.getElementById("home-price-max");

    if (searchBtn) {
        searchBtn.addEventListener("click", handleSearch);
    }

    [locationInput, priceMinInput, priceMaxInput].forEach(input => {
        if (input) {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    handleSearch();
                }
            });
        }
    });

    function handleSearch() {
        const location = locationInput.value.trim();
        // Chặn giá trị âm nếu có
        const priceMin = Math.max(0, parseFloat(priceMinInput.value)) || ""; 
        const priceMax = Math.max(0, parseFloat(priceMaxInput.value)) || "";

        // 1. Lưu các giá trị tìm kiếm MỚI vào sessionStorage
        sessionStorage.setItem('filterLocation', location);
        sessionStorage.setItem('filterPriceMin', priceMin);
        sessionStorage.setItem('filterPriceMax', priceMax);
        
        // 2. Xóa sạch các filter cũ để tránh xung đột
        sessionStorage.removeItem('filterStayType');
        sessionStorage.removeItem('filterStarRating');
        sessionStorage.removeItem('filterMainFac');
        sessionStorage.removeItem('filterExtraFac');

        // 3. Chuyển hướng
        window.location.href = 'explore.html'; 
    }
    
    loadAndRenderPopularLocations();
});

// DATA: Thêm nameEn cho tiếng Anh
const POPULAR_LOCATIONS = [
    { name: "Hà Nội", nameEn: "Hanoi", image: "https://asiatravel.net.vn/img_23/images/dia-diem-du-lich-o-ha-noi-1.jpg", searchKey: "Hà Nội" },
    { name: "Đà Nẵng", nameEn: "Da Nang", image: "https://cdn3.ivivu.com/2022/07/Gi%E1%BB%9Bi-thi%E1%BB%87u-du-l%E1%BB%8Bch-%C4%90%C3%A0-N%E1%BA%B5ng-ivivu-1-e1743500641858.jpg", searchKey: "Đà Nẵng" },
    { name: "TP Hồ Chí Minh", nameEn: "Ho Chi Minh City", image: "https://bcp.cdnchinhphu.vn/thumb_w/777/334894974524682240/2025/6/30/tphcm-1-1751245519173693919081.jpg", searchKey: "Hồ Chí Minh" },
    { name: "Đà Lạt", nameEn: "Da Lat", image: "https://samtenhills.vn/wp-content/uploads/2024/11/kinh-nghiem-du-lich-da-lat-1-minh.jpg", searchKey: "Đà Lạt" },
    { name: "Phú Quốc", nameEn: "Phu Quoc", image: "https://thoibaotaichinhvietnam.vn/stores/news_dataimages/2024/102024/18/14/phu-quoc20241018144932.1152350.jpg", searchKey: "Phú Quốc" },
    { name: "Nha Trang", nameEn: "Nha Trang", image: "https://xaviahotel.com/vnt_upload/news/11_2017/nha-trang_1.jpg", searchKey: "Nha Trang" },
    { name: "Hội An", nameEn: "Hoi An", image: "https://daivietourist.vn/wp-content/uploads/2025/05/gioi-thieu-ve-pho-co-hoi-an-14.jpg", searchKey: "Hội An" },
    { name: "Vũng Tàu", nameEn: "Vung Tau", image: "https://vandungcar.vn/wp-content/uploads/2023/10/trai-nghiem-thanh-pho-bien-vung-tau-2-1.jpg", searchKey: "Vũng Tàu" },
    { name: "Sapa", nameEn: "Sapa", image: "https://sapanomad.com/wp-content/uploads/Overvie-of-Sapa-Town.webp", searchKey: "Sa Pa" },
    { name: "Cần Thơ", nameEn: "Can Tho", image: "https://ik.imagekit.io/tvlk/blog/2021/11/dia-diem-du-lich-can-tho-cover.jpg", searchKey: "Cần Thơ" },
    { name: "Huế", nameEn: "Hue", image: "https://file.huengaynay.vn/data2/image/fckeditor/upload/2022/20220405/images/image001.jpg", searchKey: "Huế" },
    { name: "Quy Nhơn", nameEn: "Quy Nhon", image: "https://static-images.vnncdn.net/files/publish/2022/7/22/280762356-359581132902753-2117815975823559575-n-1225.jpg", searchKey: "Quy Nhơn" },
    { name: "Phan Thiết", nameEn: "Phan Thiet", image: "https://static.vinwonders.com/production/phan-thiet-4.jpg", searchKey: "Phan Thiết" },
    { name: "Hạ Long", nameEn: "Ha Long", image: "https://cms.junglebosstours.com/assets/67dd442f-1793-40a1-a3bb-391c3998dffa?format=webp", searchKey: "Hạ Long" },
    { name: "Thanh Hóa", nameEn: "Thanh Hoa", image: "https://media.vneconomy.vn/images/upload/2022/12/30/001-1.jpeg", searchKey: "Thanh Hóa" },
    { name: "Quảng Ninh", nameEn: "Quang Ninh", image: "https://bvhttdl.mediacdn.vn/291773308735864832/2021/7/2/1-1625210736154-16252107374091578824352.jpg", searchKey: "Quảng Ninh" },
    { name: "Phan Rang", nameEn: "Phan Rang", image: "https://static.vinwonders.com/production/phan-rang-o-dau-1.jpg", searchKey: "Phan Rang" },
    { name: "Mộc Châu", nameEn: "Moc Chau", image: "https://media.vietravel.com/images/Content/du-lich-moc-chau-1.jpg", searchKey: "Mộc Châu" },
    { name: "Tam Đảo", nameEn: "Tam Dao", image: "https://www.bambooairways.com/documents/d/global/du-lich-tam-dao-1-jpg", searchKey: "Tam Đảo" },
    { name: "Côn Đảo", nameEn: "Con Dao", image: "https://condao.com.vn/uploads/news/2023_03/toan-canh-thi-tran-con-dao_1.jpg", searchKey: "Côn Đảo" }
];

// ⭐ SỬA HÀM TẠO CARD: Dùng thẻ <img> để không bị lỗi layout ⭐
function createLocationCard(locationData, hotelCount) {
    const currentLang = localStorage.getItem("staywise_lang") || "vi";
    const displayName = currentLang === 'en' ? (locationData.nameEn || locationData.name) : locationData.name;
    const countText = currentLang === 'en' 
        ? `${hotelCount} hotels available` 
        : `Có ${hotelCount} khách sạn`;

    return `
    <div class="location-card" data-location-name="${locationData.searchKey}">
        <a href="#" class="location-link" style="text-decoration: none;">
            <div class="image-wrapper" style="position: relative; overflow: hidden; border-radius: 8px;">
                <img src="${locationData.image}" alt="${displayName}" style="width: 100%; height: 280px; object-fit: cover; object-position: center; display: block;">
                
                <div class="card-content" style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 15px; color: #fff;">
                    <h3 class="location-name" style="margin: 0; font-size: 18px;">${displayName}</h3>
                    <p class="hotel-count" style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">${countText}</p>
                </div>
            </div>
        </a>
    </div>
    `;
}

async function loadAndRenderPopularLocations() {
    const grid = document.getElementById("popular-locations-grid");
    if (!grid) return;

    const hotels = await loadHotelsData();
    
    const locationCounts = POPULAR_LOCATIONS.map(location => {
        const count = hotels.filter(hotel => 
            String(hotel.searchLocation).toLowerCase().includes(location.searchKey.toLowerCase())
        ).length;
        
        return { ...location, count: count };
    });

    let html = '';
    locationCounts.forEach(data => {
        html += createLocationCard(data, data.count);
    });
    grid.innerHTML = html;

    grid.querySelectorAll('.location-card').forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const locationName = this.dataset.locationName;
            window.location.href = `destination_detail.html?city=${encodeURIComponent(locationName)}`;
        });
    });
}
