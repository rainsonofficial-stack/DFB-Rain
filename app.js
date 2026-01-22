/**
 * APP CONFIGURATION & STATE
 */
let allLists = [movieData, cardData, objectData]; 
// Deep copy of original items to allow for a true reset
const originalItems = allLists.map(list => [...list.items]);

const container = document.getElementById('app-container');
const gallery = document.getElementById('gallery-overlay');
const swiperEl = document.querySelector('.swiper');
const indicator = document.getElementById('indicator');
const settingsPage = document.getElementById('settings-page');

let swiperInstance;
let secretActive = false;
let inputBuffer = "";
let forceCount = 0;

/**
 * INITIALIZATION & GALLERY TRANSITION
 */
gallery.addEventListener('click', () => {
    gallery.style.display = 'none';
    swiperEl.style.display = 'block';
    initApp();
});

function initApp() {
    container.innerHTML = '';
    allLists.forEach((list, listIdx) => {
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        
        let itemsHtml = '';
        list.items.forEach((item, itemIdx) => {
            // Numbers 1 to 50 in 2 columns (via CSS grid)
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
        speed: 400
    });
}

/**
 * TOUCH EVENT HANDLING (LOGIC & TRIGGERS)
 */
document.addEventListener('touchstart', (e) => {
    // Prevent interaction if gallery or settings are visible
    if (gallery.style.display !== 'none' || settingsPage.style.display === 'flex') return;
    
    const t = e.touches[0];
    const w = window.innerWidth;
    const h = window.innerHeight;
    const now = Date.now();
    const lastTap = document.body.dataset.lastTap || 0;

    // Detection for Double Tap
    if (now - lastTap < 300) {
        // TRIGGER 1: BOTTOM RIGHT (RESET + ACTIVATE MAGIC)
        if (t.clientX > w * 0.8 && t.clientY > h * 0.8) {
            performGlobalReset();
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            return;
        }
        // TRIGGER 2: BOTTOM LEFT (SETTINGS PAGE)
        if (t.clientX < w * 0.2 && t.clientY > h * 0.8) {
            openSettings();
            if (navigator.vibrate) navigator.vibrate(50);
            return;
        }
    }
    document.body.dataset.lastTap = now;

    // INPUT CAPTURE (3x3 GRID)
    if (secretActive && forceCount < 2) {
        const digit = getGridDigit(t.clientX, t.clientY, w, h);
        inputBuffer += digit;

        if (inputBuffer.length === 2) {
            applyForceDiscreetly(parseInt(inputBuffer));
            inputBuffer = "";
            forceCount++;
            if (navigator.vibrate) navigator.vibrate([30, 50]);
            
            // Deactivate indicator after 2nd force
            if (forceCount === 2) { 
                secretActive = false; 
                indicator.classList.remove('active'); 
            }
        }
    }
});

/**
 * SECRET LOGIC FUNCTIONS
 */
function getGridDigit(x, y, w, h) {
    // Check if touch is inside the 66% vertical black box area
    if (y < h * 0.17 || y > h * 0.83) return "0";
    
    const col = Math.floor((x / w) * 3);
    const row = Math.floor(((y - h * 0.17) / (h * 0.66)) * 3);
    const digit = (row * 3) + col + 1;
    
    return (digit > 9 || digit < 1) ? "0" : digit.toString();
}

function applyForceDiscreetly(position) {
    const targetIdx = Math.min(Math.max(position - 1, 0), 49);
    const activeIdx = swiperInstance.realIndex;
    
    // Update all slides (including duplicates) EXCEPT the one currently on screen
    document.querySelectorAll('.swiper-slide').forEach((slide) => {
        const sIdx = parseInt(slide.getAttribute('data-swiper-slide-index'));
        if (sIdx !== activeIdx) {
            const listData = allLists[sIdx];
            if (listData) {
                const el = slide.querySelector(`[data-pos="${targetIdx}"]`);
                if (el) {
                    el.innerText = `${targetIdx + 1}. ${listData.forceWords[forceCount]}`;
                    // Store the change back to our main array so it persists if re-initialized
                    listData.items[targetIdx] = listData.forceWords[forceCount];
                }
            }
        }
    });
}

function performGlobalReset() {
    // Clear magic state
    inputBuffer = "";
    forceCount = 0;
    
    // Reset data to original values
    allLists.forEach((list, i) => {
        list.items = [...originalItems[i]];
    });
    
    // Re-render UI
    initApp();
    
    // Auto-reactivate for the next performance
    secretActive = true;
    indicator.classList.add('active');
}

/**
 * SETTINGS PAGE LOGIC
 */
function openSettings() {
    const sList = document.getElementById('settings-list');
    sList.innerHTML = '';
    allLists.forEach((l, i) => {
        const item = document.createElement('div');
        item.className = 'settings-item';
        item.innerHTML = `
            <span>${l.title}</span> 
            <button onclick="moveList(${i})">MOVE UP ↑</button>
        `;
        sList.appendChild(item);
    });
    settingsPage.style.display = 'flex';
}

window.moveList = (i) => {
    if (i > 0) {
        // Swap list positions in the array
        [allLists[i], allLists[i-1]] = [allLists[i-1], allLists[i]];
        // Swap original positions as well to keep reset logic consistent
        [originalItems[i], originalItems[i-1]] = [originalItems[i-1], originalItems[i]];
        openSettings();
    }
};

document.getElementById('close-settings').onclick = () => {
    settingsPage.style.display = 'none';
    initApp();
};
