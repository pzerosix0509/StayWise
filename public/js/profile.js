// --- 1. IMPORT ĐẦY ĐỦ CÁC HÀM CẦN THIẾT ---
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, onAuthStateChanged, updateProfile, RecaptchaVerifier,
    linkWithPhoneNumber, updatePassword, reauthenticateWithCredential, 
    EmailAuthProvider, deleteUser                  
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "./toast.js";
import { loadMasterHotelsData } from "./hotels_loader.js"; 
import { createHotelCard } from "./hotel_renderer.js"; 

// --- CẤU HÌNH FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyACfhRC94Wt-_q7h1f-1cJjOV06nP9SVag",
    authDomain: "staywise-8d5dd.firebaseapp.com",
    projectId: "staywise-8d5dd",
    storageBucket: "staywise-8d5dd.firebasestorage.app",
    messagingSenderId: "308886745296",
    appId: "1:308886745296:web:a43170c671e27df804aed5"
};

// --- 2. LOGIC KHỞI TẠO ---
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp(); 
}

const auth = getAuth(app);
const db = getFirestore(app);
auth.useDeviceLanguage();

const FAV_KEY_PREFIX = "staywise_favorites_";

// --- HÀM HỖ TRỢ DỊCH THUẬT HTML TĨNH ---
function updatePageLanguage() {
    const lang = localStorage.getItem("staywise_lang") || "vi";
    if (typeof UI_TRANSLATIONS === 'undefined' || !UI_TRANSLATIONS[lang]) return;

    const dict = UI_TRANSLATIONS[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
                el.placeholder = dict[key];
            } else {
                el.innerText = dict[key];
            }
        }
    });
}

// ==========================
// VIEWED-HOTEL TRACKING HELPERS (HOÀN THIỆN)
// ==========================

/**
 * addViewedHotel: cập nhật user_views.userId.viewedList an toàn (transaction)
 * @param {string} userId
 * @param {string|number} hotelId
 * @param {object} opts { maxItems: number, newestFirst: boolean }
 *    - newestFirst: true => lưu newest ở đầu
 *                   false => lưu newest ở cuối (recommended)
 * @returns {Promise<boolean>}
 */
async function addViewedHotel(userId, hotelId, opts = {}) {
  const { maxItems = 50, newestFirst = false } = opts;
  if (!userId || hotelId == null) return false;
  const docRef = doc(db, "user_views", userId);
  const strId = String(hotelId);

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      let list = Array.isArray(snap?.data()?.viewedList) ? snap.data().viewedList.slice() : [];

      // loại tất cả occurrences hiện có
      list = list.filter(id => String(id) !== strId);

      if (newestFirst) {
        list.unshift(strId); // newest at head
        if (list.length > maxItems) list = list.slice(0, maxItems);
      } else {
        list.push(strId); // newest at tail
        if (list.length > maxItems) list = list.slice(list.length - maxItems);
      }

      tx.set(docRef, { viewedList: list, updatedAt: new Date() }, { merge: true });
    });

    return true;
  } catch (err) {
    console.error("addViewedHotel transaction failed:", err);
    // fallback non-transactional (ít an toàn nhưng cố thử)
    try {
      const snap = await getDoc(docRef);
      let list = Array.isArray(snap?.data()?.viewedList) ? snap.data().viewedList.slice() : [];
      list = list.filter(id => String(id) !== strId);
      if (newestFirst) {
        list.unshift(strId);
        if (list.length > maxItems) list = list.slice(0, maxItems);
      } else {
        list.push(strId);
        if (list.length > maxItems) list = list.slice(list.length - maxItems);
      }
      await setDoc(docRef, { viewedList: list, updatedAt: new Date() }, { merge: true });
      return true;
    } catch (e2) {
      console.error("addViewedHotel fallback failed:", e2);
      return false;
    }
  }
}

