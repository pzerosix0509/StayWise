import { loadHotelsData } from "./hotels_loader.js";
import { createHotelCard } from "./hotel_renderer.js";
import { showToast } from "./toast.js";

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ----------------------- CONFIG -----------------------
const firebaseConfig = {
  apiKey: "AIzaSyACfhRC94Wt-_q7h1f-1cJjOV06nP9SVag",
  authDomain: "staywise-8d5dd.firebaseapp.com",
  projectId: "staywise-8d5dd",
  storageBucket: "staywise-8d5dd.firebasestorage.app",
  messagingSenderId: "308886745296",
  appId: "1:308886745296:web:a43170c671e27df804aed5",
  measurementId: "G-NZ1VYTTCGY"
};

const app = (!getApps().length) ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// ----------------------- STATE / CONSTANTS -----------------------
const FAV_KEY_PREFIX = "staywise_favorites_";
const PENDING_KEY_PREFIX = "staywise_fav_ops_"; // persistent queue per user
const USER_STORAGE_KEY = "currentUser";
const RECO_LANG_KEY = 'staywise_lang';

let ALL_HOTELS_CACHE = null; // cached full hotels list
let cachedFavHotels = [];
let currentRenderToken = 0;
let firestoreUnsubscribe = null;
let delegatedListenersSetup = false;
const pendingFavOps = new Map(); // hotelId -> Promise

// default behavior: server authoritative if doc exists
const DEFAULT_CONFIG = { serverAuthoritative: true };

// ----------------------- I18N -----------------------
const FAV_LANG = {
  vi: { require_login_title: "Vui lòng đăng nhập để xem danh sách yêu thích", btn_login_now: "Đăng nhập ngay", tooltip_remove: "Bỏ yêu thích", toast_require_login: "Vui lòng đăng nhập để lưu yêu thích", toast_added: "Đã thêm vào danh sách yêu thích ❤️", toast_exists: "Đã ở trong danh sách yêu thích", toast_removed: "Đã bỏ yêu thích 💔", confirm_remove_title: "Xác nhận" },
  en: { require_login_title: "Please login to view your favorites", btn_login_now: "Login Now", tooltip_remove: "Remove from favorites", toast_require_login: "Please login to save favorites", toast_added: "Added to favorites ❤️", toast_exists: "Already in favorites", toast_removed: "Removed from favorites 💔", confirm_remove_title: "Confirm" }
};
function getFavText(key){ const lang = localStorage.getItem(RECO_LANG_KEY) || 'vi'; return (FAV_LANG[lang] && FAV_LANG[lang][key]) || FAV_LANG['vi'][key] || ''; }

// ----------------------- USER + LOCAL STORAGE HELPERS -----------------------
function getCurrentUser(){ try{ const raw = localStorage.getItem(USER_STORAGE_KEY); return raw ? JSON.parse(raw) : null; }catch(e){ console.warn('getCurrentUser parse error', e); return null; } }
function getCurrentUserId(){ const u = getCurrentUser(); return u ? u.uid : null; }
function favStorageKey(userId){ return FAV_KEY_PREFIX + userId; }
function pendingStorageKey(userId){ return PENDING_KEY_PREFIX + userId; }

function getUserFavIdsLocal(userId){ if(!userId) return []; try{ const raw = localStorage.getItem(favStorageKey(userId)); return raw?JSON.parse(raw):[]; }catch(e){ console.warn('getUserFavIdsLocal parse fail', e); return []; } }
function setUserFavIdsLocal(userId, arr){ if(!userId) return; try{ localStorage.setItem(favStorageKey(userId), JSON.stringify(arr)); }catch(e){ console.warn('setUserFavIdsLocal failed', e); } }

