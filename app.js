// Load saved order from memory or use default
let allLists = loadOrder() || [movieData, cardData, objectData];
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
        slide.innerHTML = `
            <div class="content-wrapper">
                <div class="title">${list.title}</div>
                <div class="grid-container">${itemsHtml}</div>
            </div>
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

    if (now - lastTap < 300) {
        if (t.clientX > w * 0.8 && t.clientY > h * 0.8) {
            magicModeActive = !magicModeActive;
            inputBuffer = "";
            forceCount = 0; 
            if (magicModeActive) {
                indicator.classList.add('active');
                if (navigator.vibrate) navigator.vibrate(60);
            } else {
                indicator.classList.remove('active');
                if (navigator.vibrate) navigator.vibrate([30, 30]);
            }
            return;
        }
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
    const activeSlide = document.querySelector('.swiper-slide-active .content-wrapper');
    if (!activeSlide) return "0";
    const rect = activeSlide.getBoundingClientRect();
    if (y < rect.top || y > rect.bottom) return "0";
    const col = Math.floor((x / w) * 3);
    const row = Math.floor(((y - rect.top) / rect.height) * 3);
    const digit = (row * 3) + col + 1;
    return (digit > 9 || digit < 1) ? "0" : digit.toString();
}

function applyGlobalForce(position) {
    const targetIdx = Math.min(Math.max(position - 1, 0), 49);
    if (forcedIndices[forceCount] !== null) {
        const oldIdx = forcedIndices[forceCount];
        allLists.forEach((list, i) => {
            list.items[oldIdx] = originalItems[i][oldIdx];
        });
    }
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

// Memory Persistence Functions
function saveOrder() {
    localStorage.setItem('list_order', JSON.stringify(allLists.map(l => l.title)));
}

function loadOrder() {
    const saved = localStorage.getItem('list_order');
    if (!saved) return null;
    const orderNames = JSON.parse(saved);
    const master = [movieData, cardData, objectData];
    return orderNames.map(name => master.find(l => l.title === name));
}

function openSettings() {
    const sList = document.getElementById('settings-list');
    sList.innerHTML = '<h2>List Order</h2>';
    allLists.forEach((l, i) => {
        const item = document.createElement('div');
        item.className = 'settings-item';
        item.innerHTML = `<span>${l.title}</span> <button class="move-btn" onclick="moveList(${i})">UP ↑</button>`;
        sList.appendChild(item);
    });
    settingsPage.style.display = 'flex';
}

window.moveList = (i) => {
    if (i > 0) {
        [allLists[i], allLists[i-1]] = [allLists[i-1], allLists[i]];
        saveOrder(); // Remember new order immediately
        openSettings();
    }
};

document.getElementById('close-settings').onclick = () => {
    settingsPage.style.display = 'none';
    initApp();
};
