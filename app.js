// 4. PERSISTENT MEMORY LOGIC
const listKey = 'user_list_order';
const forceKey = 'user_forced_indices_v2'; 
const wordOrderKey = 'user_word_order'; // NEW: To remember the SWAP state

const master = [movieData, cardData, objectData, vacationData, songData];

let savedNames = JSON.parse(localStorage.getItem(listKey));
let allLists;

if (!savedNames) {
    allLists = [...master];
} else {
    allLists = savedNames
        .map(name => master.find(l => l && l.title === name))
        .filter(Boolean);
    master.forEach(m => {
        if (!allLists.some(a => a.title === m.title)) {
            allLists.push(m);
        }
    });
}
localStorage.setItem(listKey, JSON.stringify(allLists.map(l => l.title)));

// --- NEW: LOAD SAVED WORD ORDER ---
let savedWordOrders = JSON.parse(localStorage.getItem(wordOrderKey)) || {};
allLists.forEach(list => {
    if (savedWordOrders[list.title]) {
        list.forceWords = savedWordOrders[list.title];
    }
});
// ----------------------------------

const originalItems = allLists.map(list => [...list.items]);

let forcedIndicesMap = JSON.parse(localStorage.getItem(forceKey)) || {};

allLists.forEach(l => {
    if (!forcedIndicesMap[l.title]) forcedIndicesMap[l.title] = [null, null];
});

const container = document.getElementById('app-container');
const gallery = document.getElementById('gallery-overlay');
const swiperEl = document.querySelector('.swiper');
const indicator = document.getElementById('indicator');
const settingsPage = document.getElementById('settings-page');

let swiperInstance;
let magicModeActive = false; 
let inputBuffer = "";
let forceCount = 0;
let isUpsideDown = false; 

gallery.addEventListener('click', () => {
    gallery.style.display = 'none';
    swiperEl.style.display = 'block';

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleFlip);
                }
            })
            .catch(err => console.error('Motion permission denied', err));
    } else {
        window.addEventListener('deviceorientation', handleFlip);
    }
    initApp();
});

function handleFlip(event) {
    const tilt = Math.abs(event.beta);
    if (tilt > 160 && !isUpsideDown) {
        isUpsideDown = true;
        toggleMagicMode(); 
    } else if (tilt < 100 && isUpsideDown) {
        isUpsideDown = false; 
    }
}

function toggleMagicMode() {
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
}

function initApp() {
    allLists.forEach((list) => {
        const indices = forcedIndicesMap[list.title];
        indices.forEach((savedIdx, fCount) => {
            if (savedIdx !== null) {
                list.items[savedIdx] = list.forceWords[fCount];
            }
        });
    });

    container.innerHTML = '';
    allLists.forEach((list, i) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        slide.setAttribute('data-swiper-slide-index', i);
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
    swiperInstance = new Swiper('.swiper', { 
        loop: true,
        threshold: 2,           
        longSwipesRatio: 0.1,   
        speed: 400,             
        shortSwipes: true,      
        followFinger: true,     
        touchMoveStopPropagation: true, 
        slidesPerGroup: 1,      
        touchReleaseOnEdges: true
    });
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
            toggleMagicMode();
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
            const currentIdx = swiperInstance.realIndex;
            applyGlobalForce(parseInt(inputBuffer), currentIdx);
            
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

function applyGlobalForce(position, excludedIdx) {
    const targetIdx = Math.min(Math.max(position - 1, 0), 49);

    allLists.forEach((list, i) => {
        if (i === excludedIdx) return;

        const listOriginals = originalItems[i];

        if (forcedIndicesMap[list.title][forceCount] !== null) {
            const oldIdx = forcedIndicesMap[list.title][forceCount];
            list.items[oldIdx] = listOriginals[oldIdx];
        }

        forcedIndicesMap[list.title][forceCount] = targetIdx;
        list.items[targetIdx] = list.forceWords[forceCount];
    });

    localStorage.setItem(forceKey, JSON.stringify(forcedIndicesMap));
    updateUI();
}

function updateUI() {
    allLists.forEach((listData, listIdx) => {
        const slides = document.querySelectorAll(`[data-swiper-slide-index="${listIdx}"]`);
        slides.forEach(slide => {
            listData.items.forEach((item, itemIdx) => {
                const el = slide.querySelector(`[data-pos="${itemIdx}"]`);
                if (el) el.innerText = `${itemIdx + 1}. ${item}`;
            });
        });
    });
}

function openSettings() {
    const sList = document.getElementById('settings-list');
    sList.innerHTML = '<h2>List Order & Forces</h2>';
    allLists.forEach((l, i) => {
        const item = document.createElement('div');
        item.className = 'settings-item';
        item.style.flexDirection = 'column';
        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; width:100%;">
                <span>${l.title}</span>
                <button onclick="moveList(${i})">UP ↑</button>
            </div>
            <div style="font-size:11px; margin-top:5px; color:#888; display:flex; justify-content:space-between; align-items:center; width:100%;">
                <span>1: ${l.forceWords[0]} | 2: ${l.forceWords[1]}</span>
                <button onclick="swapForces('${l.title}')" style="font-size:9px; padding:2px 5px;">SWAP</button>
            </div>
        `;
        sList.appendChild(item);
    });
    settingsPage.style.display = 'flex';
}

window.moveList = (i) => {
    if (i > 0) {
        [allLists[i], allLists[i-1]] = [allLists[i-1], allLists[i]];
        [originalItems[i], originalItems[i-1]] = [originalItems[i-1], originalItems[i]];
        localStorage.setItem(listKey, JSON.stringify(allLists.map(l => l.title)));
        openSettings();
    }
};

window.swapForces = (title) => {
    const list = master.find(l => l.title === title);
    if (list) {
        [list.forceWords[0], list.forceWords[1]] = [list.forceWords[1], list.forceWords[0]];
        const indices = forcedIndicesMap[title];
        [indices[0], indices[1]] = [indices[1], indices[0]];
        
        // --- NEW: SAVE WORD ORDER ---
        let orders = JSON.parse(localStorage.getItem(wordOrderKey)) || {};
        orders[title] = list.forceWords;
        localStorage.setItem(wordOrderKey, JSON.stringify(orders));
        // ----------------------------

        localStorage.setItem(forceKey, JSON.stringify(forcedIndicesMap));
        if (navigator.vibrate) navigator.vibrate(30);
        openSettings();
    }
};

document.getElementById('close-settings').onclick = () => {
    settingsPage.style.display = 'none';
    initApp();
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker Registered'))
      .catch(err => console.log('Service Worker Failed', err));
  });
}