// Pending op queue: [{op:'add'|'remove', id: '...', ts: number}]
function enqueuePendingOp(userId, op){ if(!userId || !op) return; try{ const key = pendingStorageKey(userId); const cur = JSON.parse(localStorage.getItem(key) || '[]'); cur.push(op); localStorage.setItem(key, JSON.stringify(cur)); }catch(e){ console.warn('enqueuePendingOp', e); } }
function dequeuePendingOps(userId){ if(!userId) return []; try{ const key = pendingStorageKey(userId); const arr = JSON.parse(localStorage.getItem(key) || '[]'); localStorage.removeItem(key); return arr; }catch(e){ console.warn('dequeuePendingOps', e); return []; } }
function peekPendingOps(userId){ if(!userId) return []; try{ const key = pendingStorageKey(userId); return JSON.parse(localStorage.getItem(key) || '[]'); }catch(e){ return []; } }

// ----------------------- PRICE NORMALIZER (IMPROVED) -----------------------
function normalizePriceValue(v){ if(v==null) return 0; const s = String(v).trim(); if(!s) return 0; // if both '.' and ',' present - remove non-digit
  if(s.indexOf('.')>-1 && s.indexOf(',')>-1){ const digits = s.replace(/[^0-9]/g,''); return parseInt(digits||'0',10); }
  if(s.indexOf(',')>-1 && s.indexOf('.')===-1){ const t = s.replace(/[^0-9,]/g,'').replace(',','.'); const n = parseFloat(t); return isNaN(n)?0:n; }
  const cleaned = s.replace(/[^0-9.]/g,''); const n = parseFloat(cleaned); return isNaN(n)?0:n; }

// ----------------------- FIRESTORE (SAFE) -----------------------
async function loadFavoritesFromFirestore(userId){ if(!userId) return null; try{ const ref = doc(db,'favorites',userId); const snap = await getDoc(ref); if(!snap.exists()) return null; const data = snap.data(); return Array.isArray(data?.hotels) ? data.hotels.map(String) : []; }catch(e){ console.warn('loadFavoritesFromFirestore fail', e); return null; } }

// Save full array (merge) - fallback path
async function saveFavoritesToFirestore(userId, favIds){ if(!userId) return; try{ await setDoc(doc(db,'favorites',userId), { hotels: favIds, updatedAt: Date.now() }, { merge: true }); }catch(e){ console.error('saveFavoritesToFirestore failed', e); throw e; } }

// Try atomic operations first (arrayUnion/arrayRemove), fallback to setDoc merge
async function applyOpToFirestore(userId, op){ if(!userId) throw new Error('no user'); const ref = doc(db,'favorites',userId); try{ if(op.op==='add'){ await updateDoc(ref, { hotels: arrayUnion(String(op.id)), updatedAt: Date.now() }); } else if(op.op==='remove'){ await updateDoc(ref, { hotels: arrayRemove(String(op.id)), updatedAt: Date.now() }); } return true; }catch(e){ // fallback read/merge
  try{ const snap = await getDoc(ref); let base = snap.exists() && Array.isArray(snap.data()?.hotels) ? snap.data().hotels.map(String) : []; if(op.op==='add'){ if(!base.includes(String(op.id))) base.push(String(op.id)); } else { base = base.filter(x=>String(x)!==String(op.id)); } await setDoc(ref, { hotels: base, updatedAt: Date.now() }, { merge: true }); return true; }catch(inner){ console.error('applyOpToFirestore fallback failed', inner); throw inner; } }
}

// Flush queue sequentially (stop and re-enqueue remaining on error)
async function flushPendingOps(userId){ if(!userId) return; const ops = dequeuePendingOps(userId); if(!ops || ops.length===0) return; for(let i=0;i<ops.length;i++){ const op = ops[i]; try{ await applyOpToFirestore(userId, op); }catch(e){ // re-enqueue remaining including current op
      const remaining = ops.slice(i); remaining.forEach(r=>enqueuePendingOp(userId, r)); return; } } }

