let allLists = [movieData, cardData, objectData];
const container = document.getElementById('app-container');
const gallery = document.getElementById('gallery-overlay');
const swiperEl = document.querySelector('.swiper');
const indicator = document.getElementById('indicator');
const settingsPage = document.getElementById('settings-page');

let swiperInstance;
let magicModeActive = false; // Toggle state
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
        // TOGGLE MAGIC MODE (Bottom Right)
        if (t.clientX > w * 0.8 && t.clientY > h * 0.8) {
            magicModeActive = !magicModeActive;
            inputBuffer = "";
            forceCount = 0;
            if (magicModeActive) {
                indicator.classList.add('active');
                if (navigator.vibrate) navigator.vibrate(50);
            } else {
                indicator.classList.remove('active');
                if (navigator.vibrate) navigator.vibrate([30, 30]);
            }
            return;
        }
        // SETTINGS (Bottom Left)
        if (t.clientX < w * 0.2 && t.clientY > h * 0.8) {
            openSettings(); return;
        }
    }
    document.body.dataset.lastTap = now;

    // INPUT LOGIC
    if (magicModeActive && forceCount < 2) {
        const digit = getGridDigit(t.clientX, t.clientY, w, h);
        inputBuffer += digit;
        if (inputBuffer.length === 2) {
            applyForce(parseInt(inputBuffer));
            inputBuffer = "";
            forceCount++;
            if (navigator.vibrate) navigator.vibrate([30, 50]);
            // Stay in mode for second input, or auto-exit after 2 forces? 
            // Currently stays in mode until manual double-tap exit.
        }
    }
});

function getGridDigit(x, y, w, h) {
    const wrapper = document.querySelector('.content-wrapper');
    const rect = wrapper.getBoundingClientRect();

    // If touching outside the black list area (top or bottom background image)
    if (y < rect.top || y > rect.bottom) return "0";

    const col = Math.floor((x / w) * 3);
    const row = Math.floor(((y - rect.top) / rect.height) * 3);
    const digit = (row * 3) + col + 1;
    
    return (digit > 9 || digit < 1) ? "0" : digit.toString();
}

function applyForce(position) {
    const targetIdx = Math.min(Math.max(position - 1, 0), 49);
    const activeIdx = swiperInstance.realIndex;
    
    // Select all slides (including duplicates)
    const slides = document.querySelectorAll('.swiper-slide');
    slides.forEach((slide) => {
        const sIdx = parseInt(slide.getAttribute('data-swiper-slide-index'));
        // Only change slides that are NOT currently being looked at
        if (sIdx !== activeIdx) {
            const listData = allLists[sIdx];
            if (listData) {
                const el = slide.querySelector(`[data-pos="${targetIdx}"]`);
                if (el) {
                    el.innerText = `${targetIdx + 1}. ${listData.forceWords[forceCount]}`;
                }
            }
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
        openSettings();
    }
};

document.getElementById('close-settings').onclick = () => {
    settingsPage.style.display = 'none';
    initApp();
};