/**
 * setupViewedTracking
 * - Lắng nghe click (event delegation) trên document để detect các element chứa data-hotel-id
 * - Nếu tìm được hotelId => gọi addViewedHotel(userId, hotelId)
 * - Debounce per-hotel để tránh ghi lặp khi click nhiều lần trong tích tắc
 */
function setupViewedTracking() {
  // tránh tạo nhiều listener
  if (window.__staywise_viewed_tracking_installed) return;
  window.__staywise_viewed_tracking_installed = true;

  // map hotelId => lastTimestamp
  const lastSeen = new Map();
  const MIN_INTERVAL_MS = 1000; // 1s: nếu đã ghi trong 1s thì bỏ qua

  document.addEventListener('click', (ev) => {
    try {
      const el = ev.target;
      const item = (el.closest && el.closest('[data-hotel-id], a[data-hotel-id], [data-view-href]')) || null;
      if (!item) {
        // fallback: nếu click vào <a href="hotel.html?id=123">
        const a = (el.closest && el.closest('a[href*="hotel"]')) || null;
        if (a) {
          const id = extractHotelIdFromHref(a.getAttribute('href'));
          if (id) {
            maybeRecord(id);
          }
        }
        return;
      }

      // ưu tiên dataset.hotelId, dataset.id, dataset.viewHref (nếu dev set)
      const ds = item.dataset || {};
      let hotelId = ds.hotelId || ds.id || ds.viewId || null;

      if (!hotelId) {
        // nếu là <a href="...id=..."> lấy id từ href
        if (item.tagName === 'A' && item.getAttribute('href')) {
          hotelId = extractHotelIdFromHref(item.getAttribute('href'));
        } else if (item.getAttribute) {
          const href = item.getAttribute('href');
          if (href) hotelId = extractHotelIdFromHref(href);
        }
      }

      if (hotelId) maybeRecord(hotelId);
    } catch (e) {
      console.error('setupViewedTracking click handler error:', e);
    }
  }, { passive: true });

  function extractHotelIdFromHref(href) {
    if (!href) return null;
    try {
      // url có thể là "hotel.html?id=123" hoặc "/hotel/123"
      const u = new URL(href, location.origin);
      if (u.searchParams.has('id')) return u.searchParams.get('id');
      if (u.searchParams.has('hotelId')) return u.searchParams.get('hotelId');

      // fallback: path patterns /hotel/123
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.findIndex(p => /hotel/i.test(p));
      if (idx >= 0 && parts[idx+1]) return parts[idx+1];
    } catch (e) {
      // nếu href không phải url hợp lệ (relative weird), try regex
      const m = href.match(/[?&](?:id|hotelId)=([^&]+)/);
      if (m) return m[1];
      const m2 = href.match(/\/hotel\/([^\/?#]+)/i);
      if (m2) return m2[1];
    }
    return null;
  }

  async function maybeRecord(rawId) {
    const hotelId = String(rawId);
    const now = Date.now();
    const last = lastSeen.get(hotelId) || 0;
    if (now - last < MIN_INTERVAL_MS) return; // bỏ qua nếu gọi quá nhanh
    lastSeen.set(hotelId, now);

    // nếu user đã login thì gọi addViewedHotel, không block UI
    const user = auth.currentUser;
    if (user && user.uid) {
      // không cần await, nhưng log lỗi nếu failed
      addViewedHotel(user.uid, hotelId, { maxItems: 50, newestFirst: false })
        .then(ok => {
          if (!ok) console.warn('addViewedHotel returned false for', hotelId);
        })
        .catch(err => console.error('addViewedHotel error:', err));
    } else {
      // optional: lưu tạm local (nếu bạn muốn sync khi login)
      try {
        const key = 'staywise_anon_viewed';
        let arr = JSON.parse(localStorage.getItem(key) || '[]');
        // remove duplicates and push to tail (newest at end)
        arr = arr.filter(id => String(id) !== hotelId);
        arr.push(hotelId);
        if (arr.length > 50) arr = arr.slice(arr.length - 50);
        localStorage.setItem(key, JSON.stringify(arr));
      } catch (e) { /* ignore */ }
    }
  }
}

/**
 * recordViewedHotel
 * - Hàm tiện lợi để gọi từ trang detail khi page load: window.recordViewedHotel(hotelId)
 */
window.recordViewedHotel = async function recordViewedHotel(hotelId) {
  if (!hotelId) return;
  try {
    const user = auth.currentUser;
    if (!user || !user.uid) {
      // nếu muốn, sync local -> server khi user login (không implement ở đây)
      console.warn('recordViewedHotel: user not logged in, saved local only');
      const key = 'staywise_anon_viewed';
      let arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr = arr.filter(id => String(id) !== String(hotelId));
      arr.push(String(hotelId));
      if (arr.length > 50) arr = arr.slice(arr.length - 50);
      localStorage.setItem(key, JSON.stringify(arr));
      return;
    }
    await addViewedHotel(user.uid, hotelId, { maxItems: 50, newestFirst: false });
  } catch (e) {
    console.error('recordViewedHotel error:', e);
  }
};

// --- 3. MAIN LISTENER ---
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo Recaptcha
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
    }

    // Cập nhật ngôn ngữ cho các thẻ tĩnh ngay khi load
    updatePageLanguage();

    setupTabSwitching();

    // Gắn sự kiện cho container "Đã xem" 1 lần duy nhất
    const viewedContainer = document.getElementById('viewed-hotels-list');
    if (viewedContainer) {
        setupProfileCardListeners(viewedContainer);
    }

    // Thiết lập tracking xem khách sạn (click / link / record)
    setupViewedTracking();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadUserData(user);
            setupLinkPhoneAction(user);
            setupSecurityFeatures(user);
            setupNotificationSettings(user);

            // Khi user login, có thể muốn sync local anon viewed -> server (nếu có)
            // Đồng bộ local 'staywise_anon_viewed' lên user_views (giữ newest at end)
            try {
              const key = 'staywise_anon_viewed';
              const anonArr = JSON.parse(localStorage.getItem(key) || '[]');
              if (Array.isArray(anonArr) && anonArr.length > 0) {
                // push từng id theo thứ tự local (local newest at end)
                for (const hid of anonArr) {
                  // không await để tránh block UI, nhưng chờ 100ms giữa các lần để giảm race
                  addViewedHotel(user.uid, hid, { maxItems: 50, newestFirst: false })
                    .catch(e => console.warn('sync anon viewed failed', e));
                  await new Promise(r => setTimeout(r, 100));
                }
                localStorage.removeItem(key);
              }
            } catch (e) { /* ignore */ }

        } else {
            window.location.href = "index.html";
        }
    });

    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveBasicProfile();
        });
    }

    // Lắng nghe sự kiện đổi ngôn ngữ (nếu header có bắn event này)
    window.addEventListener('languageChanged', () => {
        updatePageLanguage();
        // Nếu đang ở tab đã xem, render lại để cập nhật ngôn ngữ thẻ
        const viewedSection = document.getElementById('viewed-section');
        if (viewedSection && viewedSection.style.display !== 'none') {
            renderViewedHotels();
        }
    });
});