// ----------------------- REALTIME (safe) -----------------------
function startRealtimeFavoritesListening(userId){ if(firestoreUnsubscribe){ try{ firestoreUnsubscribe(); }catch(e){} firestoreUnsubscribe = null; } if(!userId) return; const ref = doc(db,'favorites',userId);
  firestoreUnsubscribe = onSnapshot(ref, (snap)=>{ try{ if(!snap.exists()){ // server has no doc - don't overwrite local
      return; }
      const cloudFavs = Array.isArray(snap.data()?.hotels) ? snap.data().hotels.map(String) : [];
      // only update if different (order matters)
      const local = getUserFavIdsLocal(userId) || [];
      const same = local.length===cloudFavs.length && local.every((v,i)=>String(v)===String(cloudFavs[i]));
      if(!same){ setUserFavIdsLocal(userId, cloudFavs); rebuildCachedFromFavIds(cloudFavs).catch(e=>console.warn('rebuild after realtime failed', e)); }
    }catch(e){ console.warn('onSnapshot processing error', e); } }, (err)=>{ console.warn('Realtime listener error', err); }); }

function stopRealtimeFavoritesListening(){ if(firestoreUnsubscribe){ try{ firestoreUnsubscribe(); }catch(e){} firestoreUnsubscribe = null; } }

// ----------------------- HOTEL CACHE -----------------------
async function ensureAllHotelsCached(){ if(ALL_HOTELS_CACHE) return ALL_HOTELS_CACHE; ALL_HOTELS_CACHE = await loadHotelsData(); ALL_HOTELS_CACHE.forEach((h, idx)=>{ if(h.id===undefined||h.id===null) h.id = idx; h._idStr = String(h.id); }); return ALL_HOTELS_CACHE; }

// ----------------------- Rebuild & Render -----------------------
async function rebuildCachedFromFavIds(favIds){ await ensureAllHotelsCached(); const ordered = [...(favIds||[])].reverse().map(String); const map = new Map(); ALL_HOTELS_CACHE.forEach(h=>map.set(h._idStr, h)); const result = []; for(const id of ordered){ const hotel = map.get(id); if(hotel) result.push(hotel); } cachedFavHotels = result; applySortAndRender(document.getElementById('fav-sort')?.value || 'default'); }

function applySortAndRender(sortType){ const sorted = [...cachedFavHotels]; switch(sortType){ case 'priceAsc': sorted.sort((a,b)=>normalizePriceValue(a.price) - normalizePriceValue(b.price) || String(a.hotelName||'').localeCompare(b.hotelName||'')); break; case 'priceDesc': sorted.sort((a,b)=>normalizePriceValue(b.price) - normalizePriceValue(a.price) || String(a.hotelName||'').localeCompare(b.hotelName||'')); break; case 'ratingDesc': sorted.sort((a,b)=>(parseFloat(b.star)||0)-(parseFloat(a.star)||0)||normalizePriceValue(a.price)-normalizePriceValue(b.price)); break; default: break; } renderList(sorted); }

async function renderList(hotelsToRender){ const listContainer = document.getElementById('fav-list'); const emptyState = document.getElementById('empty-state'); if(!listContainer) return; const token = ++currentRenderToken; listContainer.innerHTML = ''; if(!hotelsToRender || hotelsToRender.length===0){ if(emptyState) emptyState.classList.remove('hidden'); return; } else if(emptyState) emptyState.classList.add('hidden'); const cardPromises = hotelsToRender.map(async hotel => ({ hotel, cardHtml: await createHotelCard(hotel, hotel.id, true) })); const pairs = await Promise.all(cardPromises); if(token !== currentRenderToken) return; const frag = document.createDocumentFragment(); for(const {hotel, cardHtml} of pairs){ if(token !== currentRenderToken) return; const temp = document.createElement('div'); temp.innerHTML = cardHtml; const cardEl = temp.querySelector('.hotel-card'); if(cardEl){ cardEl.setAttribute('data-hotel-id', String(hotel.id)); const heart = cardEl.querySelector('.favorite-btn'); if(heart){ heart.classList.add('liked'); heart.title = getFavText('tooltip_remove'); heart.setAttribute('data-hotel-id', String(hotel.id)); } frag.appendChild(cardEl); } } listContainer.appendChild(frag); if(!delegatedListenersSetup) setupDelegatedListeners(); }

