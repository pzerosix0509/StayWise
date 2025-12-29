// explore_ui.js
const filterBox = document.querySelector(".filter-box");
const footer = document.getElementById("shared-footer");
const filterParent = document.querySelector(".filter-column");
const TOP_OFFSET = 95;
const FOOTER_GAP = 20;

function stopBeforeFooter() {
    if (!filterBox || !footer || !filterParent) return;

    const filterRect = filterBox.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const parentRect = filterParent.getBoundingClientRect();
    const filterHeight = filterRect.height;

    if (filterRect.bottom > footerRect.top - FOOTER_GAP) {
        const footerTopDoc = footerRect.top + window.scrollY;
        const parentTopDoc = parentRect.top + window.scrollY;

        const topToUse = Math.max(
            (footerTopDoc - FOOTER_GAP - filterHeight) - parentTopDoc,
            0
        );

        filterBox.classList.add("is-absolute");
        filterBox.style.top = topToUse + "px";
    } else {
        filterBox.classList.remove("is-absolute");
        filterBox.style.top = TOP_OFFSET + "px";
    }
}

window.addEventListener("scroll", stopBeforeFooter);
window.addEventListener("resize", stopBeforeFooter);
window.addEventListener("load", stopBeforeFooter);

document.getElementById("resetFilter").addEventListener("click", () => {
    document.getElementById("location").value = "";
    document.getElementById("stayType").value = "";
    document.getElementById("priceMin").value = "";
    document.getElementById("priceMax").value = "";
    document.getElementById("rating").value = "";
});

// // format tiền
// function formatMoneyInput(e) {
//     const input = e.target;
//     const old = input.value;
//     const pos = input.selectionStart;
//     const digits = old.replace(/\D/g, "");
//     const left = old.slice(0, pos).replace(/\D/g, "").length;

//     if (!digits) { input.value = ""; input.setSelectionRange(0,0); return; }

//     const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
//     const final = formatted + " VND";

//     input.value = final;

//     let digitsSeen = 0;
//     let newPos = 0;
//     for (let i = 0; i < formatted.length; i++) {
//         if (/\d/.test(formatted[i])) digitsSeen++;
//         if (digitsSeen === left) { newPos = i + 1; break; }
//     }
//     if (left === 0) newPos = 0;
//     input.setSelectionRange(newPos, newPos);
// }

document.getElementById("priceMin").addEventListener("input", formatMoneyInput);
document.getElementById("priceMax").addEventListener("input", formatMoneyInput);
