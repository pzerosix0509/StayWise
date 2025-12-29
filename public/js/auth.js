import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithPopup, 
    GoogleAuthProvider, 
    FacebookAuthProvider, 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
// Thêm các hàm Firestore để tìm kiếm SĐT
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { showToast } from "./toast.js"; 

// ============================================================
// 1. CẤU HÌNH FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyACfhRC94Wt-_q7h1f-1cJjOV06nP9SVag",
    authDomain: "staywise-8d5dd.firebaseapp.com",
    projectId: "staywise-8d5dd",
    storageBucket: "staywise-8d5dd.firebasestorage.app",
    messagingSenderId: "308886745296",
    appId: "1:308886745296:web:a43170c671e27df804aed5",
    measurementId: "G-NZ1VYTTCGY"
};

let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
auth.useDeviceLanguage();

export { app, auth };

// ============================================================
// 2. TỪ ĐIỂN & HELPER
// ============================================================

const AUTH_LANG = {
    vi: {
        welcome: "Xin chào",
        login_success: "Đăng nhập thành công!",
        login_fail: "Đăng nhập thất bại!",
        login_error: "Sai thông tin hoặc mật khẩu.",
        register_success: "Đăng ký thành công!",
        pass_confirm_err: "Mật khẩu không khớp!",
        name_err: "Vui lòng nhập họ tên!",
        email_used: "Email đã được sử dụng.",
        email_req: "Vui lòng nhập email",
        reset_sent: "Đã gửi email khôi phục tới:",
        email_not_found: "Email chưa đăng ký.",
        logout_success: "Đã đăng xuất!",
        processing: "Đang xử lý...",
        sending: "Đang gửi...",
        logging_in: "Đang đăng nhập...",
        btn_login: "Đăng nhập",
        btn_register: "Đăng ký",
        // Text cho menu dropdown
        menu_profile: "Hồ sơ",
        btn_logout: "Đăng xuất",
        member_badge: "Thành viên",
        // Login Phone
        label_login_input: "Email hoặc Số điện thoại",
        ph_login_input: "Nhập email hoặc SĐT đã liên kết",
        err_phone_not_found: "Số điện thoại này chưa được liên kết với tài khoản nào.",
    },
    en: {
        welcome: "Hello",
        login_success: "Login successful!",
        login_fail: "Login failed!",
        login_error: "Invalid credentials.",
        register_success: "Registration successful!",
        pass_confirm_err: "Passwords do not match!",
        name_err: "Enter full name!",
        email_used: "Email already in use.",
        email_req: "Enter email",
        reset_sent: "Reset email sent to:",
        email_not_found: "Email not found.",
        logout_success: "Logged out!",
        processing: "Processing...",
        sending: "Sending...",
        logging_in: "Logging in...",
        btn_login: "Login",
        btn_register: "Register",
        // Text for dropdown
        menu_profile: "Profile",
        btn_logout: "Logout",
        member_badge: "Member",
        // Login Phone
        label_login_input: "Email or Phone Number",
        ph_login_input: "Enter email or linked phone",
        err_phone_not_found: "This phone number is not linked to any account.",
    }
};

function getAuthText(key) {
    const lang = localStorage.getItem('staywise_lang') || 'vi';
    return AUTH_LANG[lang][key] || AUTH_LANG['vi'][key];
}

function resetBtn(btn, text, disabled) { 
    if(btn) { btn.disabled = disabled; btn.innerText = text; }
}

function closeAllModals() {
    ['login-modal-overlay', 'signup-modal-overlay', 'forgot-modal-overlay'].forEach(id => {
        document.getElementById(id)?.classList.remove('visible');
    });
}

function attachAuthButtonEvents(container) {
    const loginBtn = container.querySelector('.btn-secondary');
    const signupBtn = container.querySelector('.btn-primary');
    
    if (loginBtn) {
        loginBtn.onclick = (e) => {
            e.preventDefault();
            document.getElementById('login-modal-overlay')?.classList.add('visible');
        };
    }
    if (signupBtn) {
        signupBtn.onclick = (e) => {
            e.preventDefault();
            document.getElementById('signup-modal-overlay')?.classList.add('visible');
        };
    }
}

// ============================================================
// 3. LOGIC ĐĂNG NHẬP (SĐT/EMAIL + PASS)
// ============================================================

async function findEmailByPhone(phoneNumber) {
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
        formattedPhone = "+84" + formattedPhone.substring(1);
    }
    const q = query(collection(db, "users"), where("phoneNumber", "==", formattedPhone));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    } else {
        return querySnapshot.docs[0].data().email;
    }
}

const handleLoginSuccess = (user) => {
    const displayName = user.displayName || user.email?.split('@')[0] || "User";
    const userData = {
        name: displayName,
        email: user.email,
        avatarUrl: user.photoURL,
        uid: user.uid
    };
    localStorage.setItem('currentUser', JSON.stringify(userData));
    closeAllModals();
    showToast(`${getAuthText('welcome')} ${displayName}!`, "success");
    updateHeaderUI(user); 
    setTimeout(() => { window.location.reload(); }, 1500);
};

