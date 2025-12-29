// js/reviews_loader.js

// Danh sách các thành phố (Dùng để mapping hoặc tải loop nếu cần)
const ALL_REVIEW_LOCATIONS = [
    "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Đà Lạt", "Phú Quốc", 
    "Nha Trang", "Hội An", "Vũng Tàu", "Sa Pa", "Cần Thơ", 
    "Huế", "Quy Nhơn", "Phan Thiết", "Hạ Long", "Thanh Hóa", 
    "Quảng Ninh", "Phan Rang", "Mộc Châu", "Tam Đảo", "Côn Đảo"
];

// ============================================================
// CÁC HÀM XỬ LÝ CSV (PARSER)
// ============================================================

/**
 * CSV parser bằng regex CHUẨN (Giữ nguyên)
 * Xử lý được dấu phẩy bên trong dấu ngoặc kép
 */
function parseCSV(line) {
    const regex = /("([^"\\]|\\.|"")*"|[^,]+)/g;
    return [...line.matchAll(regex)].map(match => {
        let v = match[0].trim();
        if (v.startsWith('"') && v.endsWith('"')) {
            v = v.slice(1, -1).replace(/""/g, '"');
        }
        return v;
    });
}

/**
 * Tải file CSV từ đường dẫn, xử lý xuống dòng an toàn
 */
async function loadFileLines(filePath) {
    const response = await fetch(filePath);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status} at ${filePath}`);
    const csvText = await response.text();

    return csvText
        .split(/\r?\n/) 
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(1); // Bỏ qua header
}

/**
 * Hàm Parse dữ liệu Review (7 cột)
 * Header dự kiến: city, hotelName, source, username, userRating, timeCmt, userCmt
 */
function parseReviewRows(lines) {
    const reviews = [];
    const MIN_COLS = 7; 

    lines.forEach((line) => {
        const cols = parseCSV(line);

        if (cols.length < MIN_COLS) return;

        // Map dữ liệu
        const hotelName = cols[1];
        const source = cols[2];    // Nguồn (Traveloka, Booking...)
        const userName = cols[3];
        
        // Xử lý điểm số: "9,7" -> 9.7
        let rawScore = cols[4] || "0";
        let score = parseFloat(rawScore.replace(',', '.')); 

        const dateCommented = cols[5];
        const content = cols[6];

        reviews.push({
            hotelName: hotelName,
            userName: userName,
            source: source,
            score: score.toFixed(1), 
            content: content,
            date: dateCommented,
            avatarUrl: null 
        });
    });
    
    return reviews;
}

// ============================================================
// CÁC HÀM EXPORT (LOAD DATA)
// ============================================================

/**
 * 1. DÙNG CHO TRANG THÔNG TIN (INFO PAGE)
 * Yêu cầu: Load file tổng data/comments.csv
 */
export async function loadInfoPageReviews() {
    // Đường dẫn tương đối từ file js/ ra thư mục data/
    const filePath = '../data/comments.csv';
    
    console.log("🚀 [InfoPage] Đang tải file tổng comments.csv...");

    try {
        const lines = await loadFileLines(filePath);
        const reviews = parseReviewRows(lines);
        console.log(`✅ [InfoPage] Đã tải ${reviews.length} đánh giá.`);
        return reviews;
    } catch (error) {
        console.error("❌ [InfoPage] Lỗi tải file comments.csv:", error);
        return [];
    }
}

/**
 * 2. DÙNG CHO TRANG TOP REVIEW & SEARCH (TOP REVIEW PAGE)
 * Yêu cầu: Load file riêng lẻ data/comments/City_Comment.csv
 * @param {string} citySearchKey - Tên thành phố (VD: "Hồ Chí Minh")
 */
export async function loadReviewsByCity(citySearchKey = "") {
    if (!citySearchKey) return [];

    // Chuẩn hóa tên file: "Hồ Chí Minh" -> "Ho_Chi_Minh"
    const fileName = citySearchKey
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/\s+/g, "_");

    // Đường dẫn file: ../data/comments/Ho_Chi_Minh_Comment.csv
    const filePath = `../data/comments/${fileName}_Comment.csv`;

    try {
        const lines = await loadFileLines(filePath);
        return parseReviewRows(lines);
    } catch (error) {
        console.warn(`⚠️ [TopReview] Không tìm thấy file review cho ${citySearchKey} (${filePath})`);
        return [];
    }
}

/**
 * 3. HÀM PHỤ TRỢ (OPTIONAL)
 * Tải tất cả file con nếu cần quét toàn bộ thư mục comment (như code cũ)
 */
export async function loadAllCityFiles() {
    console.log("🚀 [Master] Đang quét tất cả các file thành phố...");
    try {
        const promises = ALL_REVIEW_LOCATIONS.map(city => loadReviewsByCity(city));
        const results = await Promise.all(promises);
        const allReviews = results.flat();
        console.log(`✅ [Master] Tổng cộng tải được ${allReviews.length} đánh giá từ các file lẻ.`);
        return allReviews;
    } catch (error) {
        console.error("❌ [Master] Lỗi tải master reviews:", error);
        return [];
    }
}