(function() {
    "use strict";

    // ==================== НАСТРОЙКИ ДАТЫ ====================
    // Целевая дата: 14 февраля 2026, 00:00 (месяцы с 0)
    const TARGET_DATE = new Date(2026, 1, 14, 0, 0, 0);
    
    // ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
    const STYLES = ['style1', 'style2', 'style3'];
    let currentStyle = 1;
    let timerInterval = null;

    // ==================== DOM ЭЛЕМЕНТЫ ====================
    const countdownEl = document.getElementById('countdown');
    const editor = document.getElementById('editor');
    const viewer = document.getElementById('viewer');
    const viewerAction = document.getElementById('viewerAction');

    // превью редактора
    const previewCard = document.getElementById('previewCard');
    const previewTo = document.getElementById('previewTo');
    const previewFrom = document.getElementById('previewFrom');
    const previewMsg = document.getElementById('previewMsg');

    // инпуты
    const toInput = document.getElementById('toInput');
    const fromInput = document.getElementById('fromInput');
    const msgInput = document.getElementById('msgInput');

    // стили
    const styleBtns = {
        1: document.getElementById('style1Btn'),
        2: document.getElementById('style2Btn'),
        3: document.getElementById('style3Btn')
    };

    // генерация ссылки
    const linkContainer = document.getElementById('linkContainer');
    const shortLinkInput = document.getElementById('shortLinkInput');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyLinkBtn');

    // просмотрщик
    const viewerCard = document.getElementById('viewerCard');
    const createNewBtn = document.getElementById('createNewBtn'); // теперь создаётся динамически

    // элементы таймера
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    // ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
    function isDateReached() {
        return new Date() >= TARGET_DATE;
    }

    // Показать/скрыть блоки в зависимости от даты и хэша
    function updateUIMode(forceViewer = false) {
        const hash = window.location.hash;
        const hasValidHash = hash && hash.startsWith('#14');

        // 1. Если есть валидный хэш — показываем открытку (viewer)
        if (hasValidHash) {
            countdownEl.classList.add('hidden');
            editor.classList.add('hidden');
            viewer.classList.remove('hidden');
            // Попытка отобразить открытку
            const success = showCardFromHash();
            if (!success) {
                // Если не удалось — сбрасываем и показываем таймер/редактор
                window.location.hash = '';
                updateUIMode(false);
            }
            return;
        }

        // 2. Нет хэша — определяем, наступила ли дата
        if (isDateReached()) {
            // Дата наступила — показываем редактор, скрываем таймер
            countdownEl.classList.add('hidden');
            editor.classList.remove('hidden');
            viewer.classList.add('hidden');
        } else {
            // Дата не наступила — показываем таймер
            countdownEl.classList.remove('hidden');
            editor.classList.add('hidden');
            viewer.classList.add('hidden');
        }
    }

    // ==================== ТАЙМЕР ====================
    function startCountdown() {
        if (timerInterval) clearInterval(timerInterval);
        
        function updateTimer() {
            const now = new Date();
            const diff = TARGET_DATE - now;

            if (diff <= 0) {
                // Достигли целевой даты
                clearInterval(timerInterval);
                timerInterval = null;
                // Если нет хэша — переключаем на редактор
                if (!window.location.hash.startsWith('#14')) {
                    updateUIMode();
                }
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (86400000)) / (3600000));
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            daysEl.textContent = days.toString().padStart(2, '0');
            hoursEl.textContent = hours.toString().padStart(2, '0');
            minutesEl.textContent = minutes.toString().padStart(2, '0');
            secondsEl.textContent = seconds.toString().padStart(2, '0');
        }

        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    // ==================== РАБОТА С ДАННЫМИ ОТКРЫТКИ ====================
    function getFormData() {
        return {
            s: currentStyle,
            t: toInput.value.trim() || 'Любимого человека',
            f: fromInput.value.trim() || 'Твоего тайного поклонника',
            m: msgInput.value.trim() || 'С 14 февраля! ❤️'
        };
    }

    function updatePreview() {
        const d = getFormData();
        previewCard.className = 'card ' + STYLES[d.s - 1];
        previewTo.textContent = '💗 Для: ' + d.t;
        previewFrom.textContent = '💖 От: ' + d.f;
        previewMsg.textContent = d.m;
    }

    function setActiveStyle(styleNum) {
        currentStyle = styleNum;
        for (let i = 1; i <= 3; i++) {
            styleBtns[i].classList.toggle('active', i === styleNum);
        }
        updatePreview();
    }

    // --- Упаковка данных (без JSON, разделитель `) ---
    function encodeData(data) {
        return `${data.s}\`${data.t}\`${data.f}\`${data.m}`;
    }

    function decodeData(str) {
        const parts = str.split('`');
        if (parts.length < 4) return null;
        return {
            s: parseInt(parts[0], 10) || 1,
            t: parts[1] || '',
            f: parts[2] || '',
            m: parts.slice(3).join('`')
        };
    }

    // --- ROT13/ROT5 (без увеличения длины) ---
    function cipher(str) {
        return str.split('').map(ch => {
            const code = ch.charCodeAt(0);
            if (code >= 65 && code <= 90)
                return String.fromCharCode(((code - 65 + 13) % 26) + 65);
            if (code >= 97 && code <= 122)
                return String.fromCharCode(((code - 97 + 13) % 26) + 97);
            if (code >= 48 && code <= 57)
                return String.fromCharCode(((code - 48 + 5) % 10) + 48);
            return ch;
        }).join('');
    }

    function decipher(str) {
        return str.split('').map(ch => {
            const code = ch.charCodeAt(0);
            if (code >= 65 && code <= 90)
                return String.fromCharCode(((code - 65 - 13 + 26) % 26) + 65);
            if (code >= 97 && code <= 122)
                return String.fromCharCode(((code - 97 - 13 + 26) % 26) + 97);
            if (code >= 48 && code <= 57)
                return String.fromCharCode(((code - 48 - 5 + 10) % 10) + 48);
            return ch;
        }).join('');
    }

    // --- Генерация короткой ссылки (доступна только после наступления даты) ---
    function generateShortLink() {
        if (!isDateReached()) {
            alert('Создание открыток станет доступным 14 февраля 💕');
            return;
        }
        const data = getFormData();
        const raw = encodeData(data);
        const compressed = LZString.compressToEncodedURIComponent(raw);
        const encrypted = cipher(compressed);
        const url = window.location.href.split('#')[0] + '#14' + encrypted;
        shortLinkInput.value = url;
        linkContainer.style.display = 'block';
        history.pushState(null, null, '#14' + encrypted);
    }

    // --- Показать открытку из хэша ---
    function showCardFromHash() {
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#14')) return false;

        const encrypted = hash.slice(3);
        if (!encrypted) return false;

        try {
            const compressed = decipher(encrypted);
            const raw = LZString.decompressFromEncodedURIComponent(compressed);
            if (!raw) throw new Error('Распаковка не удалась');
            const data = decodeData(raw);
            if (!data) throw new Error('Неверный формат');

            // Показываем карточку
            viewerCard.className = 'card ' + STYLES[(data.s || 1) - 1];
            viewerCard.innerHTML = `
                <h3>💌 Валентинка</h3>
                <div class="to-from">💗 Для: ${escapeHTML(data.t || '...')}</div>
                <div class="to-from">💖 От: ${escapeHTML(data.f || '...')}</div>
                <div class="message">${escapeHTML(data.m || 'С праздником!').replace(/\n/g, '<br>')}</div>
            `;

            // Кнопка/сообщение в зависимости от даты
            viewerAction.innerHTML = '';
            if (isDateReached()) {
                // Дата наступила — показываем кнопку создания
                const btn = document.createElement('button');
                btn.id = 'createNewBtn';
                btn.className = 'btn back-btn';
                btn.textContent = '💘 Создать свою открытку';
                btn.addEventListener('click', resetToEditor);
                viewerAction.appendChild(btn);
            } else {
                // Дата не наступила — информационное сообщение
                const msg = document.createElement('div');
                msg.className = 'viewer-message';
                msg.textContent = '✨ Создание открыток откроется 14 февраля ✨';
                viewerAction.appendChild(msg);
            }

            return true;
        } catch (e) {
            console.error('Ошибка декодирования', e);
            return false;
        }
    }

    function escapeHTML(str) {
        return String(str).replace(/[&<>"]/g, function(c) {
            if (c === '&') return '&amp;';
            if (c === '<') return '&lt;';
            if (c === '>') return '&gt;';
            if (c === '"') return '&quot;';
            return c;
        });
    }

    // --- Сброс к редактору/таймеру ---
    function resetToEditor() {
        window.location.hash = '';
        updateUIMode();
    }

    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    function init() {
        toInput.addEventListener('input', updatePreview);
        fromInput.addEventListener('input', updatePreview);
        msgInput.addEventListener('input', updatePreview);

        styleBtns[1].addEventListener('click', () => setActiveStyle(1));
        styleBtns[2].addEventListener('click', () => setActiveStyle(2));
        styleBtns[3].addEventListener('click', () => setActiveStyle(3));

        generateBtn.addEventListener('click', generateShortLink);

        copyBtn.addEventListener('click', function() {
            shortLinkInput.select();
            navigator.clipboard.writeText(shortLinkInput.value)
                .then(() => alert('🔗 Ссылка скопирована!'))
                .catch(() => alert('Выделите и скопируйте вручную'));
        });

        // Запускаем таймер
        startCountdown();

        // Определяем начальное состояние интерфейса
        updateUIMode();

        // Следим за изменением хэша
        window.addEventListener('hashchange', function() {
            updateUIMode();
        });

        // Первоначальное обновление превью
        updatePreview();
    }

    init();
})();
