/**
 * macOS Sequoia Web Clone - Application JavaScript
 * Handles all interactivity: lock screen, dock, windows, apps, menus, etc.
 * Pure vanilla JS - no frameworks.
 */

document.addEventListener('components-loaded', () => {
    // --- Global State ---
    let zIndexCounter = 100;
    let activeMenuDropdown = null;
    let notificationCenterOpen = false;

    // --- Initialize All Modules ---
    initLockScreen();
    initMenuBarClock();
    initDock();
    initWindows();
    initCalculator();
    initTerminal();
    initContextMenu();
    initMenuBar();
    initNotificationCenter();
    initWidgets();
    initCalendarDockIcon();
    initDesktopSelection();
    initSpotlight();

    // ==================================================================
    //  1. LOCK SCREEN
    // ==================================================================
    function initLockScreen() {
        const lockScreen = document.getElementById('lock-screen');
        if (!lockScreen) return;

        const lockTime = lockScreen.querySelector('.lock-time');
        const lockDate = lockScreen.querySelector('.lock-date');
        const passwordInput = document.getElementById('lock-password');
        const lockForm = document.getElementById('lock-form');
        if (lockForm) lockForm.addEventListener('submit', (e) => { e.preventDefault(); unlockDesktop(); });

        function updateLockClock() {
            const now = new Date();
            if (lockTime) {
                const hours = now.getHours();
                const minutes = now.getMinutes();
                const h = hours % 12 || 12;
                const m = String(minutes).padStart(2, '0');
                lockTime.textContent = `${h}:${m}`;
            }
            if (lockDate) {
                const options = { weekday: 'long', month: 'long', day: 'numeric' };
                lockDate.textContent = now.toLocaleDateString('en-US', options);
            }
        }

        updateLockClock();
        const lockClockInterval = setInterval(updateLockClock, 1000);

        if (passwordInput) {
            passwordInput.focus();
            passwordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') unlockDesktop();
            });
        }

        const unlockBtn = lockScreen.querySelector('.lock-submit');
        if (unlockBtn) unlockBtn.addEventListener('click', unlockDesktop);

        function unlockDesktop() {
            clearInterval(lockClockInterval);
            const desktop = document.getElementById('desktop');
            if (desktop) desktop.classList.remove('hidden');
            lockScreen.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            lockScreen.style.opacity = '0';
            lockScreen.style.transform = 'scale(1.05)';
            setTimeout(() => { lockScreen.style.display = 'none'; }, 600);
        }
    }

    // ==================================================================
    //  2. MENU BAR CLOCK
    // ==================================================================
    function initMenuBarClock() {
        const dateEl = document.getElementById('menu-bar-date-text');
        const timeEl = document.getElementById('menu-bar-time-text');
        if (!dateEl && !timeEl) return;

        function updateMenuClock() {
            const now = new Date();
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dayName = days[now.getDay()];
            const monthName = months[now.getMonth()];
            const date = now.getDate();
            let hours = now.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            const minutes = String(now.getMinutes()).padStart(2, '0');
            if (dateEl) dateEl.textContent = `${dayName} ${monthName} ${date}`;
            if (timeEl) timeEl.textContent = `${hours}:${minutes} ${ampm}`;
        }

        updateMenuClock();
        setInterval(updateMenuClock, 1000);
    }

    // ==================================================================
    //  3. DOCK INTERACTIONS
    // ==================================================================
    function initDock() {
        const dock = document.querySelector('.dock');
        if (!dock) return;

        const dockItems = dock.querySelectorAll('.dock-item');

        // Click to open app with bounce animation
        dockItems.forEach(item => {
            item.addEventListener('click', () => {
                const appName = item.getAttribute('data-app');
                if (!appName) return;

                // Bounce animation
                item.style.animation = 'dockBounce 0.6s ease';
                item.addEventListener('animationend', () => {
                    item.style.animation = '';
                }, { once: true });

                openApp(appName);
            });
        });

        // Dock magnification on mousemove
        dock.addEventListener('mousemove', (e) => {
            dockItems.forEach(icon => {
                const rect = icon.getBoundingClientRect();
                const iconCenterX = rect.left + rect.width / 2;
                const distance = Math.abs(e.clientX - iconCenterX);
                const maxDistance = 120;
                const maxScale = 1.5;
                const minScale = 1.0;

                if (distance < maxDistance) {
                    const scale = maxScale - ((maxScale - minScale) * (distance / maxDistance));
                    icon.style.transform = `scale(${scale}) translateY(${-(scale - 1) * 20}px)`;
                    icon.style.transformOrigin = 'bottom center';
                    icon.style.transition = 'transform 0.1s ease';
                } else {
                    icon.style.transform = 'scale(1)';
                    icon.style.transition = 'transform 0.2s ease';
                }
            });
        });

        dock.addEventListener('mouseleave', () => {
            dockItems.forEach(icon => {
                icon.style.transform = 'scale(1)';
                icon.style.transition = 'transform 0.3s ease';
            });
        });
    }

    /**
     * Open an application window by name and mark its dock icon active.
     */
    function openApp(appName) {
        // Try data-app first, then data-window for backwards compat
        let win = document.querySelector(`.window[data-app="${appName}"]`);
        if (!win) win = document.querySelector(`.window[data-window="${appName}"]`);
        if (!win) return;

        // If already active, just bring to front
        if (win.classList.contains('active')) {
            bringToFront(win);
            return;
        }

        win.classList.add('active');
        win.style.display = 'flex';
        bringToFront(win);

        // Mark dock icon active
        const dockIcon = document.querySelector(`.dock-item[data-app="${appName}"]`);
        if (dockIcon) dockIcon.classList.add('active');

        // Remove minimised styling if present
        win.style.transform = '';
        win.style.opacity = '';

        // Focus terminal input
        if (appName === 'terminal') {
            const termInput = win.querySelector('.terminal-input');
            if (termInput) setTimeout(() => termInput.focus(), 50);
        }
    }

    /**
     * Close an application window and remove dock active state.
     */
    function closeApp(win) {
        if (!win) return;
        // Closing animation
        win.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        win.style.opacity = '0';
        win.style.transform = 'scale(0.96)';
        setTimeout(() => {
            win.classList.remove('active');
            win.classList.remove('maximized');
            win.style.display = 'none';
            win.style.transition = '';
            win.style.opacity = '';
            win.style.transform = '';
        }, 200);

        const appName = win.getAttribute('data-app') || win.getAttribute('data-window');
        const dockIcon = document.querySelector(`.dock-item[data-app="${appName}"]`);
        if (dockIcon) dockIcon.classList.remove('active');
    }

    /**
     * Minimize a window with scale-to-dock animation.
     */
    function minimizeApp(win) {
        if (!win) return;
        win.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        win.style.transform = 'scale(0.05) translateY(400px)';
        win.style.opacity = '0';
        setTimeout(() => {
            win.classList.remove('active');
            win.style.display = 'none';
            win.style.transition = '';
            win.style.transform = '';
            win.style.opacity = '';
        }, 400);
    }

    /**
     * Bring a window to the front by assigning the highest z-index.
     */
    function bringToFront(win) {
        zIndexCounter++;
        win.style.zIndex = zIndexCounter;
    }

    // ==================================================================
    //  4. WINDOW MANAGEMENT
    // ==================================================================
    function initWindows() {
        const windows = document.querySelectorAll('.window');

        windows.forEach(win => {
            // Focus on click
            win.addEventListener('mousedown', () => bringToFront(win));

            // Traffic-light buttons (try multiple selectors for compat)
            const closeBtn = win.querySelector('.btn-close') ||
                             win.querySelector('.traffic-close') ||
                             win.querySelector('[data-action="close"]');
            const minimizeBtn = win.querySelector('.btn-minimize') ||
                                win.querySelector('.traffic-minimize') ||
                                win.querySelector('[data-action="minimize"]');
            const maximizeBtn = win.querySelector('.btn-maximize') ||
                                win.querySelector('.traffic-maximize') ||
                                win.querySelector('[data-action="maximize"]');

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeApp(win);
                });
            }

            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    minimizeApp(win);
                });
            }

            if (maximizeBtn) {
                maximizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleMaximize(win);
                });
            }

            // Dragging via titlebar
            const titlebar = win.querySelector('.window-titlebar');
            if (titlebar) initDrag(win, titlebar);

            // Resize handle
            const resizeHandle = win.querySelector('.resize-handle') ||
                                 win.querySelector('.window-resize-handle');
            if (resizeHandle) initResize(win, resizeHandle);
        });
    }

    function toggleMaximize(win) {
        if (win.classList.contains('maximized')) {
            win.style.transition = 'all 0.3s ease';
            win.style.top    = win.dataset.origTop;
            win.style.left   = win.dataset.origLeft;
            win.style.width  = win.dataset.origWidth;
            win.style.height = win.dataset.origHeight;
            win.classList.remove('maximized');
            setTimeout(() => { win.style.transition = ''; }, 300);
        } else {
            win.dataset.origTop    = win.style.top    || win.offsetTop + 'px';
            win.dataset.origLeft   = win.style.left   || win.offsetLeft + 'px';
            win.dataset.origWidth  = win.style.width  || win.offsetWidth + 'px';
            win.dataset.origHeight = win.style.height || win.offsetHeight + 'px';

            const menuBar = document.querySelector('.menu-bar') || document.getElementById('menu-bar');
            const topOffset = menuBar ? menuBar.offsetHeight : 0;
            win.style.transition = 'all 0.3s ease';
            win.style.top    = topOffset + 'px';
            win.style.left   = '0px';
            win.style.width  = '100vw';
            win.style.height = `calc(100vh - ${topOffset}px)`;
            win.classList.add('maximized');
            setTimeout(() => { win.style.transition = ''; }, 300);
        }
    }

    function initDrag(win, handle) {
        let isDragging = false;
        let offsetX = 0, offsetY = 0;

        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('.traffic-lights') || e.target.closest('.traffic-light') ||
                e.target.closest('.btn-close') || e.target.closest('.btn-minimize') ||
                e.target.closest('.btn-maximize') || e.target.closest('[data-action]')) return;

            isDragging = true;
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
            handle.style.cursor = 'grabbing';
            bringToFront(win);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            if (win.classList.contains('maximized')) {
                win.classList.remove('maximized');
                win.style.width  = win.dataset.origWidth  || '600px';
                win.style.height = win.dataset.origHeight || '400px';
                offsetX = parseInt(win.style.width) / 2;
                offsetY = 15;
            }
            win.style.left = (e.clientX - offsetX) + 'px';
            win.style.top  = (e.clientY - offsetY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                handle.style.cursor = '';
            }
        });
    }

    function initResize(win, handle) {
        let isResizing = false;
        let startX, startY, startW, startH;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startW = win.offsetWidth;
            startH = win.offsetHeight;
            bringToFront(win);
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newW = startW + (e.clientX - startX);
            const newH = startH + (e.clientY - startY);
            win.style.width  = Math.max(300, newW) + 'px';
            win.style.height = Math.max(200, newH) + 'px';
        });

        document.addEventListener('mouseup', () => { isResizing = false; });
    }

    // ==================================================================
    //  5. CALCULATOR APP
    // ==================================================================
    function initCalculator() {
        const calcWindow = document.querySelector('.window[data-app="calculator"]') ||
                           document.querySelector('.window[data-window="calculator"]');
        if (!calcWindow) return;

        const display = calcWindow.querySelector('.calc-display') ||
                        calcWindow.querySelector('.calculator-display');
        if (!display) return;

        let currentInput = '0';
        let firstOperand = null;
        let operator = null;
        let waitingForSecondOperand = false;

        function updateDisplay() {
            const num = parseFloat(currentInput);
            if (!isNaN(num) && currentInput.indexOf('.') === -1 && Math.abs(num) >= 1) {
                display.textContent = num.toLocaleString('en-US');
            } else {
                display.textContent = currentInput;
            }
        }

        updateDisplay();

        const buttons = calcWindow.querySelectorAll('.calc-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.getAttribute('data-value') || btn.textContent.trim();
                handleCalcInput(value);
            });
        });

        calcWindow.addEventListener('keydown', (e) => {
            const keyMap = {
                '0':'0','1':'1','2':'2','3':'3','4':'4',
                '5':'5','6':'6','7':'7','8':'8','9':'9',
                '.':'.', '+':'+', '-':'-', '*':'\u00D7',
                '/':'\u00F7', 'Enter':'=', 'Escape':'AC',
                'Backspace':'AC', '%':'%'
            };
            if (keyMap[e.key]) {
                handleCalcInput(keyMap[e.key]);
                e.preventDefault();
            }
        });

        function handleCalcInput(value) {
            if (/^\d$/.test(value)) {
                if (waitingForSecondOperand) {
                    currentInput = value;
                    waitingForSecondOperand = false;
                } else {
                    currentInput = currentInput === '0' ? value : currentInput + value;
                }
                updateDisplay();
                return;
            }

            if (value === '.') {
                if (waitingForSecondOperand) {
                    currentInput = '0.';
                    waitingForSecondOperand = false;
                    updateDisplay();
                    return;
                }
                if (!currentInput.includes('.')) currentInput += '.';
                updateDisplay();
                return;
            }

            if (value === 'AC' || value === 'C') {
                currentInput = '0';
                firstOperand = null;
                operator = null;
                waitingForSecondOperand = false;
                updateDisplay();
                return;
            }

            if (value === '+/-' || value === '\u00B1') {
                if (currentInput !== '0') {
                    currentInput = currentInput.startsWith('-')
                        ? currentInput.slice(1)
                        : '-' + currentInput;
                }
                updateDisplay();
                return;
            }

            if (value === '%') {
                currentInput = String(parseFloat(currentInput) / 100);
                updateDisplay();
                return;
            }

            if (['+', '-', '\u00D7', '\u00F7'].includes(value)) {
                const inputValue = parseFloat(currentInput);
                if (firstOperand !== null && operator && !waitingForSecondOperand) {
                    const result = calculate(firstOperand, operator, inputValue);
                    currentInput = String(result);
                    firstOperand = result;
                    updateDisplay();
                } else {
                    firstOperand = inputValue;
                }
                operator = value;
                waitingForSecondOperand = true;
                return;
            }

            if (value === '=') {
                if (firstOperand === null || operator === null) return;
                const inputValue = parseFloat(currentInput);
                const result = calculate(firstOperand, operator, inputValue);
                currentInput = String(result);
                firstOperand = null;
                operator = null;
                waitingForSecondOperand = false;
                updateDisplay();
                return;
            }
        }

        function calculate(a, op, b) {
            switch (op) {
                case '+':        return a + b;
                case '-':        return a - b;
                case '\u00D7':   return a * b;
                case '\u00F7':   return b !== 0 ? a / b : 'Error';
                default:         return b;
            }
        }
    }

    // ==================================================================
    //  6. TERMINAL APP
    // ==================================================================
    function initTerminal() {
        const termWindow = document.querySelector('.window[data-app="terminal"]') ||
                           document.querySelector('.window[data-window="terminal"]');
        if (!termWindow) return;

        const termBody = termWindow.querySelector('.terminal-body') ||
                         termWindow.querySelector('.terminal-content');
        if (!termBody) return;

        const PROMPT = 'lorenzo@MacBook-Pro ~ % ';

        appendOutput('Last login: ' + new Date().toString().split(' ').slice(0, 5).join(' ') + ' on ttys000');
        createPromptLine();

        termBody.addEventListener('click', () => {
            const input = termBody.querySelector('.terminal-input:last-of-type');
            if (input) input.focus();
        });

        function appendOutput(text) {
            const line = document.createElement('div');
            line.classList.add('terminal-line');
            line.style.whiteSpace = 'pre-wrap';
            line.style.fontFamily = 'inherit';
            line.textContent = text;
            termBody.appendChild(line);
        }

        function createPromptLine() {
            const wrapper = document.createElement('div');
            wrapper.classList.add('terminal-prompt-line');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';

            const promptSpan = document.createElement('span');
            promptSpan.classList.add('terminal-prompt');
            promptSpan.textContent = PROMPT;

            const input = document.createElement('input');
            input.type = 'text';
            input.classList.add('terminal-input');
            input.spellcheck = false;
            input.autocomplete = 'off';
            input.style.cssText = 'background:transparent;border:none;outline:none;color:inherit;font:inherit;flex:1;caret-color:white;';

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const cmd = input.value.trim();
                    input.readOnly = true;
                    input.classList.remove('terminal-input');
                    processCommand(cmd);
                }
            });

            wrapper.appendChild(promptSpan);
            wrapper.appendChild(input);
            termBody.appendChild(wrapper);
            input.focus();
            scrollTerminal();
        }

        function processCommand(cmd) {
            if (cmd === '') { createPromptLine(); return; }

            switch (cmd.toLowerCase()) {
                case 'ls':
                    appendOutput('Desktop    Documents    Downloads    Music    Pictures    Public    Movies');
                    break;
                case 'whoami':
                    appendOutput('lorenzo');
                    break;
                case 'pwd':
                    appendOutput('/Users/lorenzo');
                    break;
                case 'clear':
                    termBody.innerHTML = '';
                    createPromptLine();
                    return;
                case 'help':
                    appendOutput('Available commands:');
                    appendOutput('  ls        - List directory contents');
                    appendOutput('  whoami    - Display current user');
                    appendOutput('  pwd       - Print working directory');
                    appendOutput('  clear     - Clear terminal');
                    appendOutput('  neofetch  - System information');
                    appendOutput('  date      - Show current date/time');
                    appendOutput('  echo      - Print text');
                    appendOutput('  help      - Show this help');
                    break;
                case 'neofetch':
                    const art = [
                        '                    \'c.          lorenzo@MacBook-Pro',
                        '                 ,xNMM.          ----------------------',
                        '               .OMMMMo           OS: macOS Sequoia 15.3',
                        '               OMMM0,            Host: MacBook Pro (Web)',
                        '     .;loddo:\' loolloddol;.      Kernel: Darwin 24.3.0',
                        '   cKMMMMMMMMMMNWMMMMMMMMMM0:    Uptime: just now',
                        ' .KMMMMMMMMMMMMMMMMMMMMMMMWd.    Shell: zsh 5.9',
                        ' XMMMMMMMMMMMMMMMMMMMMMMMX.      Resolution: ' + window.innerWidth + 'x' + window.innerHeight,
                        ';MMMMMMMMMMMMMMMMMMMMMMMM:       DE: Aqua',
                        ':MMMMMMMMMMMMMMMMMMMMMMMM:       WM: Quartz Compositor',
                        '.MMMMMMMMMMMMMMMMMMMMMMMMX.      Terminal: web-terminal',
                        ' kMMMMMMMMMMMMMMMMMMMMMMMMWd.    CPU: Apple Silicon',
                        ' .XMMMMMMMMMMMMMMMMMMMMMMMMMMk   Memory: 16384 MiB',
                        '  .XMMMMMMMMMMMMMMMMMMMMMMMMK.',
                        '    kMMMMMMMMMMMMMMMMMMMMMMd.',
                        '     ;KMMMMMMMWXXWMMMMMMMk.',
                        '       .cooc,.    .,coo:.',
                    ];
                    art.forEach(line => appendOutput(line));
                    break;
                case 'date':
                    appendOutput(new Date().toString());
                    break;
                default:
                    if (cmd.toLowerCase().startsWith('echo ')) {
                        appendOutput(cmd.slice(5));
                    } else {
                        appendOutput(`zsh: command not found: ${cmd}`);
                    }
                    break;
            }
            createPromptLine();
        }

        function scrollTerminal() { termBody.scrollTop = termBody.scrollHeight; }
        const observer = new MutationObserver(scrollTerminal);
        observer.observe(termBody, { childList: true, subtree: true });
    }

    // ==================================================================
    //  7. CONTEXT MENU (Right-Click on Desktop)
    // ==================================================================
    function initContextMenu() {
        const desktop = document.querySelector('.desktop') || document.getElementById('desktop');
        if (!desktop) return;

        let contextMenu = document.getElementById('context-menu');
        if (!contextMenu) {
            contextMenu = document.createElement('div');
            contextMenu.id = 'context-menu';
            contextMenu.classList.add('context-menu');
            contextMenu.innerHTML = `
                <div class="context-menu-item" data-action="new-folder">New Folder</div>
                <div class="context-menu-item" data-action="get-info">Get Info</div>
                <div class="context-menu-item" data-action="change-bg">Change Desktop Background...</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="use-stacks">Use Stacks</div>
                <div class="context-menu-item has-submenu" data-action="sort-by">Sort By</div>
                <div class="context-menu-item" data-action="clean-up">Clean Up</div>
                <div class="context-menu-item has-submenu" data-action="clean-up-by">Clean Up By</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="import">Import from iPhone or iPad</div>
                <div class="context-menu-separator"></div>
                <div class="context-menu-item" data-action="view-options">Show View Options</div>
            `;
            contextMenu.style.position = 'fixed';
            contextMenu.style.display = 'none';
            contextMenu.style.zIndex = '10000';
            document.body.appendChild(contextMenu);
        }

        desktop.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.window') || e.target.closest('.dock') ||
                e.target.closest('.menu-bar') || e.target.closest('#menu-bar')) return;

            e.preventDefault();
            contextMenu.style.display = 'block';

            let x = e.clientX, y = e.clientY;
            // Need to show first to get dimensions
            setTimeout(() => {
                const menuRect = contextMenu.getBoundingClientRect();
                if (x + menuRect.width > window.innerWidth) x = window.innerWidth - menuRect.width - 5;
                if (y + menuRect.height > window.innerHeight) y = window.innerHeight - menuRect.height - 5;
                contextMenu.style.left = x + 'px';
                contextMenu.style.top  = y + 'px';
            }, 0);
        });

        document.addEventListener('click', () => { contextMenu.style.display = 'none'; });

        contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                contextMenu.style.display = 'none';
            });
        });
    }

    // ==================================================================
    //  8. MENU BAR DROPDOWNS
    // ==================================================================
    function initMenuBar() {
        const menuBar = document.querySelector('.menu-bar') || document.getElementById('menu-bar');
        if (!menuBar) return;

        const menuData = {
            'Finder': [
                'About This Mac', 'separator',
                'System Settings...', 'App Store...', 'separator',
                'Recent Items', 'separator',
                'Force Quit...', 'separator',
                'Sleep', 'Restart...', 'Shut Down...', 'separator',
                'Lock Screen', 'Log Out lorenzo...'
            ],
            'File': [
                'New Finder Window', 'New Folder', 'New Smart Folder',
                'New Tab', 'Open', 'Open With', 'separator',
                'Close Window', 'separator',
                'Get Info', 'Rename', 'separator',
                'Compress', 'separator',
                'Duplicate', 'Make Alias', 'Quick Look',
                'separator', 'Move to Trash'
            ],
            'Edit': [
                'Undo', 'Redo', 'separator',
                'Cut', 'Copy', 'Paste', 'Select All', 'separator',
                'Show Clipboard', 'separator',
                'Start Dictation...', 'Emoji & Symbols'
            ],
            'View': [
                'as Icons', 'as List', 'as Columns', 'as Gallery', 'separator',
                'Use Stacks', 'separator',
                'Sort By', 'Clean Up', 'Clean Up By', 'separator',
                'Hide Sidebar', 'Hide Preview', 'separator',
                'Hide Toolbar', 'Hide Path Bar', 'Hide Status Bar'
            ],
            'Go': [
                'Back', 'Forward', 'Enclosing Folder', 'separator',
                'Recents', 'Documents', 'Desktop', 'Downloads',
                'Home', 'Computer', 'separator',
                'AirDrop', 'Network', 'iCloud Drive', 'separator',
                'Applications', 'Utilities', 'separator',
                'Recent Folders', 'separator',
                'Go to Folder...', 'Connect to Server...'
            ],
            'Window': [
                'Minimize', 'Zoom', 'separator',
                'Move Window to Left Side of Screen',
                'Move Window to Right Side of Screen',
                'separator', 'Bring All to Front'
            ],
            'Help': [
                'macOS Help', 'separator', 'Tips for Your Mac...'
            ]
        };

        const menuItems = menuBar.querySelectorAll('.menu-bar-item:not(.menu-bar-datetime):not(.menu-bar-username):not(.menu-bar-battery)');
        let currentDropdown = null;
        let menuIsOpen = false;

        menuItems.forEach(item => {
            const label = item.textContent.trim();

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (menuIsOpen && currentDropdown) {
                    closeDropdown();
                    if (item._isOpen) {
                        item._isOpen = false;
                        menuIsOpen = false;
                        return;
                    }
                }
                openDropdown(item, label);
            });

            item.addEventListener('mouseenter', () => {
                if (menuIsOpen && currentDropdown) {
                    closeDropdown();
                    openDropdown(item, label);
                }
            });
        });

        function openDropdown(item, label) {
            const items = menuData[label];
            if (!items) return;

            closeDropdown();

            const dropdown = document.createElement('div');
            dropdown.classList.add('menu-dropdown');
            dropdown.style.position = 'fixed';
            dropdown.style.zIndex = '9999';
            dropdown.style.minWidth = '220px';
            dropdown.style.display = 'block';

            items.forEach(entry => {
                if (entry === 'separator') {
                    const sep = document.createElement('div');
                    sep.classList.add('menu-dropdown-separator');
                    dropdown.appendChild(sep);
                } else {
                    const menuItem = document.createElement('div');
                    menuItem.classList.add('menu-dropdown-item');
                    menuItem.textContent = entry;
                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        closeDropdown();
                        menuIsOpen = false;
                    });
                    dropdown.appendChild(menuItem);
                }
            });

            const rect = item.getBoundingClientRect();
            dropdown.style.left = rect.left + 'px';
            dropdown.style.top  = rect.bottom + 'px';

            document.body.appendChild(dropdown);
            currentDropdown = dropdown;
            menuIsOpen = true;
            item._isOpen = true;
            item.classList.add('active');
            activeMenuDropdown = dropdown;
        }

        function closeDropdown() {
            if (currentDropdown) {
                currentDropdown.remove();
                currentDropdown = null;
            }
            activeMenuDropdown = null;
            menuItems.forEach(mi => {
                mi.classList.remove('active');
                mi._isOpen = false;
            });
        }

        document.addEventListener('click', () => {
            if (menuIsOpen) {
                closeDropdown();
                menuIsOpen = false;
            }
        });
    }

    // ==================================================================
    //  9. NOTIFICATION CENTER
    // ==================================================================
    function initNotificationCenter() {
        const dateTimeBtn = document.getElementById('menu-bar-datetime');
        if (!dateTimeBtn) return;

        let panel = document.getElementById('notification-center');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'notification-center';
            panel.classList.add('notification-center');
            panel.style.cssText = 'position:fixed;top:0;right:-380px;width:370px;height:100vh;z-index:9990;transition:right 0.3s ease;overflow-y:auto;';
            panel.innerHTML = buildNotificationCenterHTML();
            document.body.appendChild(panel);
        }

        dateTimeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotificationCenter();
        });

        document.addEventListener('click', (e) => {
            if (notificationCenterOpen && !panel.contains(e.target) && e.target !== dateTimeBtn) {
                hideNotificationCenter();
            }
        });

        function toggleNotificationCenter() {
            if (notificationCenterOpen) hideNotificationCenter();
            else showNotificationCenter();
        }

        function showNotificationCenter() {
            panel.innerHTML = buildNotificationCenterHTML();
            panel.style.right = '0';
            notificationCenterOpen = true;
        }

        function hideNotificationCenter() {
            panel.style.right = '-380px';
            notificationCenterOpen = false;
        }

        function buildNotificationCenterHTML() {
            const now = new Date();
            const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            const monthNames = ['January','February','March','April','May','June',
                                'July','August','September','October','November','December'];
            const dayName = dayNames[now.getDay()];
            const monthName = monthNames[now.getMonth()];
            const dateNum = now.getDate();
            const year = now.getFullYear();

            const firstDay = new Date(year, now.getMonth(), 1).getDay();
            const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate();
            let calendarRows = '';
            let dayCounter = 1;

            for (let row = 0; row < 6; row++) {
                let cells = '';
                for (let col = 0; col < 7; col++) {
                    if ((row === 0 && col < firstDay) || dayCounter > daysInMonth) {
                        cells += '<td></td>';
                    } else {
                        const isToday = dayCounter === dateNum ? ' class="today"' : '';
                        cells += `<td${isToday}>${dayCounter}</td>`;
                        dayCounter++;
                    }
                }
                calendarRows += `<tr>${cells}</tr>`;
                if (dayCounter > daysInMonth) break;
            }

            return `
                <div class="nc-header">
                    <h2>${dayName}, ${monthName} ${dateNum}</h2>
                </div>
                <div class="nc-calendar">
                    <div class="nc-calendar-title">${monthName} ${year}</div>
                    <table class="nc-calendar-table">
                        <thead><tr><th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th></tr></thead>
                        <tbody>${calendarRows}</tbody>
                    </table>
                </div>
                <div class="nc-weather">
                    <div class="nc-weather-title">Weather</div>
                    <div class="nc-weather-info">
                        <span class="nc-weather-temp">72&deg;F</span>
                        <span class="nc-weather-desc">Mostly Sunny</span>
                    </div>
                    <div class="nc-weather-location">Cupertino, CA</div>
                </div>
                <div class="nc-section">
                    <div class="nc-section-title">Notifications</div>
                    <div class="nc-empty">No New Notifications</div>
                </div>
            `;
        }
    }

    // ==================================================================
    //  10. DESKTOP WIDGETS
    // ==================================================================
    function initWidgets() {
        const hourHand = document.getElementById('clock-hand-hour');
        const minuteHand = document.getElementById('clock-hand-minute');
        const secondHand = document.getElementById('clock-hand-second');

        function updateClock() {
            const now = new Date();
            const h = now.getHours() % 12;
            const m = now.getMinutes();
            const s = now.getSeconds();
            const hourDeg = (h * 30) + (m * 0.5);
            const minDeg = m * 6;
            const secDeg = s * 6;
            if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
            if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
            if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;
        }

        if (hourHand) {
            updateClock();
            setInterval(updateClock, 1000);
        }

        const calMonth = document.getElementById('cal-month');
        const calGrid = document.getElementById('cal-grid');

        if (calMonth && calGrid) {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const today = now.getDate();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'];
            calMonth.textContent = monthNames[month];

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let html = '';
            let dayCount = 1;
            for (let row = 0; row < 6; row++) {
                if (dayCount > daysInMonth) break;
                html += '<div class="cal-row">';
                for (let col = 0; col < 7; col++) {
                    if (row === 0 && col < firstDay) {
                        html += '<span class="cal-day empty"></span>';
                    } else if (dayCount > daysInMonth) {
                        html += '<span class="cal-day empty"></span>';
                    } else {
                        const cls = dayCount === today ? 'cal-day today' : 'cal-day';
                        html += `<span class="${cls}">${dayCount}</span>`;
                        dayCount++;
                    }
                }
                html += '</div>';
            }
            calGrid.innerHTML = html;
        }
    }

    // ==================================================================
    //  11. CALENDAR DOCK ICON
    // ==================================================================
    function initCalendarDockIcon() {
        const dateEl = document.getElementById('dock-calendar-date');
        if (dateEl) dateEl.textContent = new Date().getDate();

        const dayEl = document.querySelector('.dock-calendar-day-name');
        if (dayEl) {
            const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
            dayEl.textContent = days[new Date().getDay()];
        }
    }

    // ==================================================================
    //  12. DESKTOP RUBBER-BAND SELECTION
    // ==================================================================
    function initDesktopSelection() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        // Create selection marquee element
        let marquee = document.querySelector('.selection-marquee');
        if (!marquee) {
            marquee = document.createElement('div');
            marquee.classList.add('selection-marquee');
            document.body.appendChild(marquee);
        }

        let isSelecting = false;
        let startX = 0, startY = 0;

        desktop.addEventListener('mousedown', (e) => {
            // Only start selection on empty desktop area (not on windows, dock, menu, widgets)
            if (e.target.closest('.window') || e.target.closest('.dock') ||
                e.target.closest('.menu-bar') || e.target.closest('#menu-bar') ||
                e.target.closest('.widget') || e.target.closest('.desktop-widgets') ||
                e.target.closest('#context-menu') || e.button !== 0) return;

            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;

            marquee.style.left = startX + 'px';
            marquee.style.top = startY + 'px';
            marquee.style.width = '0px';
            marquee.style.height = '0px';
            marquee.style.display = 'block';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isSelecting) return;

            const currentX = e.clientX;
            const currentY = e.clientY;

            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);

            marquee.style.left = left + 'px';
            marquee.style.top = top + 'px';
            marquee.style.width = width + 'px';
            marquee.style.height = height + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isSelecting) {
                isSelecting = false;
                marquee.style.display = 'none';
            }
        });
    }

    // ==================================================================
    //  13. SPOTLIGHT SEARCH
    // ==================================================================
    function initSpotlight() {
        const spotlightBtn = document.getElementById('spotlight-btn');

        // Create spotlight overlay
        let spotlight = document.getElementById('spotlight-overlay');
        if (!spotlight) {
            spotlight = document.createElement('div');
            spotlight.id = 'spotlight-overlay';
            spotlight.style.cssText = `
                position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9800;
                display:none;align-items:flex-start;justify-content:center;
                padding-top:180px;background:rgba(0,0,0,0.25);
            `;
            spotlight.innerHTML = `
                <div class="spotlight-box">
                    <div class="spotlight-input-wrap">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="2" stroke-linecap="round">
                            <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
                        </svg>
                        <input class="spotlight-input" type="text" placeholder="Spotlight Search" autofocus/>
                    </div>
                    <div class="spotlight-results"></div>
                </div>
            `;
            document.body.appendChild(spotlight);
        }

        const spotlightInput = spotlight.querySelector('.spotlight-input');
        const spotlightResults = spotlight.querySelector('.spotlight-results');

        // App registry for search
        const apps = [
            { name: 'Finder', app: 'finder', icon: '📁' },
            { name: 'Safari', app: 'safari', icon: '🧭' },
            { name: 'Messages', app: 'messages', icon: '💬' },
            { name: 'Notes', app: 'notes', icon: '📝' },
            { name: 'Calculator', app: 'calculator', icon: '🔢' },
            { name: 'Terminal', app: 'terminal', icon: '⬛' },
            { name: 'System Settings', app: 'settings', icon: '⚙️' },
        ];

        function showSpotlight() {
            spotlight.style.display = 'flex';
            spotlightInput.value = '';
            spotlightResults.innerHTML = '';
            setTimeout(() => spotlightInput.focus(), 50);
        }

        function hideSpotlight() {
            spotlight.style.display = 'none';
        }

        if (spotlightBtn) {
            spotlightBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (spotlight.style.display === 'flex') hideSpotlight();
                else showSpotlight();
            });
        }

        // Cmd+Space to toggle spotlight
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
                e.preventDefault();
                if (spotlight.style.display === 'flex') hideSpotlight();
                else showSpotlight();
            }
            if (e.key === 'Escape' && spotlight.style.display === 'flex') {
                hideSpotlight();
            }
        });

        // Close on click outside
        spotlight.addEventListener('click', (e) => {
            if (e.target === spotlight) hideSpotlight();
        });

        // Search as you type
        spotlightInput.addEventListener('input', () => {
            const query = spotlightInput.value.trim().toLowerCase();
            spotlightResults.innerHTML = '';

            if (!query) return;

            const matches = apps.filter(a => a.name.toLowerCase().includes(query));

            if (matches.length === 0) {
                spotlightResults.innerHTML = '<div style="padding:12px 16px;color:rgba(0,0,0,0.4);font-size:13px;">No results found</div>';
                return;
            }

            matches.forEach((app, i) => {
                const item = document.createElement('div');
                item.classList.add('spotlight-result-item');
                if (i === 0) item.classList.add('selected');
                item.innerHTML = `
                    <span class="spotlight-result-icon">${app.icon}</span>
                    <span class="spotlight-result-name">${app.name}</span>
                    <span class="spotlight-result-type">Application</span>
                `;
                item.addEventListener('click', () => {
                    hideSpotlight();
                    openApp(app.app);
                });
                spotlightResults.appendChild(item);
            });
        });

        // Enter to open first result
        spotlightInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const first = spotlightResults.querySelector('.spotlight-result-item');
                if (first) first.click();
            }
        });
    }
});