// ----------------------- Delegated events -----------------------
function setupDelegatedListeners(){ const listContainer = document.getElementById('fav-list'); if(!listContainer) return; delegatedListenersSetup = true; listContainer.addEventListener('click', (e)=>{ const favBtn = e.target.closest('.favorite-btn'); if(favBtn && listContainer.contains(favBtn)){ e.stopPropagation(); const hotelId = favBtn.getAttribute('data-hotel-id') || favBtn.dataset.hotelId; if(!hotelId) return; openConfirmRemoveModal(hotelId); return; } const card = e.target.closest('.hotel-card'); if(card && listContainer.contains(card)){ const hotelId = card.getAttribute('data-hotel-id') || card.dataset.hotelId; if(!hotelId) return; const url = card.dataset.url || `information_page.html?id=${hotelId}`; sessionStorage.setItem('activeHotelId', hotelId); window.location.href = url; } }); }

// ----------------------- Confirm modal -----------------------
function openConfirmRemoveModal(hotelId){ const modal = document.getElementById('confirm-modal-overlay'); if(!modal) return; modal.dataset.pendingHotelId = String(hotelId); const titleEl = modal.querySelector('.confirm-title'); if(titleEl) titleEl.textContent = getFavText('confirm_remove_title'); modal.classList.add('visible'); }
function closeConfirmRemoveModal(){ const modal = document.getElementById('confirm-modal-overlay'); if(!modal) return; delete modal.dataset.pendingHotelId; modal.classList.remove('visible'); }
async function performRemoveFavoriteFromModal(){ const modal = document.getElementById('confirm-modal-overlay'); if(!modal) return; const id = modal.dataset.pendingHotelId; if(!id) return closeConfirmRemoveModal(); closeConfirmRemoveModal(); await removeFavorite(id); }

// ----------------------- Debounce per-hotel -----------------------
function debounceFavOp(hotelId, fn){ if(pendingFavOps.has(hotelId)) return pendingFavOps.get(hotelId); const p = (async ()=>{ try{ return await fn(); } finally { pendingFavOps.delete(hotelId); } })(); pendingFavOps.set(hotelId, p); return p; }

// ----------------------- High-level API -----------------------
export async function addFavorite(idToAdd){ const userId = getCurrentUserId(); if(!userId){ showToast(getFavText('toast_require_login'),'error'); return false; } return debounceFavOp(String(idToAdd), async ()=>{ const before = getUserFavIdsLocal(userId); const idStr = String(idToAdd); if(before.includes(idStr)){ showToast(getFavText('toast_exists'),'info'); return true; } const newArr = [...before, idStr]; setUserFavIdsLocal(userId, newArr); await rebuildCachedFromFavIds(newArr); // optimistic
  // enqueue op and try flush
  const op = { op: 'add', id: idStr, ts: Date.now() }; enqueuePendingOp(userId, op);
  try{ await flushPendingOps(userId); showToast(getFavText('toast_added'),'success'); return true; }catch(e){ // rollback
    setUserFavIdsLocal(userId, before); await rebuildCachedFromFavIds(before); showToast('Save failed. Restored local state','error'); throw e; } }); }

export async function removeFavorite(idToRemove){ const userId = getCurrentUserId(); if(!userId){ return false; } const idStr = String(idToRemove); return debounceFavOp(idStr, async ()=>{ const before = getUserFavIdsLocal(userId); if(!before.includes(idStr)) return true; const newArr = before.filter(x=>String(x)!==idStr); setUserFavIdsLocal(userId, newArr); await rebuildCachedFromFavIds(newArr); const op = { op: 'remove', id: idStr, ts: Date.now() }; enqueuePendingOp(userId, op); try{ await flushPendingOps(userId); showToast(getFavText('toast_removed'),'info'); return true; }catch(e){ // rollback
    setUserFavIdsLocal(userId, before); await rebuildCachedFromFavIds(before); showToast('Remove failed. Restored local state','error'); throw e; } }); }

