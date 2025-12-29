// // Click toàn bộ card → active state
// document.querySelectorAll(".hotel-card").forEach(card => {
//     card.addEventListener("click", function (e) {
//         if (e.target.closest(".favorite-btn")) return; // tránh click vào trái tim

//         // Thêm/xóa active state (giữ nguyên logic hiện tại)
//         document.querySelectorAll(".hotel-card").forEach(c =>
//             c.classList.remove("active")
//         );
//         this.classList.add("active");

//         // ⭐ THÊM LOGIC CHUYỂN HƯỚNG ⭐
//         const detailUrl = this.dataset.url;
//         if (detailUrl) {
//             window.location.href = detailUrl; // Chuyển hướng đến trang thông tin
//         }
//     });
// });

// // Click vào trái tim
// document.querySelectorAll(".favorite-btn").forEach(btn => {
//     btn.addEventListener("click", function (e) {
//         e.stopPropagation(); // tránh trigger click vào card

//         const hotelCard = this.closest(".hotel-card");
//         const hotelId = hotelCard.dataset.hotelId;

//         // Toggle class liked (giữ icon filled)
//         this.classList.toggle("liked");

//         const isLiked = this.classList.contains("liked");

//         console.log(isLiked 
//             ? "Đã thêm yêu thích: " + hotelId
//             : "Đã bỏ yêu thích: " + hotelId
//         );

//         // TODO: Gửi hotelId về backend
//         // if (isLiked) => thêm yêu thích
//         // else => bỏ yêu thích
//     });
// });
