// destination_detail.js (Đã sửa)

// Danh sách POPULAR_LOCATIONS (để lấy ảnh và searchKey từ trang home)
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


// ⭐ HÀM LOADER MỚI: TẢI DỮ LIỆU HƯỚNG DẪN ĐỊA DANH ⭐
export async function loadDestinationGuideData() {
    try {
        // Sử dụng import.meta.url (module) để xác định đường dẫn RELATIVE chính xác
        // -> Hoạt động cả khi chạy bằng Live Server, npx serve hoặc GitHub Pages
        let csvUrl;
        try {
            csvUrl = new URL('../data/places_description.csv', import.meta.url).href;
        } catch (e) {
            // Fallback nếu môi trường không hỗ trợ import.meta.url
            const base = (document.currentScript && document.currentScript.src) ? new URL('.', document.currentScript.src).href : window.location.href;
            csvUrl = new URL('../data/places_description.csv', base).href;
        }

        console.debug('Tải CSV từ:', csvUrl);
        const response = await fetch(csvUrl, { cache: 'no-cache' });
        if (!response.ok) {
            console.error('Lỗi: Không thể tải places_description.csv —', response.status, response.statusText);
            return [];
        }
        const csvText = await response.text();
        
        const cleanCsvText = csvText.replace(/\r/g, ''); 
        const lines = cleanCsvText.split('\n').filter(line => line.trim().length > 0);
        
        if (lines.length < 2) return [];

        // 2. Định nghĩa Header (Thêm 4 trường URL)
        const headers = [
            "name", "placeDescription", "cultureDescription", "peopleDescription", "hotelsDescription",
            "placeURL", "cultureURL", "peopleURL", "hotelsURL"
        ];
        const guideData = [];

        // Regex CHUẨN để xử lý CSV với dấu phẩy và ngoặc kép:
        const CSV_REGEX = /(?:^|,)(\"(?:[^\"]|\"\"|\\n)*?\"|[^,]*)/g; 

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const cols = [];
            let match;
            let index = 0;
            
            while (match = CSV_REGEX.exec(line)) {
                let col = match[1]; 
                
                if (index === 0 && match[0].startsWith(',')) {
                    col = match[1].slice(1);
                } else if (index > 0 && match[0].startsWith(',')) {
                     col = match[1];
                }
                
                if (col && col.startsWith('"') && col.endsWith('"')) {
                    col = col.slice(1, -1);
                }
                cols.push((col || '').trim());
                index++;
            }
            
            if (cols.length === headers.length) {
                const item = {};
                headers.forEach((header, index) => {
                    item[header] = cols[index];
                });
                guideData.push(item);
            } else {
                 console.warn(`Dòng ${i+1} bị thiếu cột (${cols.length}/${headers.length}): ${line}`);
            }
        }
        return guideData;

    } catch (error) {
        console.error("Lỗi khi tải hoặc xử lý dữ liệu hướng dẫn địa danh:", error);
        return [];
    }
}


document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const cityKey = urlParams.get('city')?.trim(); 
    
    // Tải dữ liệu hướng dẫn (GIỮ NGUYÊN)
    const guideData = await loadDestinationGuideData(); 
    console.debug('guideData length =', guideData.length);
    
    // 1. Định nghĩa dữ liệu TPHCM (sử dụng TPHCM từ GUIDE_DATA nếu có)
    const detailedDefaultCity = guideData.find(g => g.name === "TP Hồ Chí Minh");
    // Sửa: tìm bằng name hoặc searchKey cho an toàn
    const popularDefaultCity = POPULAR_LOCATIONS.find(c => c.name === "TP Hồ Chí Minh" || c.searchKey === "TP Hồ Chí Minh" || c.searchKey === "Hồ Chí Minh");
    
    // Tạo đối tượng Fallback đầy đủ các trường
    const defaultCity = {
        ...(popularDefaultCity || {}), // Lấy image, searchKey
        ...(detailedDefaultCity || { placeDescription: "Không có dữ liệu", cultureDescription: "", peopleDescription: "", hotelsDescription: "" }) // Lấy mô tả chi tiết
    };
    
    // 2. Xác định dữ liệu cuối cùng
    const detailedGuide = guideData.find(g => g.name === cityKey);
    const popularLocationData = POPULAR_LOCATIONS.find(c => c.searchKey === cityKey || c.name === cityKey);

    const finalCityData = {
        ...defaultCity, // Bắt đầu từ TPHCM (đã có mô tả)
        ...(popularLocationData || {}), // Ghi đè image nếu tìm thấy key
        ...(detailedGuide || {}) // Ghi đè tất cả các trường nếu tìm thấy guide
    };
    
    // Nếu không tìm thấy detailedGuide cho cityKey, nhưng cityKey tồn tại, ta vẫn dùng default
    if (!detailedGuide && cityKey) {
         const foundCity = POPULAR_LOCATIONS.find(c => c.searchKey === cityKey || c.name === cityKey);
         if (foundCity) {
            finalCityData.name = foundCity.name;
            finalCityData.image = foundCity.image;
            // Giữ lại mô tả TPHCM nếu không tìm thấy mô tả cho thành phố khác
         }
    }
    
    updateDestinationPage(finalCityData);
});

// Hàm formatPlainText (đảm bảo xuống dòng)
function formatPlainText(text) {
    if (!text) return '';
    let cleanedText = text.trim(); 
    // Chuyển đổi ký tự xuống dòng (\n) thành thẻ <br>
    cleanedText = cleanedText.replace(/\\n/g, '<br><br>');
    cleanedText = cleanedText.replace(/'([^']+)'/g, '<strong>$1</strong>');
    return cleanedText;
}

