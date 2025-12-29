// --- 1. IMPORT ĐẦY ĐỦ CÁC HÀM CẦN THIẾT ---
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    updateProfile, 
    RecaptchaVerifier,
    linkWithPhoneNumber,
    updatePassword,             
    reauthenticateWithCredential, 
    EmailAuthProvider,          
    deleteUser                  
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from "./toast.js";

// --- CẤU HÌNH FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyACfhRC94Wt-_q7h1f-1cJjOV06nP9SVag",
    authDomain: "staywise-8d5dd.firebaseapp.com",
    projectId: "staywise-8d5dd",
    storageBucket: "staywise-8d5dd.firebasestorage.app",
    messagingSenderId: "308886745296",
    appId: "1:308886745296:web:a43170c671e27df804aed5"
};

// --- 2. LOGIC KHỞI TẠO THÔNG MINH ---
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp(); 
}

const auth = getAuth(app);
const db = getFirestore(app);
auth.useDeviceLanguage();

// --- 3. KHỞI TẠO RECAPTCHA ẨN ---
window.initRecaptcha = () => {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
        });
    }
}

// --- MAIN LISTENER ---
document.addEventListener('DOMContentLoaded', () => {
    window.initRecaptcha();
    setupTabSwitching();

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await loadUserData(user);
            setupLinkPhoneAction(user);
            setupSecurityFeatures(user);
            setupNotificationSettings(user);
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
});

// --- 4. TÍNH NĂNG CHUYỂN TAB ---
function setupTabSwitching() {
    const navInfo = document.getElementById('nav-info');
    const navSecurity = document.getElementById('nav-security');
    const navNotify = document.getElementById('nav-notify');

    const sectionInfo = document.getElementById('info-section');
    const sectionSecurity = document.getElementById('security-section');
    const sectionSettings = document.getElementById('settings-section');

    const switchTab = (activeNav, showSection) => {
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        if(activeNav) activeNav.parentElement.classList.add('active');
        
        if (sectionInfo) sectionInfo.style.display = 'none';
        if (sectionSecurity) sectionSecurity.style.display = 'none';
        if (sectionSettings) sectionSettings.style.display = 'none';
        
        if (showSection) showSection.style.display = 'block';
    };

    if (navInfo) navInfo.addEventListener('click', (e) => { e.preventDefault(); switchTab(navInfo, sectionInfo); });
    if (navSecurity) navSecurity.addEventListener('click', (e) => { e.preventDefault(); switchTab(navSecurity, sectionSecurity); });
    if (navNotify) navNotify.addEventListener('click', (e) => { e.preventDefault(); switchTab(navNotify, sectionSettings); });
}

// --- 5. LOGIC BẢO MẬT & ẨN HIỆN FORM ---
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
                btn.innerText = "Processing..."; // Could be i18n
                btn.disabled = true;
                const credential = EmailAuthProvider.credential(user.email, currentPass);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPass);
                showToast("Đổi mật khẩu thành công!", "success");
                changePassForm.reset();
            } catch (error) {
                console.error(error);
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    showToast("Mật khẩu hiện tại không đúng.", "error");
                } else {
                    showToast("Lỗi: " + error.message, "error");
                }
            } finally {
                // Reset button text based on lang (Optional, but good UX)
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
    if (btnCancelDelete) {
        btnCancelDelete.onclick = () => deleteModal && deleteModal.classList.remove('visible');
    }
    if (btnConfirmDelete) {
        btnConfirmDelete.onclick = async () => {
            const pass = document.getElementById('delete-confirm-pass').value;
            if (!pass) return showToast("Vui lòng nhập mật khẩu", "error");
            try {
                btnConfirmDelete.innerText = "...";
                btnConfirmDelete.disabled = true;
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
                if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    showToast("Mật khẩu không đúng.", "error");
                } else {
                    showToast("Lỗi: " + error.message, "error");
                }
            }
        };
    }
}