const handleSocialLogin = (provider, providerName) => {
    signInWithPopup(auth, provider)
        .then((result) => handleLoginSuccess(result.user))
        .catch((error) => {
            if (error.code === 'auth/popup-closed-by-user') return;
            showToast(`${getAuthText('login_fail')} (${providerName})`, "error");
        });
};

// --- CẬP NHẬT HEADER (ĐÃ SỬA ĐỂ TỰ ĐỘNG DỊCH) ---
const updateHeaderUI = (user) => {
    const authButtonsContainer = document.querySelector('.auth-buttons');
    if (!authButtonsContainer) return;
    authButtonsContainer.style.visibility = "visible";
    
    // Lấy text mặc định (theo ngôn ngữ hiện tại lúc load)
    const txtLogout = getAuthText('btn_logout');
    const txtLogin = getAuthText('btn_login');
    const txtRegister = getAuthText('btn_register');
    const txtProfile = getAuthText('menu_profile');
    const txtBadge = getAuthText('member_badge');

    if (user) {
        // --- ĐÃ ĐĂNG NHẬP ---
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        const photoURL = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
        
        authButtonsContainer.innerHTML = `
        <div class="user-dropdown-container">
            <div class="user-trigger" id="user-menu-btn">
                <img src="${photoURL}" class="user-avatar" alt="Avatar">
                <span class="user-name">${displayName}</span>
                <i class="fas fa-caret-down"></i>
            </div>
            <div class="user-dropdown-menu" id="user-dropdown">
                <div class="dropdown-header-info">
                    <strong>${displayName}</strong>
                    <span class="membership-badge">
                        <i class="fas fa-medal"></i> <span data-i18n="member_badge">${txtBadge}</span>
                    </span>
                </div>
                
                <a href="profile.html" class="menu-item" id="nav-profile">
                    <i class="fas fa-user-edit"></i> 
                    <span data-i18n="menu_profile">${txtProfile}</span>
                </a>
                
                <div class="menu-divider"></div>
                
                <div class="menu-item" id="btn-logout-action" style="cursor: pointer;">
                    <i class="fas fa-sign-out-alt"></i> 
                    <span data-i18n="btn_logout">${txtLogout}</span>
                </div>
            </div>
        </div>`;

        const menuBtn = document.getElementById('user-menu-btn');
        const dropdown = document.getElementById('user-dropdown');
        if (menuBtn && dropdown) {
            menuBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('active'); });
            document.addEventListener('click', (e) => {
                if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('active');
            });
        }

        document.getElementById('btn-logout-action')?.addEventListener('click', () => {
            localStorage.removeItem('currentUser'); 
            signOut(auth).then(() => {
                showToast(getAuthText('logout_success'), "info");
                setTimeout(() => { window.location.href = "index.html"; }, 500);
            });
        });

    } else {
        // --- CHƯA ĐĂNG NHẬP ---
        localStorage.removeItem('currentUser');
        authButtonsContainer.innerHTML = `
            <button class="btn btn-secondary" data-i18n="btn_login">${txtLogin}</button>
            <button class="btn btn-primary" data-i18n="btn_register">${txtRegister}</button>`;
        
        // Cập nhật lại ngôn ngữ ngay nếu file settings.js đã load
        if (window.updateAppLanguage) window.updateAppLanguage();
        
        attachAuthButtonEvents(authButtonsContainer);
    }
};

