# Thư mục Images - Assets

## Mục đích
Thư mục này dùng để lưu trữ tất cả các hình ảnh tĩnh được sử dụng trong dự án StayWise, bao gồm:
- Logo và icon
- Hình ảnh khách sạn
- Hình ảnh banner và hero sections
- Các hình ảnh UI khác

## Cấu trúc đề xuất
```
client/assets/images/
├── hotels/          # Hình ảnh khách sạn
├── logos/           # Logo và branding
├── icons/           # Icon và biểu tượng
├── banners/         # Hình ảnh banner
└── ui/              # Các hình ảnh UI khác
```

## Hướng dẫn di chuyển ảnh hiện có

### Bước 1: Xác định các ảnh cần di chuyển
Tìm kiếm tất cả các đường dẫn ảnh trong code hiện tại:
```bash
# Tìm trong HTML
grep -r "src=" client/html/ | grep -E "\.(jpg|jpeg|png|gif|svg|webp)"

# Tìm trong CSS
grep -r "url(" client/css/ | grep -E "\.(jpg|jpeg|png|gif|svg|webp)"

# Tìm trong JS
grep -r "\.(jpg|jpeg|png|gif|svg|webp)" client/js/
```

### Bước 2: Di chuyển ảnh
1. Copy các file ảnh từ vị trí hiện tại vào thư mục tương ứng trong `client/assets/images/`
2. Giữ nguyên tên file để dễ tracking

### Bước 3: Cập nhật đường dẫn
Sau khi di chuyển ảnh, cập nhật đường dẫn trong các file:

**Trong HTML:**
```html
<!-- Cũ -->
<img src="https://example.com/hotel.jpg" alt="Hotel">

<!-- Mới -->
<img src="../assets/images/hotels/hotel.jpg" alt="Hotel">
```

**Trong CSS:**
```css
/* Cũ */
background-image: url('https://example.com/banner.jpg');

/* Mới */
background-image: url('../assets/images/banners/banner.jpg');
```

**Trong JS:**
```javascript
// Cũ
const imgUrl = "https://example.com/icon.png";

// Mới
const imgUrl = "../assets/images/icons/icon.png";
```

### Bước 4: Test
- Kiểm tra tất cả các trang để đảm bảo ảnh hiển thị đúng
- Kiểm tra responsive trên các thiết bị khác nhau
- Kiểm tra performance loading

## Lưu ý quan trọng
- **KHÔNG** xóa ảnh cũ cho đến khi đã verify ảnh mới hoạt động đúng
- **KHÔNG** commit ảnh có dung lượng lớn (> 1MB) mà chưa tối ưu
- Sử dụng format WebP cho performance tốt hơn khi có thể
- Giữ tên file có ý nghĩa và consistent (lowercase, dấu gạch ngang)

## Best Practices
1. **Tối ưu hóa ảnh trước khi commit:**
   - Resize về kích thước phù hợp
   - Compress để giảm dung lượng
   - Sử dụng format phù hợp (WebP, PNG, JPEG)

2. **Naming convention:**
   - Sử dụng lowercase
   - Dấu gạch ngang thay vì space: `hotel-image.jpg`
   - Tên có ý nghĩa: `marriott-hanoi-exterior.jpg` thay vì `img123.jpg`

3. **Alt text:**
   - Luôn có alt text mô tả cho accessibility
   - Alt text nên ngắn gọn và mô tả nội dung ảnh

## Di chuyển trong PR tương lai
Việc di chuyển ảnh sẽ được thực hiện trong một PR riêng để:
- Dễ review và rollback nếu cần
- Tránh conflict với các thay đổi khác
- Đảm bảo không break đường dẫn hiện có