// --- 4. TÍNH NĂNG CHUYỂN TAB ---
function setupTabSwitching() {
    const navInfo = document.getElementById('nav-info');
    const navSecurity = document.getElementById('nav-security');
    const navNotify = document.getElementById('nav-notify');
    const navViewed = document.getElementById('nav-viewed'); 

    const sectionInfo = document.getElementById('info-section');
    const sectionSecurity = document.getElementById('security-section');
    const sectionSettings = document.getElementById('settings-section');
    const sectionViewed = document.getElementById('viewed-section'); 

    const switchTab = (activeNav, showSection) => {
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        if(activeNav) activeNav.parentElement.classList.add('active');
        
        if (sectionInfo) sectionInfo.style.display = 'none';
        if (sectionSecurity) sectionSecurity.style.display = 'none';
        if (sectionSettings) sectionSettings.style.display = 'none';
        if (sectionViewed) sectionViewed.style.display = 'none';
        
        if (showSection) showSection.style.display = 'block';
    };

    if (navInfo) navInfo.addEventListener('click', (e) => { e.preventDefault(); switchTab(navInfo, sectionInfo); });
    if (navSecurity) navSecurity.addEventListener('click', (e) => { e.preventDefault(); switchTab(navSecurity, sectionSecurity); });
    if (navNotify) navNotify.addEventListener('click', (e) => { e.preventDefault(); switchTab(navNotify, sectionSettings); });
    
    // Logic cho tab đã xem
    if (navViewed) {
        navViewed.addEventListener('click', (e) => { 
            e.preventDefault(); 
            switchTab(navViewed, sectionViewed);
            renderViewedHotels(); // Gọi hàm tải dữ liệu
        }); 
    }
}