// ============================================================
// 4. KHỞI TẠO SỰ KIỆN FORM
// ============================================================
function setupModalEvents() {
    console.log("⚡ [AUTH] Gắn sự kiện Form...");

    const addEnterKeySupport = (formSelector) => {
        const form = document.querySelector(formSelector);
        if(!form) return;
        form.querySelectorAll('input').forEach(input => {
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') form.requestSubmit(); });
        });
    };

    addEnterKeySupport('#login-modal .auth-form');
    addEnterKeySupport('#signup-modal .auth-form');

    const googleBtn = document.querySelector('.btn-social.google-new');
    const facebookBtn = document.querySelector('.btn-social.facebook-new');
    if (googleBtn) googleBtn.addEventListener('click', (e) => { e.preventDefault(); handleSocialLogin(googleProvider, "Google"); });
    if (facebookBtn) facebookBtn.addEventListener('click', (e) => { e.preventDefault(); handleSocialLogin(facebookProvider, "Facebook"); });

    // --- FORM ĐĂNG NHẬP ---
    const loginForm = document.querySelector('#login-modal .auth-form');
    if (loginForm) {
        const emailInput = document.getElementById('email');
        const emailLabel = loginForm.querySelector('label[for="email"]');
        
        if (emailInput && emailLabel) {
            emailInput.type = "text"; 
            emailInput.placeholder = getAuthText('ph_login_input');
            emailLabel.innerText = getAuthText('label_login_input');
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            
            const inputVal = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!inputVal || !password) return showToast(getAuthText('login_error'), "error");

            resetBtn(submitBtn, getAuthText('logging_in'), true);

            try {
                let targetEmail = inputVal;
                const isPhone = /^\d+$/.test(inputVal.replace('+', '')); 
                
                if (isPhone) {
                    const foundEmail = await findEmailByPhone(inputVal);
                    if (!foundEmail) throw new Error("PHONE_NOT_FOUND");
                    targetEmail = foundEmail; 
                }

                const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
                handleLoginSuccess(userCredential.user);

            } catch (error) {
                console.error("Login Error:", error);
                if (error.message === "PHONE_NOT_FOUND") {
                    showToast(getAuthText('err_phone_not_found'), "error");
                } else if (error.code === 'auth/invalid-email') {
                    showToast("Email/SĐT không hợp lệ.", "error");
                } else {
                    showToast(getAuthText('login_error'), "error");
                }
            } finally {
                resetBtn(submitBtn, originalBtnText, false);
            }
        });
    }

    // --- FORM ĐĂNG KÝ ---
    const signupForm = document.querySelector('#signup-modal .auth-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            resetBtn(submitBtn, getAuthText('processing'), true);
            
            const fullname = document.getElementById('signup-fullname').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;

            if (password !== confirmPassword) { showToast(getAuthText('pass_confirm_err'), "error"); resetBtn(submitBtn, originalBtnText, false); return; }
            if (!fullname) { showToast(getAuthText('name_err'), "error"); resetBtn(submitBtn, originalBtnText, false); return; }

            createUserWithEmailAndPassword(auth, email, password)
                .then((uc) => updateProfile(uc.user, { displayName: fullname }))
                .then(() => { 
                    showToast(getAuthText('register_success'), "success"); 
                    updateHeaderUI(auth.currentUser);
                    closeAllModals(); 
                    signupForm.reset(); 
                })
                .catch((err) => { showToast(err.code === 'auth/email-already-in-use' ? getAuthText('email_used') : "Lỗi: " + err.message, "error"); })
                .finally(() => resetBtn(submitBtn, originalBtnText, false));
        });
    }

    // --- FORM QUÊN MẬT KHẨU ---
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            const btn = forgotForm.querySelector('button');
            const oldText = btn.innerText;

            if (!email) return showToast(getAuthText('email_req'), "error");
            resetBtn(btn, getAuthText('sending'), true);

            sendPasswordResetEmail(auth, email)
                .then(() => {
                    showToast(`${getAuthText('reset_sent')} ${email}`, "success");
                    setTimeout(() => { closeAllModals(); document.getElementById('login-modal-overlay')?.classList.add('visible'); forgotForm.reset(); }, 2000);
                })
                .catch((err) => showToast(err.code === 'auth/user-not-found' ? getAuthText('email_not_found') : "Lỗi: " + err.message, "error"))
                .finally(() => resetBtn(btn, oldText, false));
        });
    }

    // --- SỰ KIỆN ĐÓNG MODAL ---
    ['login-close-btn', 'signup-close-btn', 'forgot-close-btn'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', closeAllModals);
    });
    ['login-modal-overlay', 'signup-modal-overlay', 'forgot-modal-overlay'].forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay) overlay.addEventListener('click', (e) => { if(e.target === overlay) closeAllModals(); });
    });

    document.getElementById('switch-to-signup')?.addEventListener('click', (e) => {
        e.preventDefault(); closeAllModals(); document.getElementById('signup-modal-overlay')?.classList.add('visible');
    });
    document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
        e.preventDefault(); closeAllModals(); document.getElementById('login-modal-overlay')?.classList.add('visible');
    });
    document.getElementById('back-to-login')?.addEventListener('click', (e) => {
        e.preventDefault(); closeAllModals(); document.getElementById('login-modal-overlay')?.classList.add('visible');
    });
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('forgot-password')) {
            e.preventDefault();
            const loginEmail = document.getElementById('email');
            const forgotEmail = document.getElementById('forgot-email');
            if (loginEmail && forgotEmail) forgotEmail.value = loginEmail.value;
            closeAllModals();
            document.getElementById('forgot-modal-overlay')?.classList.add('visible');
        }
    });
}

// ============================================================
// 5. MAIN EXECUTION
// ============================================================
const waitForHeader = setInterval(() => {
    const authButtonsContainer = document.querySelector('.auth-buttons');
    if (authButtonsContainer) {
        clearInterval(waitForHeader);
        const cachedUser = localStorage.getItem('currentUser');
        if (cachedUser) {
            try { updateHeaderUI(JSON.parse(cachedUser)); } catch (e) { console.error(e); }
        }
        onAuthStateChanged(auth, (user) => { updateHeaderUI(user); });
    }
}, 100);

window.addEventListener('modalsLoaded', () => { 
    console.log("✅ [AUTH] Nhận tín hiệu modalsLoaded!");
    setupModalEvents(); 
});

setTimeout(() => {
    const closeBtn = document.getElementById('login-close-btn');
    if (document.querySelector('#login-modal') && (!closeBtn || !closeBtn.onclick)) { 
        setupModalEvents();
    }
}, 2000);