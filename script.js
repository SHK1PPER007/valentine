(function() {
    "use strict";

    const STYLES = ['style1', 'style2', 'style3'];
    let currentStyle = 1;

    // --- DOM элементы ---
    const editor = document.getElementById('editor');
    const viewer = document.getElementById('viewer');
    const previewCard = document.getElementById('previewCard');
    const previewTo = document.getElementById('previewTo');
    const previewFrom = document.getElementById('previewFrom');
    const previewMsg = document.getElementById('previewMsg');
    const toInput = document.getElementById('toInput');
    const fromInput = document.getElementById('fromInput');
    const msgInput = document.getElementById('msgInput');
    const styleBtns = {
        1: document.getElementById('style1Btn'),
        2: document.getElementById('style2Btn'),
        3: document.getElementById('style3Btn')
    };
    const linkContainer = document.getElementById('linkContainer');
    const shortLinkInput = document.getElementById('shortLinkInput');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyLinkBtn');
    const viewerCard = document.getElementById('viewerCard');
    const createNewBtn = document.getElementById('createNewBtn');

    // --- Получить данные формы ---
    function getFormData() {
        return {
            s: currentStyle,
            t: toInput.value.trim() || 'Любимого человека',
            f: fromInput.value.trim() || 'Твоего тайного поклонника',
            m: msgInput.value.trim() || 'С 14 февраля! ❤️'
        };
    }

    // --- Обновление превью ---
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

    // --- Упаковка в строку (разделитель `) ---
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

    // --- Генерация сверхкороткой ссылки ---
    function generateShortLink() {
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

            editor.classList.add('hidden');
            viewer.classList.remove('hidden');

            viewerCard.className = 'card ' + STYLES[(data.s || 1) - 1];
            viewerCard.innerHTML = `
                <h3>💌 Валентинка</h3>
                <div class="to-from">💗 Для: ${escapeHTML(data.t || '...')}</div>
                <div class="to-from">💖 От: ${escapeHTML(data.f || '...')}</div>
                <div class="message">${escapeHTML(data.m || 'С праздником!').replace(/\n/g, '<br>')}</div>
            `;
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

    function resetToEditor() {
        editor.classList.remove('hidden');
        viewer.classList.add('hidden');
        history.pushState(null, null, window.location.pathname);
        linkContainer.style.display = 'none';
        setActiveStyle(1);
    }

    // --- Инициализация ---
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

        createNewBtn.addEventListener('click', resetToEditor);

        if (!showCardFromHash()) {
            editor.classList.remove('hidden');
            viewer.classList.add('hidden');
            setActiveStyle(1);
        }

        window.addEventListener('hashchange', function() {
            if (!showCardFromHash()) resetToEditor();
        });

        updatePreview();
    }

    init();
})();