// --- 5. LOGIC BẢO MẬT (ĐẦY ĐỦ) ---
function setupSecurityFeatures(user) {
    const changePassForm = document.getElementById('change-pass-form');
    if (changePassForm) {
        const hasPasswordProvider = user.providerData.some((userInfo) => userInfo.providerId === 'password');
        if (!hasPasswordProvider) {
            const cardContainer = changePassForm.closest('.profile-card');
            if (cardContainer) cardContainer.style.display = 'none';
        }
    }
    if (changePassForm) {
        changePassForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPass = document.getElementById('current-pass').value;
            const newPass = document.getElementById('new-pass').value;
            const confirmPass = document.getElementById('confirm-pass').value;
            const btn = document.getElementById('btn-change-pass');

            if (newPass !== confirmPass) return showToast("Mật khẩu xác nhận không khớp!", "error");
            if (newPass.length < 6) return showToast("Mật khẩu mới phải trên 6 ký tự", "error");

            try {
                btn.innerText = "Processing..."; btn.disabled = true;
                const credential = EmailAuthProvider.credential(user.email, currentPass);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPass);
                showToast("Đổi mật khẩu thành công!", "success");
                changePassForm.reset();
            } catch (error) {
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') showToast("Mật khẩu hiện tại không đúng.", "error");
                else showToast("Lỗi: " + error.message, "error");
            } finally {
                const lang = localStorage.getItem("staywise_lang") || "vi";
                const dict = (typeof UI_TRANSLATIONS !== 'undefined') ? UI_TRANSLATIONS[lang] : {};
                btn.innerText = dict['btn_update_pass'] || "Cập nhật mật khẩu";
                btn.disabled = false;
            }
        });
    }

    const btnDeleteTrigger = document.getElementById('btn-delete-acc');
    const deleteModal = document.getElementById('delete-modal');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');

    if (btnDeleteTrigger) {
        btnDeleteTrigger.onclick = () => {
            if (deleteModal) deleteModal.classList.add('visible');
            const inputPass = document.getElementById('delete-confirm-pass');
            if(inputPass) inputPass.value = '';
        };
    }
    if (btnCancelDelete) btnCancelDelete.onclick = () => deleteModal && deleteModal.classList.remove('visible');
    if (btnConfirmDelete) {
        btnConfirmDelete.onclick = async () => {
            const pass = document.getElementById('delete-confirm-pass').value;
            if (!pass) return showToast("Vui lòng nhập mật khẩu", "error");
            try {
                btnConfirmDelete.innerText = "..."; btnConfirmDelete.disabled = true;
                const credential = EmailAuthProvider.credential(user.email, pass);
                await reauthenticateWithCredential(user, credential);
                await deleteUser(user);
                showToast("Đã xóa tài khoản vĩnh viễn.", "success");
                setTimeout(() => window.location.href = "index.html", 1000);
            } catch (error) {
                const lang = localStorage.getItem("staywise_lang") || "vi";
                const dict = (typeof UI_TRANSLATIONS !== 'undefined') ? UI_TRANSLATIONS[lang] : {};
                btnConfirmDelete.innerText = dict['btn_del_perm'] || "Xóa vĩnh viễn";
                btnConfirmDelete.disabled = false;
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') showToast("Mật khẩu không đúng.", "error");
                else showToast("Lỗi: " + error.message, "error");
            }
        };
    }
}

