// ============================================================
// 1. CÁC HÀM XỬ LÝ CSV & JSON (PARSER)
// ============================================================

/**
 * CSV parser bằng regex CHUẨN
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
 * Parse JSON an toàn
 */
function parseJsonArray(raw) {
    if (!raw) return [];
    
    let cleaned = raw.trim();
    if (cleaned === "" || cleaned === "[]") return [];

    try {
        if (cleaned.startsWith('["')) {
            return JSON.parse(cleaned);
        }
        if (cleaned.startsWith("['")) {
            const fixed = cleaned
                .replace(/^'|'$/g, '"')          
                .replace(/', '/g, '", "')        
                .replace(/','/g, '","');         
            return JSON.parse(fixed);
        }
        const bruteForce = cleaned.replace(/'/g, '"');
        return JSON.parse(bruteForce);

    } catch (e) {
        const textOnly = raw.replace(/[\[\]'"]/g, "");
        return textOnly.split(',').map(item => item.trim()).filter(item => item !== "");
    }
}

async function loadFileLines(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();

        return csvText
            .split(/\r?\n/) 
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .slice(1); // Bỏ qua header
    } catch (error) {
        console.error(`❌ Lỗi tải file ${filePath}:`, error);
        return [];
    }
}

// ============================================================
// 2. HÀM PARSE DỮ LIỆU KHÁCH SẠN
// ============================================================

function parseHotel(lines) {
    const hotels = [];
    const MIN_COLUMNS = 18; 

    lines.forEach((line, index) => {
        const cols = parseCSV(line);

        // [QUAN TRỌNG] Nếu thiếu cột thì bỏ qua, NHƯNG index vẫn tăng
        if (!cols || cols.length < MIN_COLUMNS) {
            return;
        }

        const searchLocation = cols[0] || ""; 
        const hotelName = cols[1] || "";
        const location = cols[2] || "";
        const type = cols[3] || "";
        const star = parseFloat(cols[4]) || 0;
        const minPrice = parseFloat(cols[5]) || 0;
        const maxPrice = parseFloat(cols[6]) || 0;
        const price = minPrice; 
        const score = parseFloat(cols[7]) || 0;
        const numberRating = parseInt(cols[8]) || 0;
        const haveComments = (cols[9]?.toLowerCase() === 'true');
        let rawDesc = cols[10] || "";
        const description = rawDesc.replace(/\n/g, "<br>"); 

        const mainFacilities = parseJsonArray(cols[11]);
        const servicesFacilities = parseJsonArray(cols[12]);
        const publicFacilities = parseJsonArray(cols[13]);
        const generalFacilities = parseJsonArray(cols[14]);
        const roomFacilities = parseJsonArray(cols[15]);
        const attractions = parseJsonArray(cols[16]);
        const imagesArr = parseJsonArray(cols[17]);
        const imageUrl = imagesArr[0] || "";

        hotels.push({
            // [QUAN TRỌNG] Dùng index dòng CSV làm ID để khớp với Map JSON
            id: index, 
            searchLocation, hotelName, location, type, star,
            price, minPrice, maxPrice,
            score, numberRating, haveComments, description,
            mainFacilities, servicesFacilities, publicFacilities,
            generalFacilities, roomFacilities, attractions,
            images: imagesArr, imageUrl
        });
    });

    return hotels;
}

// ============================================================
// 3. CÁC HÀM EXPORT (LOAD DATA)
// ============================================================

export async function loadMasterHotelsData() {
    const filePath = "../data/hotels.csv"; 
    console.log("📂 Đang tải dữ liệu tổng (Master)...");
    const lines = await loadFileLines(filePath);
    return parseHotel(lines);
}

export async function loadHotelsData(citySearchKey = "") {
    if (!citySearchKey) {
        return await loadMasterHotelsData();
    }
    const fileName = citySearchKey
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/\s+/g, "_");
    const filePath = `../data/hotels/${fileName}_Hotel.csv`;

    try {
        const lines = await loadFileLines(filePath);
        if (lines.length > 0) {
            return parseHotel(lines);
        } else {
            throw new Error("File rỗng");
        }
    } catch (error) {
        const allHotels = await loadMasterHotelsData();
        return allHotels.filter(h => 
            h.searchLocation.toLowerCase().includes(citySearchKey.toLowerCase()) || 
            h.location.toLowerCase().includes(citySearchKey.toLowerCase())
        );
    }
}

// ============================================================
// 4. HỖ TRỢ DỊCH THUẬT (GOOGLE SCRIPT)
// ============================================================

// URL Google Script của bạn
const TRANSLATE_API_URL = "https://script.google.com/macros/s/AKfycbxO7eLbx_pZtJoFNfcY-NOgNpKGiJOFJikcCpRyZ_DQHwh95mADZ92oedUOG7rTbMdZYQ/exec"; 

export async function translateText(text, targetLang = 'en') {
    if (targetLang === 'vi' || !text || text.trim() === "") return text;

    const cacheKey = `trans_gs_${targetLang}_${text.substring(0, 30).replace(/\s/g, '')}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;

    try {
        // console.log("🌐 [API] Đang gọi Google Translate...");
        const url = `${TRANSLATE_API_URL}?q=${encodeURIComponent(text)}&target=${targetLang}&source=vi`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Lỗi kết nối API dịch");
        
        const translatedText = await response.text();
        
        // Kiểm tra nếu Google trả về lỗi HTML (do sai quyền truy cập)
        if (translatedText.trim().startsWith("<")) {
             console.warn("⚠️ API trả về HTML (Lỗi quyền truy cập script).");
             return text;
        }

        sessionStorage.setItem(cacheKey, translatedText);
        return translatedText;
    } catch (error) {
        console.error("⚠️ Lỗi dịch thuật:", error);
        return text; 
    }
}

export async function loadHotelsWithCoordinates(fileName = 'hotels_with_coordinates_test.csv') {
    try {
        const filePath = `../data/${fileName}`;
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const csvText = await response.text();

        const lines = csvText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) return [];

        const header = parseCSV(lines[0]);
        const hotels = [];

        // Find column indices dynamically
        const cityIndex = header.findIndex(h => h.toLowerCase() === 'city' || h.toLowerCase() === 'searchlocation');
        const hotelNameIndex = header.findIndex(h => h.toLowerCase() === 'hotelname');
        const locationIndex = header.findIndex(h => h.toLowerCase() === 'location');
        const typeIndex = header.findIndex(h => h.toLowerCase() === 'type');
        const starIndex = header.findIndex(h => h.toLowerCase() === 'star');
        const minPriceIndex = header.findIndex(h => h.toLowerCase() === 'minprice');
        const maxPriceIndex = header.findIndex(h => h.toLowerCase() === 'maxprice');
        const scoreIndex = header.findIndex(h => h.toLowerCase() === 'score');
        const numberRatingIndex = header.findIndex(h => h.toLowerCase() === 'numberrating');
        const haveCommentsIndex = header.findIndex(h => h.toLowerCase() === 'havecomments');
        const descriptionIndex = header.findIndex(h => h.toLowerCase() === 'description');
        const mainFacilitiesIndex = header.findIndex(h => h.toLowerCase() === 'mainfacilities');
        const servicesFacilitiesIndex = header.findIndex(h => h.toLowerCase() === 'servicesfacilities');
        const publicFacilitiesIndex = header.findIndex(h => h.toLowerCase() === 'publicfacilities');
        const generalFacilitiesIndex = header.findIndex(h => h.toLowerCase() === 'generalfacilities');
        const roomFacilitiesIndex = header.findIndex(h => h.toLowerCase() === 'roomfacilities');
        const attractionsIndex = header.findIndex(h => h.toLowerCase() === 'attractions');
        const imagesIndex = header.findIndex(h => h.toLowerCase().includes('image'));
        const latIndex = header.findIndex(h => h.toLowerCase() === 'lat');
        const lonIndex = header.findIndex(h => h.toLowerCase() === 'lon');
        const addressIndex = header.findIndex(h => h.toLowerCase() === 'address');

        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSV(lines[i]);
            if (!cols || cols.length < 5) continue;

            const searchLocation = cityIndex >= 0 ? cols[cityIndex] : "";
            const hotelName = hotelNameIndex >= 0 ? cols[hotelNameIndex] : "";
            const location = locationIndex >= 0 ? cols[locationIndex] : "";
            const type = typeIndex >= 0 ? cols[typeIndex] : "";
            const star = starIndex >= 0 ? parseFloat(cols[starIndex]) || 0 : 0;
            const minPrice = minPriceIndex >= 0 ? parseFloat(cols[minPriceIndex]) || 0 : 0;
            const maxPrice = maxPriceIndex >= 0 ? parseFloat(cols[maxPriceIndex]) || 0 : 0;
            const price = minPrice;
            const score = scoreIndex >= 0 ? parseFloat(cols[scoreIndex]) || 0 : 0;
            const numberRating = numberRatingIndex >= 0 ? parseInt(cols[numberRatingIndex]) || 0 : 0;
            const haveComments = haveCommentsIndex >= 0 ? (cols[haveCommentsIndex]?.toLowerCase() === 'true') : false;
            const description = descriptionIndex >= 0 ? (cols[descriptionIndex] || "").replace(/\n/g, "<br>") : "";

            const mainFacilities = mainFacilitiesIndex >= 0 ? parseJsonArray(cols[mainFacilitiesIndex]) : [];
            const servicesFacilities = servicesFacilitiesIndex >= 0 ? parseJsonArray(cols[servicesFacilitiesIndex]) : [];
            const publicFacilities = publicFacilitiesIndex >= 0 ? parseJsonArray(cols[publicFacilitiesIndex]) : [];
            const generalFacilities = generalFacilitiesIndex >= 0 ? parseJsonArray(cols[generalFacilitiesIndex]) : [];
            const roomFacilities = roomFacilitiesIndex >= 0 ? parseJsonArray(cols[roomFacilitiesIndex]) : [];
            const attractions = attractionsIndex >= 0 ? parseJsonArray(cols[attractionsIndex]) : [];
            const imagesArr = imagesIndex >= 0 ? parseJsonArray(cols[imagesIndex]) : [];
            const imageUrl = imagesArr[0] || "";

            // Get coordinates from CSV
            const lat = latIndex >= 0 && cols[latIndex] ? parseFloat(cols[latIndex]) : null;
            const lon = lonIndex >= 0 && cols[lonIndex] ? parseFloat(cols[lonIndex]) : null;
            const address = addressIndex >= 0 && cols[addressIndex] ? cols[addressIndex] : location;

            hotels.push({
                id: i - 1,
                searchLocation, hotelName, location, address, type, star,
                price, minPrice, maxPrice,
                score, numberRating, haveComments, description,
                mainFacilities, servicesFacilities, publicFacilities,
                generalFacilities, roomFacilities, attractions,
                images: imagesArr, imageUrl,
                lat, lon
            });
        }

        console.log(`✅ Loaded ${hotels.length} hotels with coordinates`);
        return hotels;

    } catch (error) {
        console.error(`❌ Error loading hotels with coordinates:`, error);
        return [];
    }
}