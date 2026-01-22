let allLists = [movieData, cardData, objectData]; 
// Keep a deep copy of original items for the reset function
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
        // --- UPDATED: DOUBLE TAP BOTTOM RIGHT (RESET) ---
        if (t.clientX > w * 0.8 && t.clientY > h * 0.8) {
            performGlobalReset();
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
            return;
        }
        // Double Tap Bottom Left: Settings
        if (t.clientX < w * 0.2 && t.clientY > h * 0.8) {
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
            if (forceCount === 2) { 
                secretActive = false; 
                indicator.classList.remove('active'); 
            }
        }
    }
});

function performGlobalReset() {
    secretActive = false;
    inputBuffer = "";
    forceCount = 0;
    indicator.classList.remove('active');

    // Restore original words to all lists
    allLists.forEach((list, i) => {
        list.items = [...originalItems[i]];
    });
    
    // Refresh the UI to show original words
    initApp();
    // Activate secret mode again for next input
    secretActive = true;
    indicator.classList.add('active');
}

// Grid, Force, and Settings logic remains the same...
// (Ensure getGridDigit and applyForceDiscreetly are included as per previous version)