// --- 6. CÀI ĐẶT THÔNG BÁO ---
async function setupNotificationSettings(user) {
    const toggles = { promotion: document.getElementById('notif-promotion'), account: document.getElementById('notif-account') };
    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const settings = docSnap.data().settings || {};
            if (toggles.promotion) toggles.promotion.checked = settings.promotion ?? true;
            if (toggles.account) toggles.account.checked = settings.account ?? true;
        }
    } catch (e) { console.error("Lỗi tải thông báo:", e); }
    const saveSettings = async () => {
        const newSettings = { promotion: toggles.promotion ? toggles.promotion.checked : true, account: toggles.account ? toggles.account.checked : true, updatedAt: new Date() };
        try { await setDoc(doc(db, "users", user.uid), { settings: newSettings }, { merge: true }); } catch (e) { console.error("Error saving:", e); }
    };
    if (toggles.promotion) toggles.promotion.addEventListener('change', saveSettings);
    if (toggles.account) toggles.account.addEventListener('change', saveSettings);
}

// --- 7. LOAD USER DATA ---
async function loadUserData(user) {
    const nameInput = document.getElementById('fullname');
    if (nameInput) nameInput.value = user.displayName || "";
    const phoneArea = document.getElementById('phone-display-area');
    const addPhoneBtn = document.getElementById('btn-add-phone');
    const phone = user.phoneNumber;
    const lang = localStorage.getItem("staywise_lang") || "vi";
    const dict = (typeof UI_TRANSLATIONS !== 'undefined' && UI_TRANSLATIONS[lang]) ? UI_TRANSLATIONS[lang] : {};
    const txtVerified = dict['txt_verified'] || "Đã xác thực";
    const btnChange = dict['btn_change_phone'] || "Đổi số khác";
    const btnLink = dict['btn_link_phone'] || "+ Liên kết SĐT";
    
    if (phoneArea) {
        if (phone) {
            phoneArea.innerHTML = `<div class="data-item" style="display:flex; align-items:center;"><span style="font-weight:bold; color:#31B3D9; font-size:16px;">${phone}</span><span class="badge-verified" style="background:#e8f5e9; color:#2e7d32; padding:2px 8px; border-radius:4px; font-size:12px; margin-left:10px;"><i class="fas fa-check-circle"></i> <span data-i18n="txt_verified">${txtVerified}</span></span></div>`;
            if (addPhoneBtn) { addPhoneBtn.textContent = btnChange; addPhoneBtn.setAttribute('data-i18n', 'btn_change_phone'); }
        } else {
            phoneArea.innerHTML = "";
            if (addPhoneBtn) { addPhoneBtn.textContent = btnLink; addPhoneBtn.setAttribute('data-i18n', 'btn_link_phone'); }
        }
    }
    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            const genderInput = document.getElementById('gender'); const dobInput = document.getElementById('dob'); const cityInput = document.getElementById('city');
            if (genderInput && data.gender) genderInput.value = data.gender;
            if (dobInput && data.dob) dobInput.value = data.dob;
            if (cityInput && data.city) cityInput.value = data.city;
        }
    } catch (e) { console.error(e); }
}

