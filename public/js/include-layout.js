// js/include-layout.js

(async function() {
    try {
        // 1. Tải song song cả 3 file
        const responses = await Promise.all([
            fetch('header.html'),
            fetch('footer.html'),
            fetch('modals.html')
        ]);

        // 2. Kiểm tra xem file có tồn tại không (Chặn lỗi 404)
        for (const resp of responses) {
            if (!resp.ok) throw new Error(`Failed to load ${resp.url}: ${resp.statusText}`);
        }

        // 3. Lấy nội dung text
        const [hText, fText, mText] = await Promise.all(responses.map(r => r.text()));

        // 4. Inject vào DOM
        const headerPlaceholder = document.getElementById('shared-header');
        const footerPlaceholder = document.getElementById('shared-footer');
        const modalsPlaceholder = document.getElementById('shared-modals');

        if (headerPlaceholder) headerPlaceholder.innerHTML = hText;
        if (footerPlaceholder) footerPlaceholder.innerHTML = fText;
        if (modalsPlaceholder) modalsPlaceholder.innerHTML = mText;

        console.log("✅ Layout injected successfully.");

        // ============================================================
        // 5. PHÁT TÍN HIỆU (DISPATCH EVENTS)
        // ============================================================
        
        // Báo cho settings.js biết Header đã xong để dịch ngôn ngữ
        window.dispatchEvent(new Event('layoutLoaded')); 

        // Báo cho auth.js biết Modal đã xong để gắn sự kiện Đăng nhập/Đăng ký
        // (Đây là cái auth.js đang chờ)
        window.dispatchEvent(new Event('modalsLoaded')); 

    } catch (err) {
        console.error('❌ Failed to inject layout:', err);
    }
})();