function createInfoCard(title, content, imageUrl, isReversed) {
    const contentHTML = formatPlainText(content);
    
    // Tùy chọn class để đảo ngược bố cục (dùng cho CSS nth-child)
    const directionClass = isReversed ? 'row-reverse' : ''; 
    
    return `
    <div class="info-card ${directionClass}">
        <div class="card-image-col" style="background-image: url('${imageUrl}');">
            </div>
        
        <div class="card-content-col">
            <h3>${title}</h3>
            <p>${contentHTML}</p>
        </div>
    </div>
    `;
}


function updateDestinationPage(cityData) {
    const heroSection = document.getElementById('destination-hero');
    const titleElement = document.getElementById('destination-name-title');
    const subtitleElement = document.getElementById('destination-subtitle');
    const infoPlaceholder = document.getElementById('destination-info-placeholder');
    const pageTitle = document.getElementById('page-title');

    // 1. Cập nhật Banner Background và Tiêu đề
    if (heroSection && cityData.image) {
        heroSection.style.backgroundImage = `url('${cityData.image}')`;
    }
    
    if (pageTitle) {
        pageTitle.innerText = `StayWise - Khám phá ${cityData.name}`;
    }

    if (titleElement) {
        titleElement.innerText = cityData.name;
    }
    if (subtitleElement) {
        subtitleElement.innerHTML = `Khám phá vẻ đẹp di sản, văn hóa và cơ sở lưu trú tuyệt vời tại <strong>${cityData.name}</strong>.`;
    }
    
    // 1. Dữ liệu thành 4 phần
    const guideBlocks = [
        { title: `Địa điểm tham quan (${cityData.name})`, content: cityData.placeDescription, imgUrl: cityData.placeURL },
        { title: "Văn hóa và Ẩm thực", content: cityData.cultureDescription, imgUrl: cityData.cultureURL },
        { title: "Tính cách con người", content: cityData.peopleDescription, imgUrl: cityData.peopleURL },
        { title: "Hệ thống lưu trú", content: cityData.hotelsDescription, imgUrl: cityData.hotelsURL }
    ];
    
    const defaultImage = "https://asiatravel.net.vn/img_23/images/dia-diem-du-lich-o-ha-noi-1.jpg"; // Hình ảnh test

    if (infoPlaceholder && cityData.placeDescription) {
        
        const cardsHTML = guideBlocks.map((block, index) => {
            const imageUrl = block.imgUrl || cityData.image || defaultImage;
            return `
                <div class="info-card" data-index="${index}">
                    <div class="card-image-col" style="background-image: url('${imageUrl}');">
                        </div>
                    
                    <div class="card-content-col">
                        <h3>${block.title}</h3>
                        <p class="card-text">${formatPlainText(block.content)}</p>
                        <button class="see-more-btn" data-title="${block.title}" data-content="${block.content.replace(/"/g, '&quot;')}" data-image="${imageUrl}">
                            Xem thêm
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        infoPlaceholder.innerHTML = `<div class="destination-info-container">${cardsHTML}</div>`;
        
        // Thêm event listeners cho nút xem thêm
        setupSeeMoreButtons();
        
    } else if (infoPlaceholder) {
         infoPlaceholder.innerHTML = '<p style="text-align: center; padding: 50px; color: #888;">Chưa có dữ liệu hướng dẫn chi tiết cho địa danh này.</p>';
    }
    const ctaButton = document.getElementById('explore-hotels-btn');
    if (ctaButton) {
        // Cập nhật text của nút
        ctaButton.innerText = `Khám phá hệ thống các khách sạn tại ${cityData.name} ngay`;
        
        // Xóa listener cũ trước khi gắn mới (tránh gắn nhiều lần khi chạy lại update)
        const newButton = ctaButton.cloneNode(true);
        ctaButton.parentNode.replaceChild(newButton, ctaButton);

        newButton.addEventListener('click', () => {
            const cityKey = cityData.searchKey || cityData.name;
            sessionStorage.setItem('filterLocation', cityKey);
            sessionStorage.removeItem('filterPriceMin');
            sessionStorage.removeItem('filterPriceMax');
            sessionStorage.removeItem('filterStayType');
            sessionStorage.removeItem('filterStarRating');
            sessionStorage.removeItem('filterMainFac');
            sessionStorage.removeItem('filterExtraFac');
            window.location.href = 'explore.html'; 
        });
    }
}

// Hàm xử lý nút "Xem thêm"
function setupSeeMoreButtons() {
    const seeMoreBtns = document.querySelectorAll('.see-more-btn');
    const modal = document.getElementById('content-modal-overlay');
    const modalTitle = document.getElementById('modal-content-title');
    const modalContent = document.getElementById('full-content-text');
    const modalImageBg = document.getElementById('modal-image-bg');
    const closeBtn = document.getElementById('content-close-btn');
    
    seeMoreBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const title = btn.dataset.title;
            const content = btn.dataset.content;
            const imageUrl = btn.dataset.image;
            
            modalTitle.textContent = title;
            modalContent.innerHTML = formatPlainText(content);
            
            // Set background image
            if (modalImageBg && imageUrl) {
                modalImageBg.style.backgroundImage = `url('${imageUrl}')`;
            }
            
            modal.classList.add('active');
            document.body.classList.add('modal-open');
        });
    });
    
    // Đóng modal
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    };
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Đóng khi click overlay
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}