// --- 8. LIÊN KẾT SĐT ---
function setupLinkPhoneAction(user) {
    const btnOpen = document.getElementById('btn-add-phone');
    const modal = document.getElementById('phone-modal');
    const btnSave = document.getElementById('btn-confirm-phone');
    const btnCancel = document.getElementById('btn-cancel-phone');
    const phoneInput = document.getElementById('new-phone-input');
    const otpInput = document.getElementById('otp-input');
    const errorMsg = document.getElementById('phone-error-msg');
    const stepPhone = document.getElementById('step-phone-input');
    const stepOtp = document.getElementById('step-otp-input');
    
    if (!btnOpen || !modal) return;
    let confirmationResult = null; let isOtpStep = false;
    const getBtnText = (key, defaultText) => {
        const lang = localStorage.getItem("staywise_lang") || "vi";
        return ((typeof UI_TRANSLATIONS !== 'undefined' && UI_TRANSLATIONS[lang]) ? UI_TRANSLATIONS[lang][key] : defaultText) || defaultText;
    };
    
    btnOpen.onclick = (e) => {
        e.preventDefault(); modal.classList.add('visible'); isOtpStep = false;
        if (phoneInput) phoneInput.value = ""; if (otpInput) otpInput.value = "";
        if (stepPhone) stepPhone.style.display = 'block'; if (stepOtp) stepOtp.style.display = 'none';
        if (btnSave) { btnSave.innerText = getBtnText('btn_modal_save', "Lưu"); btnSave.disabled = false; }
        if (errorMsg) errorMsg.style.display = 'none'; setTimeout(() => phoneInput && phoneInput.focus(), 100);
    };
    
    const closeModal = () => { modal.classList.remove('visible'); };
    if (btnCancel) btnCancel.onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    
    if (btnSave) {
        btnSave.onclick = async () => {
            if (errorMsg) errorMsg.style.display = 'none';
            if (!isOtpStep) {
                let rawPhone = phoneInput.value.trim();
                if (rawPhone.startsWith('0')) rawPhone = rawPhone.substring(1);
                if (rawPhone.length < 9) { if (errorMsg) { errorMsg.innerText = "SĐT không hợp lệ"; errorMsg.style.display = 'block'; } return; }
                const fullPhone = "+84" + rawPhone;
                try {
                    btnSave.innerText = "..."; btnSave.disabled = true;
                    const appVerifier = window.recaptchaVerifier;
                    confirmationResult = await linkWithPhoneNumber(user, fullPhone, appVerifier);
                    isOtpStep = true; stepPhone.style.display = 'none'; stepOtp.style.display = 'block';
                    btnSave.innerText = "OK"; btnSave.disabled = false; if (otpInput) otpInput.focus();
                } catch (error) {
                    btnSave.disabled = false; btnSave.innerText = getBtnText('btn_modal_save', "Lưu");
                    if (errorMsg) { errorMsg.innerText = "Lỗi: " + error.message; errorMsg.style.display = 'block'; }
                    if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(id => grecaptcha.reset(id));
                }
            } else {
                const code = otpInput.value.trim();
                if (code.length < 6) return showToast("OTP 6 digits required", "error");
                try {
                    btnSave.innerText = "..."; btnSave.disabled = true;
                    await confirmationResult.confirm(code);
                    const rawPhone = phoneInput.value.trim().replace(/^0/, '');
                    await setDoc(doc(db, "users", user.uid), { phoneNumber: "+84" + rawPhone, email: user.email, updatedAt: new Date() }, { merge: true });
                    showToast("Success!", "success"); closeModal(); setTimeout(() => location.reload(), 1000);
                } catch (error) {
                    btnSave.disabled = false; btnSave.innerText = "OK"; showToast("Wrong OTP", "error");
                }
            }
        };
    }
}

