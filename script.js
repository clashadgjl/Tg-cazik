// Конфигурация игры
const COST_PER_SPIN = 10;
let balance = 1000;
let currentMode = 'zeus'; // 'zeus' или 'hades'

// Наборы символов (используем эмодзи вместо картинок)
// Зевс: Молния (Wild), Пегас, Шлем, Кубок, Буквы
// Аид: Огонь (Wild), Цербер, Шлем тьмы, Череп, Буквы
const SYMBOLS = {
    zeus: ['⚡', '🦄', '🛡️', '🏺', 'A', 'K', 'Q', 'J', '10'],
    hades: ['🔥', '🐺', '👁️', '💀', 'A', 'K', 'Q', 'J', '10']
};

// Коэффициенты выплат (упрощенно)
const PAYTABLE = {
    '⚡': 50, '🔥': 50, // Wilds
    '🦄': 20, '🐺': 20, // High pay
    '🛡️': 10, '👁️': 10,
    '🏺': 5, '💀': 5,
    'A': 2, 'K': 2, 'Q': 1, 'J': 1, '10': 1
};

// DOM Элементы
const reels = [
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
    document.getElementById('reel-3'),
    document.getElementById('reel-4'),
    document.getElementById('reel-5')
];
const spinBtn = document.getElementById('spin-btn');
const balanceDisplay = document.getElementById('balance');
const winDisplay = document.getElementById('win-amount');
const msgBox = document.getElementById('message');
const body = document.body;
const btnZeus = document.getElementById('btn-zeus');
const btnHades = document.getElementById('btn-hades');

// Переключение режимов
btnZeus.addEventListener('click', () => setMode('zeus'));
btnHades.addEventListener('click', () => setMode('hades'));

function setMode(mode) {
    currentMode = mode;
    body.className = `mode-${mode}`;
    
    // Обновляем активность кнопок
    if(mode === 'zeus') {
        btnZeus.classList.add('active');
        btnHades.classList.remove('active');
    } else {
        btnHades.classList.add('active');
        btnZeus.classList.remove('active');
    }
    // Перерисовываем символы при смене режима
    updateReelsInstantly();
}

// Функция Спина
spinBtn.addEventListener('click', () => {
    if (balance < COST_PER_SPIN) {
        alert("Недостаточно средств!");
        return;
    }

    // Списание баланса
    balance -= COST_PER_SPIN;
    updateUI(0); // Сброс выигрыша
    spinBtn.disabled = true;
    msgBox.classList.add('hidden');

    // Анимация и логика
    spinReels();
});

function spinReels() {
    // Добавляем эффект размытия
    reels.forEach(reel => reel.classList.add('blur'));

    // Задержка перед остановкой (эмуляция сети/процесса)
    setTimeout(() => {
        const results = [];
        
        // Генерируем результаты для каждого барабана
        reels.forEach((reel, index) => {
            // Убираем размытие с задержкой для каждого барабана (эффект волны)
            setTimeout(() => {
                reel.classList.remove('blur');
                const reelResult = generateReelSymbols();
                results.push(reelResult);
                renderReel(reel, reelResult);
                
                // Если это последний барабан, проверяем выигрыш
                if (index === 4) {
                    checkWin(results);
                    spinBtn.disabled = false;
                }
            }, index * 200); // 200мс задержка между барабанами
        });
    }, 1000);
}

// Генерация 3 символов для одного барабана
function generateReelSymbols() {
    const pool = SYMBOLS[currentMode];
    return [
        pool[Math.floor(Math.random() * pool.length)],
        pool[Math.floor(Math.random() * pool.length)],
        pool[Math.floor(Math.random() * pool.length)]
    ];
}

// Отрисовка символов в HTML
function renderReel(reelElement, symbols) {
    reelElement.innerHTML = '';
    symbols.forEach(sym => {
        const div = document.createElement('div');
        div.className = 'symbol';
        div.textContent = sym;
        reelElement.appendChild(div);
    });
}

// Мгновенная перерисовка (для смены темы)
function updateReelsInstantly() {
    reels.forEach(reel => {
        renderReel(reel, generateReelSymbols());
    });
}

// Простая логика проверки выигрыша
// (Проверяем только центральную линию для примера)
function checkWin(allReelsResults) {
    // Берем символы из центрального ряда (индекс 1)
    const row2 = allReelsResults.map(reel => reel[1]);
    
    let winAmount = 0;
    
    // Проверка совпадений (минимум 3 подряд слева)
    // Это очень упрощенная логика
    let count = 1;
    let symbol = row2[0];
    
    for (let i = 1; i < row2.length; i++) {
        if (row2[i] === symbol || row2[i] === '⚡' || row2[i] === '🔥') { // Учитываем Wild
            count++;
        } else {
            break;
        }
    }

    if (count >= 3) {
        // Базовая выплата * множитель
        const multiplier = PAYTABLE[symbol] || 1;
        winAmount = COST_PER_SPIN * multiplier * (count - 1); 
        
        showWinMessage(winAmount);
    }

    if (winAmount > 0) {
        balance += winAmount;
        updateUI(winAmount);
    } else {
        updateUI(0);
    }
}

function showWinMessage(amount) {
    msgBox.textContent = `WIN: ${amount}$`;
    msgBox.classList.remove('hidden');
    // Спецэффект для большого выигрыша
    if(amount > 50) {
        msgBox.style.fontSize = '4rem';
        msgBox.style.color = 'red';
    } else {
        msgBox.style.fontSize = '3rem';
        msgBox.style.color = 'black';
    }
}

function updateUI(win) {
    balanceDisplay.textContent = balance;
    winDisplay.textContent = win;
}

// Инициализация при старте
updateReelsInstantly();