export async function toggleFavorite(id){ const userId = getCurrentUserId(); if(!userId){ showToast(getFavText('toast_require_login'),'error'); return false; } const local = getUserFavIdsLocal(userId); const idStr = String(id); if(local.includes(idStr)) return removeFavorite(idStr); else return addFavorite(idStr); }

// Backwards compatibility global
window.addFavorite = addFavorite;
window.toggleFavorite = toggleFavorite;

// ----------------------- Init: load & render favorites -----------------------
export async function initFavoritesModule(config = {}){
  const cfg = { ...DEFAULT_CONFIG, ...config };
  await ensureAllHotelsCached();
  const userId = getCurrentUserId();
  const listContainer = document.getElementById('fav-list'); const emptyState = document.getElementById('empty-state');

  if(!userId){ if(listContainer) listContainer.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:50px;">
      <h3>${getFavText('require_login_title')}</h3>
      <button onclick="document.getElementById('login-modal-overlay').classList.add('visible')" class="btn btn-primary" style="margin-top:15px">${getFavText('btn_login_now')}</button>
    </div>
  `; if(emptyState) emptyState.classList.add('hidden'); if(firestoreUnsubscribe){ try{ firestoreUnsubscribe(); }catch(e){} firestoreUnsubscribe=null; } return; }

  // flush pending ops before reading server (attempt to make local changes persistent)
  try{ await flushPendingOps(userId); }catch(e){ console.warn('initial flush failed', e); }

  // start realtime
  startRealtimeFavoritesListening(userId);

  // load local quickly
  let favIds = getUserFavIdsLocal(userId) || [];

  // try server snapshot
  try{ const cloud = await loadFavoritesFromFirestore(userId); if(cloud !== null){ if(cfg.serverAuthoritative) { favIds = cloud; setUserFavIdsLocal(userId, favIds); } else { favIds = cloud.length ? cloud : favIds; setUserFavIdsLocal(userId, favIds); } } }catch(e){ console.warn('fetch cloud favs failed', e); }

  if(!favIds || favIds.length === 0){ if(listContainer) listContainer.innerHTML = ''; if(emptyState) emptyState.classList.remove('hidden'); cachedFavHotels = []; return; }

  await rebuildCachedFromFavIds(favIds);
}

// ----------------------- Auto retry flush when back online -----------------------
window.addEventListener('online', async ()=>{ const userId = getCurrentUserId(); if(userId) try{ await flushPendingOps(userId); }catch(e){ console.warn('flush on online failed', e); } });

// ----------------------- Modal setup
export function setupModalControls(){ const confirmModal = document.getElementById('confirm-modal-overlay'); if(!confirmModal) return; const btnCancel = document.getElementById('btn-cancel-remove'); const btnConfirm = document.getElementById('btn-confirm-remove'); if(btnCancel) btnCancel.addEventListener('click', ()=>{ closeConfirmRemoveModal(); }); if(btnConfirm) btnConfirm.addEventListener('click', ()=>{ performRemoveFavoriteFromModal(); }); confirmModal.addEventListener('click', (e)=>{ if(e.target === confirmModal) closeConfirmRemoveModal(); }); }

// ----------------------- Exports
export { ensureAllHotelsCached, rebuildCachedFromFavIds, renderList, startRealtimeFavoritesListening, stopRealtimeFavoritesListening };

// ----------------------- Bootstrap (optional auto-init)
document.addEventListener('DOMContentLoaded', async ()=>{ try{ await initFavoritesModule(); }catch(e){ console.warn('initFavoritesModule failed', e); } const sortSelect = document.getElementById('fav-sort'); if(sortSelect) sortSelect.addEventListener('change', ()=>applySortAndRender(sortSelect.value)); setupModalControls(); });

// END OF FILE