// --- 9. LƯU PROFILE CƠ BẢN ---
async function saveBasicProfile() {
    const user = auth.currentUser;
    const btn = document.getElementById('btn-save');
    const oldText = btn.innerText; btn.innerText = "..."; btn.disabled = true;
    try {
        const newName = document.getElementById('fullname').value.trim();
        if (newName && newName !== user.displayName) {
            await updateProfile(user, { displayName: newName });
            const cachedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            cachedUser.name = newName; localStorage.setItem('currentUser', JSON.stringify(cachedUser));
        }
        await setDoc(doc(db, "users", user.uid), {
            displayName: newName, gender: document.getElementById('gender').value,
            dob: document.getElementById('dob').value, city: document.getElementById('city').value, updatedAt: new Date()
        }, { merge: true });
        showToast("Saved!", "success"); setTimeout(() => location.reload(), 800);
    } catch (e) { showToast("Error: " + e.message, "error"); } finally { btn.innerText = oldText; btn.disabled = false; }
}

// ============================================================
// --- 10. LOGIC YÊU THÍCH ---
// ============================================================
function getLang() {
    return localStorage.getItem('staywise_lang') || 'vi';
}

function checkIsFavorite(hotelId) {
    const user = auth.currentUser;
    if (!user) return false;
    try {
        const key = FAV_KEY_PREFIX + user.uid;
        const favsRaw = localStorage.getItem(key);
        const favs = favsRaw ? JSON.parse(favsRaw) : [];
        return favs.includes(String(hotelId));
    } catch (e) { return false; }
}

async function syncFavoritesToCloud(userId, favIds) {
    try {
        await setDoc(doc(db, "favorites", userId), { hotels: favIds, updatedAt: Date.now() }, { merge: true });
    } catch (e) { console.error("Sync error:", e); }
}

