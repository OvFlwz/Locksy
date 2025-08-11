document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const dom = {
        passwordInput: document.getElementById('password-input'),
        toggleBtn: document.getElementById('toggle-visibility-btn'),
        eyeIcon: document.getElementById('eye-icon'),
        eyeOffIcon: document.getElementById('eye-off-icon'),
        strengthBar: document.getElementById('strength-bar'),
        resultsContainer: document.getElementById('results-container'),
        strengthLabel: document.getElementById('strength-label'),
        timeToCrackLabel: document.getElementById('time-to-crack-label'),
        entropyLabel: document.getElementById('entropy-label'),
        generateBtn: document.getElementById('generate-btn'),
        copyBtn: document.getElementById('copy-btn'),
        themeToggle: document.getElementById('theme-toggle'),
        sunIcon: document.getElementById('sun-icon'),
        moonIcon: document.getElementById('moon-icon'),
        historyBtn: document.getElementById('history-btn'),
        historyPanel: document.getElementById('history-panel'),
        historyList: document.getElementById('history-list'),
        lengthSlider: document.getElementById('length-slider'),
        lengthValue: document.getElementById('length-value'),
        incUppercase: document.getElementById('inc-uppercase'),
        incNumbers: document.getElementById('inc-numbers'),
        incSpecial: document.getElementById('inc-special'),
        suggestions: {
            length: document.getElementById('length'),
            uppercase: document.getElementById('uppercase'),
            lowercase: document.getElementById('lowercase'),
            number: document.getElementById('number'),
            special: document.getElementById('special'),
            entropy: document.getElementById('entropy')
        }
    };

    // --- State & Constants ---
    let passwordHistory = JSON.parse(localStorage.getItem('passwordHistory')) || [];
    const STRENGTH_LEVELS = [
        { text: 'Very Weak', color: '#ef4444' }, { text: 'Weak', color: '#f97316' },
        { text: 'Moderate', color: '#facc15' }, { text: 'Strong', color: '#84cc16' },
        { text: 'Very Strong', color: '#22c55e' }
    ];
    const CROSS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-500/70"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const CHECK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-green-500/80"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    // --- Event Listeners ---
    dom.passwordInput.addEventListener('input', handlePasswordInput);
    dom.toggleBtn.addEventListener('click', togglePasswordVisibility);
    dom.generateBtn.addEventListener('click', generateAndSetPassword);
    dom.copyBtn.addEventListener('click', () => copyToClipboard());
    dom.themeToggle.addEventListener('click', toggleTheme);
    dom.historyBtn.addEventListener('click', toggleHistoryPanel);
    dom.lengthSlider.addEventListener('input', () => dom.lengthValue.textContent = dom.lengthSlider.value);

    // --- Initialization ---
    initializeTheme();
    updateHistoryPanel();
    handlePasswordInput();

    // --- Core Functions ---
    function handlePasswordInput() {
        const password = dom.passwordInput.value;
        const { feedback, entropy } = evaluatePassword(password);
        updateUI(password, feedback, entropy);
        if (password) addToHistory(password);
    }
    
    function evaluatePassword(password) {
        let pool = 0;
        const feedback = {
            length: password.length >= 12,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
        };
        if (feedback.lowercase) pool += 26;
        if (feedback.uppercase) pool += 26;
        if (feedback.number) pool += 10;
        if (feedback.special) pool += 32;
        const entropy = password.length * (Math.log(pool) / Math.log(2)) || 0;
        feedback.entropy = entropy >= 75;
        return { feedback, entropy };
    }

    function updateUI(password, feedback, entropy) {
        Object.keys(feedback).forEach(key => {
            if (dom.suggestions[key]) updateSuggestion(dom.suggestions[key], feedback[key]);
        });
        dom.entropyLabel.textContent = `${Math.round(entropy)} bits of entropy`;

        if (!password) {
            dom.resultsContainer.style.opacity = '0';
            dom.strengthBar.style.width = '0%';
            return;
        }
        
        dom.resultsContainer.style.opacity = '1';

        let levelIndex = 0;
        if (entropy >= 100) levelIndex = 4;
        else if (entropy >= 75) levelIndex = 3;
        else if (entropy >= 50) levelIndex = 2;
        else if (entropy >= 25) levelIndex = 1;
        
        const level = STRENGTH_LEVELS[levelIndex];
        dom.strengthBar.style.width = `${Math.min((entropy / 120) * 100, 100)}%`;
        dom.strengthBar.style.backgroundColor = level.color;
        dom.strengthLabel.textContent = level.text;
        dom.strengthLabel.style.color = level.color;
        dom.timeToCrackLabel.textContent = `~ ${estimateTimeToCrack(entropy)}`;
    }

    function updateSuggestion(element, isMet) {
        element.querySelector('span').innerHTML = isMet ? CHECK_ICON : CROSS_ICON;
        element.classList.toggle('dark:text-gray-300', isMet);
        element.classList.toggle('text-gray-900', isMet);
        element.classList.toggle('dark:text-gray-500', !isMet);
        element.classList.toggle('text-gray-500', !isMet);
    }

    function estimateTimeToCrack(entropy) {
        const calculationsPerSecond = 1e9; // 1 billion guesses/sec
        const seconds = (0.5 * Math.pow(2, entropy)) / calculationsPerSecond;
        if (seconds < 60) return "Instantly";
        if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.ceil(seconds / 86400)} days`;
        if (seconds < 3153600000) return `${Math.ceil(seconds / 31536000)} years`;
        return "Centuries";
    }

    // --- Helper & UI Functions ---
    function generateAndSetPassword() {
        const length = dom.lengthSlider.value;
        const charSets = {
            lower: 'abcdefghijklmnopqrstuvwxyz',
            upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            numbers: '0123456789',
            special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
        };
        let characterPool = charSets.lower;
        if (dom.incUppercase.checked) characterPool += charSets.upper;
        if (dom.incNumbers.checked) characterPool += charSets.numbers;
        if (dom.incSpecial.checked) characterPool += charSets.special;
        
        if (characterPool === '') {
            console.error('Please select at least one character set for password generation.');
            dom.copyBtn.dataset.tooltip = 'Select a character set!';
            setTimeout(() => { dom.copyBtn.dataset.tooltip = 'Copy to Clipboard'; }, 2000);
            return;
        }

        let password = '';
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < length; i++) {
            password += characterPool[randomValues[i] % characterPool.length];
        }
        dom.passwordInput.value = password;
        handlePasswordInput();
        copyToClipboard('Generated password copied!');
    }

    function copyToClipboard(message = 'Password copied!') {
        if (!dom.passwordInput.value) return;
        const textArea = document.createElement("textarea");
        textArea.value = dom.passwordInput.value;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            const originalTooltip = dom.copyBtn.dataset.tooltip;
            dom.copyBtn.dataset.tooltip = message;
            setTimeout(() => { dom.copyBtn.dataset.tooltip = originalTooltip; }, 2000);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
        document.body.removeChild(textArea);
    }
    
    function togglePasswordVisibility() {
        const isPassword = dom.passwordInput.type === 'password';
        dom.passwordInput.type = isPassword ? 'text' : 'password';
        dom.eyeIcon.classList.toggle('hidden', isPassword);
        dom.eyeOffIcon.classList.toggle('hidden', !isPassword);
    }

    function toggleTheme() {
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', !isCurrentlyDark);
        localStorage.setItem('theme', !isCurrentlyDark ? 'dark' : 'light');
        updateThemeIcons(!isCurrentlyDark);
    }

    function initializeTheme() {
        const savedThemeIsDark = localStorage.getItem('theme') !== 'light';
        document.documentElement.classList.toggle('dark', savedThemeIsDark);
        updateThemeIcons(savedThemeIsDark);
    }
    
    function updateThemeIcons(isDark) {
        dom.sunIcon.classList.toggle('hidden', isDark);
        dom.moonIcon.classList.toggle('hidden', !isDark);
    }

    function toggleHistoryPanel() {
        dom.historyPanel.classList.toggle('hidden');
        if (!dom.historyPanel.classList.contains('hidden')) {
            dom.historyPanel.style.maxHeight = dom.historyPanel.scrollHeight + "px";
        } else {
            dom.historyPanel.style.maxHeight = '0';
        }
    }

    function addToHistory(password) {
        if (!password) return;
        if (passwordHistory[0] === password) return;
        passwordHistory.unshift(password);
        if (passwordHistory.length > 3) passwordHistory.pop();
        localStorage.setItem('passwordHistory', JSON.stringify(passwordHistory));
        updateHistoryPanel();
    }

    function updateHistoryPanel() {
        dom.historyList.innerHTML = passwordHistory.length ? 
            passwordHistory.map(p => `<li>${p}</li>`).join('') : 
            '<li>No history yet.</li>';
    }
});