// --- 6. LOGIC CÀI ĐẶT THÔNG BÁO ---
async function setupNotificationSettings(user) {
    const toggles = {
        promotion: document.getElementById('notif-promotion'), 
        account: document.getElementById('notif-account')      
    };

    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            const settings = data.settings || {};
            if (toggles.promotion) toggles.promotion.checked = settings.promotion ?? true;
            if (toggles.account) toggles.account.checked = settings.account ?? true;
        }
    } catch (e) { console.error("Lỗi tải thông báo:", e); }

    const saveSettings = async () => {
        const newSettings = {
            promotion: toggles.promotion ? toggles.promotion.checked : true,
            account: toggles.account ? toggles.account.checked : true,
            updatedAt: new Date()
        };
        try {
            await setDoc(doc(db, "users", user.uid), { settings: newSettings }, { merge: true });
            console.log("Saved notification settings");
        } catch (e) {
            console.error("Error saving:", e);
        }
    };

    if (toggles.promotion) toggles.promotion.addEventListener('change', saveSettings);
    if (toggles.account) toggles.account.addEventListener('change', saveSettings);
}

// --- 7. TẢI DỮ LIỆU & ĐA NGÔN NGỮ (QUAN TRỌNG) ---
async function loadUserData(user) {
    const nameInput = document.getElementById('fullname');
    if (nameInput) nameInput.value = user.displayName || "";

    const phoneArea = document.getElementById('phone-display-area');
    const addPhoneBtn = document.getElementById('btn-add-phone');
    const phone = user.phoneNumber;

    // === START: LOGIC ĐA NGÔN NGỮ ===
    const lang = localStorage.getItem("staywise_lang") || "vi";
    // Lấy từ điển từ settings.js (được load ở global scope)
    const dict = (typeof UI_TRANSLATIONS !== 'undefined' && UI_TRANSLATIONS[lang]) ? UI_TRANSLATIONS[lang] : {};

    // Lấy các từ khóa, nếu không có thì dùng tiếng Việt mặc định
    const txtVerified = dict['txt_verified'] || "Đã xác thực";
    const btnChange = dict['btn_change_phone'] || "Đổi số khác";
    const btnLink = dict['btn_link_phone'] || "+ Liên kết SĐT";
    // === END LOGIC ===

    if (phoneArea) {
        if (phone) {
            phoneArea.innerHTML = `
                <div class="data-item" style="display:flex; align-items:center;">
                    <span style="font-weight:bold; color:#31B3D9; font-size:16px;">${phone}</span>
                    <span class="badge-verified" style="background:#e8f5e9; color:#2e7d32; padding:2px 8px; border-radius:4px; font-size:12px; margin-left:10px;">
                        <i class="fas fa-check-circle"></i> <span data-i18n="txt_verified">${txtVerified}</span>
                    </span>
                </div>`;
            
            // Cập nhật nút Đổi số
            if (addPhoneBtn) {
                addPhoneBtn.textContent = btnChange;
                addPhoneBtn.setAttribute('data-i18n', 'btn_change_phone');
            }
        } else {
            phoneArea.innerHTML = "";
            // Cập nhật nút Liên kết
            if (addPhoneBtn) {
                addPhoneBtn.textContent = btnLink;
                addPhoneBtn.setAttribute('data-i18n', 'btn_link_phone');
            }
        }
    }

    try {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            const genderInput = document.getElementById('gender');
            const dobInput = document.getElementById('dob');
            const cityInput = document.getElementById('city');

            if (genderInput && data.gender) genderInput.value = data.gender;
            if (dobInput && data.dob) dobInput.value = data.dob;
            if (cityInput && data.city) cityInput.value = data.city;
        }
    } catch (e) { console.error(e); }
}

