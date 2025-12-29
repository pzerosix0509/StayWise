// ../js/contact.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// -----------------------------
// 🔹 Cấu hình Firebase của bạn
// (Hãy đảm bảo phần này giống với auth.js)
// -----------------------------
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

// -----------------------------
// 🔹 Xử lý gửi form liên hệ
// -----------------------------
const form = document.getElementById("contact-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("full-name").value.trim();
  const email = document.getElementById("contact-email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const message = document.getElementById("message").value.trim();

  if (!name || !email || !message) {
    alert("Vui lòng điền đầy đủ họ tên, email và nội dung.");
    return;
  }

  try {
    await addDoc(collection(db, "contact_messages"), {
      name,
      email,
      phone,
      message,
      createdAt: serverTimestamp()
    });

    alert("✅ Cảm ơn bạn! Chúng tôi đã nhận được thông tin liên hệ.");
    form.reset();
  } catch (error) {
    console.error("Lỗi khi lưu thông tin liên hệ:", error);
    alert("❌ Đã có lỗi xảy ra, vui lòng thử lại sau!");
  }
});