async function toggleFavorite(hotelId) {
    const user = auth.currentUser;
    const lang = getLang();
    if (!user) {
        showToast(lang === 'en' ? "Please login!" : "Vui lòng đăng nhập!", "error");
        return false;
    }

    const userId = user.uid;
    const key = FAV_KEY_PREFIX + userId;
    let favIds = [];
    try { favIds = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { favIds = []; }

    const strId = String(hotelId);
    const willLike = !favIds.includes(strId);

    if (willLike) favIds.push(strId); 
    else favIds = favIds.filter(id => id !== strId);

    localStorage.setItem(key, JSON.stringify(favIds));
    await syncFavoritesToCloud(userId, favIds);
    return willLike;
}

// ============================================================
// --- 11. HÀM RENDER KHÁCH SẠN ĐÃ XEM (ĐÃ HOÀN THIỆN) ---
// ============================================================
async function renderViewedHotels() {
  const container = document.getElementById('viewed-hotels-list');
  if (!container) return;

  // Setup CSS Grid
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
  container.style.gap = '20px';

  // --- LẤY TỪ ĐIỂN NGÔN NGỮ CHUNG ---
  const lang = getLang();
  const dict = (typeof UI_TRANSLATIONS !== 'undefined' && UI_TRANSLATIONS[lang]) ? UI_TRANSLATIONS[lang] : {};
  const getText = (key, fallback) => dict[key] || fallback;

  // Hiển thị Loading
  container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#888; padding:40px;">
    <i class="fas fa-spinner fa-spin"></i> ${getText('txt_loading_data', 'Loading data...')}
  </div>`;

  const user = auth.currentUser;
  if (!user) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:40px;">
      ${getText('msg_login_viewed', 'Please login to view history.')}
    </div>`;
    return;
  }

  try {
    const docRef = doc(db, "user_views", user.uid);
    const snap = await getDoc(docRef);

    const rawList = (snap.exists() && Array.isArray(snap.data().viewedList)) ? snap.data().viewedList : [];

    if (!rawList || rawList.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#888; padding:40px;">
        ${getText('msg_no_viewed', 'No recently viewed hotels.')}
      </div>`;
      return;
    }

    // --- XỬ LÝ THỨ TỰ: giữ lần xem mới nhất ---
    // Lưu index xuất hiện *cuối cùng* của mỗi id trong rawList (index lớn hơn = xem sau = mới hơn)
    const lastIndexMap = new Map();
    rawList.forEach((id, idx) => lastIndexMap.set(String(id), idx));

    // Lấy id duy nhất và sắp xếp theo lastIndex giảm dần => newest first
    const viewedIds = Array.from(lastIndexMap.keys())
      .sort((a, b) => lastIndexMap.get(b) - lastIndexMap.get(a));

    // Map vị trí nhanh (0 = newest)
    const pos = new Map();
    viewedIds.forEach((id, idx) => pos.set(String(id), idx));

    // Load master data và lọc theo pos, sắp xếp theo pos để đảm bảo thứ tự hiển thị
    const allHotels = await loadMasterHotelsData();
    const hotelsToShow = allHotels
      .filter(h => pos.has(String(h.id)))
      .sort((a, b) => pos.get(String(a.id)) - pos.get(String(b.id)));

    if (hotelsToShow.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#888; padding:40px;">
        ${getText('msg_no_viewed', 'No recently viewed hotels.')}
      </div>`;
      return;
    }

    // DEBUG (bỏ hoặc giữ tuỳ bạn)
    console.log('rawList from firestore:', rawList);
    console.log('computed viewedIds (newest first):', viewedIds);
    console.log('hotelsToShow ids (in render order):', hotelsToShow.map(h => h.id));

    // Render danh sách (Có Fix lỗi Icon Type)
    const cardPromises = hotelsToShow.map(async (h) => {
      // Tạo bản sao và chuẩn hóa dữ liệu Type giống trang Explore
      const hotelData = { ...h };
      if (!hotelData.type && hotelData.typeLabel) {
        hotelData.type = hotelData.typeLabel;
      }

      const isFav = checkIsFavorite(hotelData.id);

      // createHotelCard nên trả về HTML string. Nếu trả về DOM element thì cần xử lý khác.
      return await createHotelCard(hotelData, hotelData.id, isFav);
    });

    const cardsHtmlArray = await Promise.all(cardPromises);

    // Nếu createHotelCard trả về element chứ không phải string, bạn cần map sang outerHTML:
    // container.innerHTML = cardsHtmlArray.map(c => (c instanceof HTMLElement ? c.outerHTML : String(c))).join('');
    container.innerHTML = cardsHtmlArray.join('');

  } catch (e) {
    console.error("Render viewed hotels error:", e);
    container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:red; padding:40px;">
      ${getText('msg_error_loading', 'Error loading data.')}
    </div>`;
  }
}

// --- 12. HÀM GẮN SỰ KIỆN (CHỈ CHẠY 1 LẦN) ---
function setupProfileCardListeners(container) {
    container.addEventListener('click', async (e) => {
        // 1. Xử lý nút Tim (Code cũ của bạn)
        const btn = e.target.closest('.favorite-btn');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            // ... (giữ nguyên logic thả tim cũ) ...
            return; // Dừng lại, không chạy code bên dưới
        }

        // 2. THÊM MỚI: Xử lý click vào thẻ để chuyển trang (Giống favourite.js)
        const card = e.target.closest('.hotel-card');
        // Chỉ chạy nếu click vào card VÀ không phải click vào nút tim
        if (card && container.contains(card)) {
            // Lấy ID. Lưu ý: createHotelCard phải trả về HTML có chứa data-hotel-id hoặc data-id
            // Nếu createHotelCard không gán data-hotel-id vào div cha, ta có thể lấy từ nút tim con
            let hotelId = card.getAttribute('data-hotel-id') || card.dataset.id;
            
            // Fallback: Tìm ID từ nút tim bên trong nếu thẻ cha không có
            if (!hotelId) {
                const innerBtn = card.querySelector('.favorite-btn');
                if (innerBtn) hotelId = innerBtn.dataset.id;
            }

            if (hotelId) {
                // Chuyển trang
                const url = `information_page.html?id=${hotelId}`; // Sửa lại đường dẫn nếu file detail của bạn tên khác
                window.location.href = url;
            }
        }
    });
}