// --- 8. LOGIC LIÊN KẾT SĐT ---
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

    let confirmationResult = null;
    let isOtpStep = false; 

    // Helper để lấy text nút tùy ngôn ngữ
    const getBtnText = (key, defaultText) => {
        const lang = localStorage.getItem("staywise_lang") || "vi";
        const dict = (typeof UI_TRANSLATIONS !== 'undefined' && UI_TRANSLATIONS[lang]) ? UI_TRANSLATIONS[lang] : {};
        return dict[key] || defaultText;
    };

    btnOpen.onclick = (e) => {
        e.preventDefault();
        modal.classList.add('visible'); 
        isOtpStep = false;
        if (phoneInput) phoneInput.value = "";
        if (otpInput) otpInput.value = "";
        if (stepPhone) stepPhone.style.display = 'block';
        if (stepOtp) stepOtp.style.display = 'none';
        
        if (btnSave) { 
            btnSave.innerText = getBtnText('btn_modal_save', "Lưu"); 
            btnSave.disabled = false; 
        }
        if (errorMsg) errorMsg.style.display = 'none';
        setTimeout(() => phoneInput && phoneInput.focus(), 100);
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
                if (rawPhone.length < 9) {
                    if (errorMsg) { errorMsg.innerText = "SĐT không hợp lệ / Invalid Phone"; errorMsg.style.display = 'block'; }
                    return;
                }
                const fullPhone = "+84" + rawPhone;
                try {
                    btnSave.innerText = "..."; btnSave.disabled = true;
                    const appVerifier = window.recaptchaVerifier;
                    confirmationResult = await linkWithPhoneNumber(user, fullPhone, appVerifier);
                    isOtpStep = true;
                    stepPhone.style.display = 'none'; stepOtp.style.display = 'block';
                    btnSave.innerText = "OK"; btnSave.disabled = false;
                    if (otpInput) otpInput.focus();
                    if (typeof showToast === 'function') showToast("OTP Sent!", "info");
                } catch (error) {
                    console.error(error);
                    btnSave.disabled = false; 
                    btnSave.innerText = getBtnText('btn_modal_save', "Lưu");
                    if (errorMsg) { errorMsg.innerText = "Lỗi: " + error.message; errorMsg.style.display = 'block'; }
                    if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(id => grecaptcha.reset(id));
                }
            } else {
                const code = otpInput.value.trim();
                if (code.length < 6) { if (typeof showToast === 'function') showToast("OTP 6 digits required", "error"); return; }
                try {
                    btnSave.innerText = "..."; btnSave.disabled = true;
                    await confirmationResult.confirm(code);
                    const rawPhone = phoneInput.value.trim().replace(/^0/, '');
                    await setDoc(doc(db, "users", user.uid), {
                        phoneNumber: "+84" + rawPhone, email: user.email, updatedAt: new Date()
                    }, { merge: true });
                    if (typeof showToast === 'function') showToast("Success!", "success");
                    closeModal();
                    setTimeout(() => location.reload(), 1000);
                } catch (error) {
                    console.error(error);
                    btnSave.disabled = false; btnSave.innerText = "OK";
                    if (typeof showToast === 'function') showToast("Wrong OTP", "error");
                }
            }
        };
    }
}

// --- 9. HÀM LƯU THÔNG TIN CƠ BẢN ---
async function saveBasicProfile() {
    const user = auth.currentUser;
    const btn = document.getElementById('btn-save');
    const oldText = btn.innerText;
    btn.innerText = "...";
    btn.disabled = true;

    try {
        const newName = document.getElementById('fullname').value.trim();
        const gender = document.getElementById('gender').value;
        const dob = document.getElementById('dob').value;
        const city = document.getElementById('city').value;

        if (newName && newName !== user.displayName) {
            await updateProfile(user, { displayName: newName });
            const cachedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            cachedUser.name = newName;
            localStorage.setItem('currentUser', JSON.stringify(cachedUser));
        }

        await setDoc(doc(db, "users", user.uid), {
            displayName: newName,
            email: user.email,
            gender: gender,
            dob: dob,
            city: city,
            updatedAt: new Date()
        }, { merge: true });

        if (typeof showToast === 'function') showToast("Saved!", "success");
        setTimeout(() => location.reload(), 800);
    } catch (e) {
        console.error(e);
        if (typeof showToast === 'function') showToast("Error: " + e.message, "error");
    } finally {
        btn.innerText = oldText;
        btn.disabled = false;
    }
}