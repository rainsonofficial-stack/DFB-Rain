let allLists = [movieData, cardData, objectData]; 
const container = document.getElementById('app-container');
const gallery = document.getElementById('gallery-overlay');
const swiperEl = document.querySelector('.swiper');
const indicator = document.getElementById('indicator');
const settingsOverlay = document.getElementById('settings-overlay');

let swiperInstance;
let secretActive = false;
let inputBuffer = "";
let forceCount = 0;

// Start App from Gallery
gallery.addEventListener('click', () => {
    document.getElementById('gallery-img').classList.add('zoom-out');
    setTimeout(() => {
        gallery.style.display = 'none';
        swiperEl.style.display = 'block';
        initApp();
    }, 500);
});

function initApp() {
    container.innerHTML = '';
    allLists.forEach((list, listIdx) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        let itemsHtml = '';
        list.items.forEach((item, itemIdx) => {
            itemsHtml += `<div class="list-item" data-pos="${itemIdx}">${item}</div>`;
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

// Logic Mapping


document.addEventListener('touchstart', (e) => {
    if (gallery.style.display !== 'none' || settingsOverlay.style.display === 'flex') return;
    const t = e.touches[0];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = Date.now();
    const lastTap = document.body.dataset.lastTap || 0;

    if (now - lastTap < 300) {
        if (t.clientX > w * 0.8 && t.clientY > h * 0.8) { // Bottom Right
            secretActive = true; inputBuffer = ""; forceCount = 0;
            indicator.classList.add('active');
            if (navigator.vibrate) navigator.vibrate(50);
            return;
        }
        if (t.clientX < w * 0.2 && t.clientY > h * 0.8) { // Bottom Left
            openSettings();
            return;
        }
    }
    document.body.dataset.lastTap = now;

    if (secretActive && forceCount < 2) {
        const digit = getGridDigit(t.clientX, t.clientY, w, h);
        inputBuffer += digit;
        if (inputBuffer.length === 2) {
            applyForceDiscreetly(parseInt(inputBuffer));
            inputBuffer = ""; forceCount++;
            if (navigator.vibrate) navigator.vibrate([30, 50]);
            if (forceCount === 2) { secretActive = false; indicator.classList.remove('active'); }
        }
    }
});

function getGridDigit(x, y, w, h) {
    if (y < h * 0.17 || y > h * 0.83) return "0";
    const col = Math.floor((x / w) * 3);
    const row = Math.floor(((y - h * 0.17) / (h * 0.66)) * 3);
    return ((row * 3) + col + 1).toString();
}

function applyForceDiscreetly(position) {
    const targetIdx = Math.min(Math.max(position - 1, 0), 49);
    const activeIdx = swiperInstance.realIndex;
    document.querySelectorAll('.swiper-slide').forEach((slide) => {
        const sIdx = parseInt(slide.getAttribute('data-swiper-slide-index'));
        if (sIdx !== activeIdx) {
            const listData = allLists[sIdx];
            if (listData) {
                slide.querySelector(`[data-pos="${targetIdx}"]`).innerText = listData.forceWords[forceCount];
            }
        }
    });
}

// Settings
function openSettings() {
    const sContainer = document.getElementById('settings-list-container');
    sContainer.innerHTML = '';
    allLists.forEach((l, i) => {
        const item = document.createElement('div');
        item.className = 'list-order-item';
        item.innerHTML = `<span>${l.title}</span> <button onclick="moveUp(${i})">UP</button>`;
        sContainer.appendChild(item);
    });
    settingsOverlay.style.display = 'flex';
}
window.moveUp = (i) => {
    if (i > 0) { [allLists[i], allLists[i-1]] = [allLists[i-1], allLists[i]]; openSettings(); }
};
document.getElementById('close-settings').onclick = () => {
    settingsOverlay.style.display = 'none';
    initApp();
};

