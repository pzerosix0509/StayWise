// toast.js
export function showToast(message, type = 'info') {
    // 1️⃣ Tìm hoặc tạo container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);

        // Style container: dưới phải
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column-reverse', // toast mới nằm dưới cùng
            gap: '10px',
            zIndex: '9999',
        });
    }

    // 2️⃣ Tạo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Style toast: màu đen, chữ trắng
    Object.assign(toast.style, {
        backgroundColor: '#000',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '220px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'opacity 0.4s, transform 0.4s',
        fontWeight: '500',
    });

    // Icon (emoji)
    let icon = '';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    // 3️⃣ Hiển thị với animation
    requestAnimationFrame(() => {
        toast.style.opacity = '0.95';
        toast.style.transform = 'translateY(0)';
    });

    // 4️⃣ Tự động xóa sau 3 giây
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}
