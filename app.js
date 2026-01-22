let allLists = [movieData, cardData, objectData];
// Store deep copy for restoration
const originalItems = allLists.map(list => [...list.items]);
// Track which indices are currently being forced
let forcedIndices = [null, null]; 

const container = document.getElementById('app-container');
const gallery = document.getElementById('gallery-overlay');
const swiperEl = document.querySelector('.swiper');
const indicator = document.getElementById('indicator');
const settingsPage = document.getElementById('settings-page');

let swiperInstance;
let magicModeActive = false; 
let inputBuffer = "";
let forceCount = 0; // 0, 1, or 2

gallery.addEventListener('click', () => {
    gallery.style.display = 'none';
    swiperEl.style.display = 'block';
    initApp();
});

function initApp() {
    container.innerHTML = '';
    allLists.forEach((list) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        let itemsHtml = '';
        list.items.forEach((item, itemIdx) => {
            itemsHtml += `<div class="list-item" data-pos="${itemIdx}">${itemIdx + 1}. ${item}</div>`;
        });
        slide.innerHTML = `<div class="content-wrapper">
            <div class="title">${list.title}</div>
            <div class="grid-container">${itemsHtml}</div>
        </div>`;
        container.appendChild(slide);
    });

    if (swiperInstance) swiperInstance.destroy();
    swiperInstance = new Swiper('.swiper', { loop: true });
}

document.addEventListener('touchstart', (e) => {
    if (gallery.style.display !== 'none' || settingsPage.style.display === 'flex') return;
    
    const t = e.touches[0];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = Date.now();
    const lastTap = document.body.dataset.lastTap || 0;

    if (now - lastTap < 300) {
        // Double Tap Bottom Right: Enter Magic Mode
        if (t.clientX > w * 0.8 && t.clientY > h * 0.8) {
            magicModeActive = true;
            inputBuffer = "";
            forceCount = 0; // Reset count to allow 2 new inputs
            indicator.classList.add('active');
            if (navigator.vibrate) navigator.vibrate(60);
            return;
        }
        // Settings
        if (t.clientX < w * 0.2 && t.clientY > h * 0.8) {
            openSettings(); return;
        }
    }
    document.body.dataset.lastTap = now;

    if (magicModeActive && forceCount < 2) {
        const digit = getGridDigit(t.clientX, t.clientY, w, h);
        inputBuffer += digit;
        
        if (inputBuffer.length === 2) {
            applyGlobalForce(parseInt(inputBuffer));
            inputBuffer = "";
            forceCount++;
            
            // Auto-Exit after 2nd force
            if (forceCount === 2) {
                magicModeActive = false;
                indicator.classList.remove('active');
                if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
            } else {
                if (navigator.vibrate) navigator.vibrate(40);
            }
        }
    }
});

function getGridDigit(x, y, w, h) {
    const wrapper = document.querySelector('.content-wrapper');
    const rect = wrapper.getBoundingClientRect();
    if (y < rect.top || y > rect.bottom) return "0";
    const col = Math.floor((x / w) * 3);
    const row = Math.floor(((y - rect.top) / rect.height) * 3);
    const digit = (row * 3) + col + 1;
    return (digit > 9 || digit < 1) ? "0" : digit.toString();
}

function applyGlobalForce(position) {
    const targetIdx = Math.min(Math.max(position - 1, 0), 49);
    
    // 1. Restore previous forced index for this slot if it exists
    if (forcedIndices[forceCount] !== null) {
        const oldIdx = forcedIndices[forceCount];
        allLists.forEach((list, i) => {
            list.items[oldIdx] = originalItems[i][oldIdx];
        });
    }

    // 2. Set the new force
    forcedIndices[forceCount] = targetIdx;
    allLists.forEach((list) => {
        list.items[targetIdx] = list.forceWords[forceCount];
    });

    // 3. Update the UI on all slides immediately
    updateUI();
}

function updateUI() {
    // We target all slides (including swiper clones)
    document.querySelectorAll('.swiper-slide').forEach((slide) => {
        const sIdx = parseInt(slide.getAttribute('data-swiper-slide-index'));
        if (!isNaN(sIdx)) {
            const listData = allLists[sIdx];
            // Update every item in the DOM to match current data state
            listData.items.forEach((item, itemIdx) => {
                const el = slide.querySelector(`[data-pos="${itemIdx}"]`);
                if (el) el.innerText = `${itemIdx + 1}. ${item}`;
            });
        }
    });
}

function openSettings() {
    const sList = document.getElementById('settings-list');
    sList.innerHTML = '';
    allLists.forEach((l, i) => {
        const item = document.createElement('div');
        item.className = 'settings-item';
        item.innerHTML = `<span>${l.title}</span> <button onclick="moveList(${i})">UP ↑</button>`;
        sList.appendChild(item);
    });
    settingsPage.style.display = 'flex';
}

window.moveList = (i) => {
    if (i > 0) {
        [allLists[i], allLists[i-1]] = [allLists[i-1], allLists[i]];
        [originalItems[i], originalItems[i-1]] = [originalItems[i-1], originalItems[i]];
        openSettings();
    }
};

document.getElementById('close-settings').onclick = () => {
    settingsPage.style.display = 'none';
    initApp();
};
