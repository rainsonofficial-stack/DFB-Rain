let allLists = [movieData, cardData, objectData];
const originalItems = allLists.map(list => [...list.items]);
let forcedIndices = [null, null]; 

const container = document.getElementById('app-container');
const gallery = document.getElementById('gallery-overlay');
const swiperEl = document.querySelector('.swiper');
const indicator = document.getElementById('indicator');
const settingsPage = document.getElementById('settings-page');

let swiperInstance;
let magicModeActive = false; 
let inputBuffer = "";
let forceCount = 0;

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
        // Note: No .content-wrapper here, the swiper-slide is the content
        slide.innerHTML = `
            <div class="title">${list.title}</div>
            <div class="grid-container">${itemsHtml}</div>
        `;
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

    // Double Tap Logic
    if (now - lastTap < 300) {
        // Bottom Right: Toggle Mode
        if (t.clientX > w * 0.8 && t.clientY > h * 0.8) {
            if (!magicModeActive) {
                magicModeActive = true;
                inputBuffer = "";
                forceCount = 0; 
                indicator.classList.add('active');
                if (navigator.vibrate) navigator.vibrate(60);
            } else {
                magicModeActive = false;
                indicator.classList.remove('active');
                if (navigator.vibrate) navigator.vibrate([30, 30]);
            }
            return;
        }
        // Bottom Left: Settings
        if (t.clientX < w * 0.2 && t.clientY > h * 0.8) {
            openSettings(); return;
        }
    }
    document.body.dataset.lastTap = now;

    // 3x3 Grid Logic
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
    const rect = swiperEl.getBoundingClientRect();
    
    // Outside the black box = 0
    if (y < rect.top || y > rect.bottom) return "0";
    
    // Inside the black box = 1-9
    const col = Math.floor((x / w) * 3);
    const row = Math.floor(((y - rect.top) / rect.height) * 3);
    const digit = (row * 3) + col + 1;
    
    return (digit > 9 || digit < 1) ? "0" : digit.toString();
}

function applyGlobalForce(position) {
    const targetIdx = Math.min(Math.max(position - 1, 0), 49);
    
    // Restore original words for this force slot (1st or 2nd)
    if (forcedIndices[forceCount] !== null) {
        const oldIdx = forcedIndices[forceCount];
        allLists.forEach((list, i) => {
            list.items[oldIdx] = originalItems[i][oldIdx];
        });
    }

    // Apply new force to all lists
    forcedIndices[forceCount] = targetIdx;
    allLists.forEach((list) => {
        list.items[targetIdx] = list.forceWords[forceCount];
    });

    updateUI();
}

function updateUI() {
    document.querySelectorAll('.swiper-slide').forEach((slide) => {
        const sIdx = parseInt(slide.getAttribute('data-swiper-slide-index'));
        if (!isNaN(sIdx)) {
            const listData = allLists[sIdx];
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

