/**
 * macOS Sequoia Web Clone - Application JavaScript
 * Handles all interactivity: lock screen, dock, windows, apps, menus, etc.
 * Pure vanilla JS - no frameworks.
 */

document.addEventListener('components-loaded', () => {
    // ─── Global State ────────────────────────────────────────────────
    let zIndexCounter = 100;       // Tracks the highest z-index for window stacking
    let activeMenuDropdown = null; // Currently open menu-bar dropdown
    let notificationCenterOpen = false;

    // ─── Initialize All Modules ──────────────────────────────────────
    initLockScreen();
    initMenuBarClock();
    initDock();
    initWindows();
    initCalculator();
    initTerminal();
    initContextMenu();
    initMenuBar();
    initNotificationCenter();
    initDesktopIcons();
    initCalendarDockIcon();

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

        // Update lock-screen clock every second
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

        // Unlock on Enter key in password field (any input accepted)
        if (passwordInput) {
            passwordInput.focus();
            passwordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    unlockDesktop();
                }
            });
        }

        // Also unlock if user clicks the lock screen submit / arrow button
        const unlockBtn = lockScreen.querySelector('.lock-submit');
        if (unlockBtn) {
            unlockBtn.addEventListener('click', unlockDesktop);
        }

        function unlockDesktop() {
            clearInterval(lockClockInterval);
            const desktop = document.getElementById('desktop');
            if (desktop) desktop.classList.remove('hidden');
            lockScreen.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            lockScreen.style.opacity = '0';
            lockScreen.style.transform = 'scale(1.05)';
            setTimeout(() => {
                lockScreen.style.display = 'none';
            }, 600);
        }
    }

    // ==================================================================
    //  2. MENU BAR CLOCK
    // ==================================================================
    function initMenuBarClock() {
        const menuBarClock = document.querySelector('.menu-bar-clock') ||
                             document.querySelector('.menu-bar .clock') ||
                             document.querySelector('.menu-bar-right .datetime');
        if (!menuBarClock) return;

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
            menuBarClock.textContent = `${dayName} ${monthName} ${date}  ${hours}:${minutes} ${ampm}`;
        }

        updateMenuClock();
        setInterval(updateMenuClock, 1000); // Check every second for accuracy on the minute flip
    }

    // ==================================================================
    //  3. DOCK INTERACTIONS
    // ==================================================================
    function initDock() {
        const dock = document.querySelector('.dock');
        if (!dock) return;

        const dockIcons = dock.querySelectorAll('.dock-item');

        // --- Click to open app ---
        dockIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const appName = icon.getAttribute('data-app');
                if (!appName) return;
                openApp(appName);
            });
        });

        // --- Dock magnification on mousemove ---
        dock.addEventListener('mousemove', (e) => {
            dockIcons.forEach(icon => {
                const rect = icon.getBoundingClientRect();
                const iconCenterX = rect.left + rect.width / 2;
                const distance = Math.abs(e.clientX - iconCenterX);
                const maxDistance = 120; // pixels beyond which no scaling occurs
                const maxScale = 1.5;
                const minScale = 1.0;

                if (distance < maxDistance) {
                    // Scale proportionally: closer = bigger
                    const scale = maxScale - ((maxScale - minScale) * (distance / maxDistance));
                    icon.style.transform = `scale(${scale})`;
                    icon.style.transformOrigin = 'bottom center';
                    icon.style.transition = 'transform 0.1s ease';
                } else {
                    icon.style.transform = 'scale(1)';
                    icon.style.transition = 'transform 0.2s ease';
                }
            });
        });

        dock.addEventListener('mouseleave', () => {
            dockIcons.forEach(icon => {
                icon.style.transform = 'scale(1)';
                icon.style.transition = 'transform 0.3s ease';
            });
        });
    }

    /**
     * Open an application window by name and mark its dock icon active.
     */
    function openApp(appName) {
        const win = document.querySelector(`.window[data-app="${appName}"]`);
        if (!win) return;

        win.classList.add('active');
        bringToFront(win);

        // Mark dock icon active
        const dockIcon = document.querySelector(`.dock-item[data-app="${appName}"]`);
        if (dockIcon) dockIcon.classList.add('active');

        // Remove minimised styling if present
        win.style.transform = '';
        win.style.opacity = '';

        // If terminal is being opened, focus its input
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
        win.classList.remove('active');
        win.classList.remove('maximized');
        const appName = win.getAttribute('data-app');
        const dockIcon = document.querySelector(`.dock-item[data-app="${appName}"]`);
        if (dockIcon) dockIcon.classList.remove('active');
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
            // --- Focus on click ---
            win.addEventListener('mousedown', () => bringToFront(win));

            // --- Traffic-light buttons ---
            const closeBtn   = win.querySelector('.traffic-light .close, .btn-close');
            const minimizeBtn = win.querySelector('.traffic-light .minimize, .btn-minimize');
            const maximizeBtn = win.querySelector('.traffic-light .maximize, .btn-maximize');

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    closeApp(win);
                });
            }

            if (minimizeBtn) {
                minimizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    win.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
                    win.style.transform = 'scale(0.1)';
                    win.style.opacity = '0';
                    setTimeout(() => {
                        win.classList.remove('active');
                        win.style.transition = '';
                        win.style.transform = '';
                        win.style.opacity = '';
                    }, 400);
                });
            }

            if (maximizeBtn) {
                maximizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleMaximize(win);
                });
            }

            // --- Dragging via titlebar ---
            const titlebar = win.querySelector('.window-titlebar');
            if (titlebar) {
                initDrag(win, titlebar);
            }

            // --- Resize handle ---
            const resizeHandle = win.querySelector('.resize-handle');
            if (resizeHandle) {
                initResize(win, resizeHandle);
            }
        });
    }

    /**
     * Toggle maximize/restore for a window.
     * Stores original rect before maximizing so it can be restored.
     */
    function toggleMaximize(win) {
        if (win.classList.contains('maximized')) {
            // Restore original position/size
            win.style.top    = win.dataset.origTop;
            win.style.left   = win.dataset.origLeft;
            win.style.width  = win.dataset.origWidth;
            win.style.height = win.dataset.origHeight;
            win.classList.remove('maximized');
        } else {
            // Store current position/size
            win.dataset.origTop    = win.style.top    || win.offsetTop + 'px';
            win.dataset.origLeft   = win.style.left   || win.offsetLeft + 'px';
            win.dataset.origWidth  = win.style.width  || win.offsetWidth + 'px';
            win.dataset.origHeight = win.style.height || win.offsetHeight + 'px';

            // Maximise (fill screen below menu bar)
            const menuBar = document.querySelector('.menu-bar');
            const topOffset = menuBar ? menuBar.offsetHeight : 0;
            win.style.top    = topOffset + 'px';
            win.style.left   = '0px';
            win.style.width  = '100vw';
            win.style.height = `calc(100vh - ${topOffset}px)`;
            win.classList.add('maximized');
        }
    }

    /**
     * Make a window draggable by its titlebar.
     */
    function initDrag(win, handle) {
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        handle.addEventListener('mousedown', (e) => {
            // Ignore clicks on traffic-light buttons
            if (e.target.closest('.traffic-light') || e.target.closest('.btn-close') ||
                e.target.closest('.btn-minimize') || e.target.closest('.btn-maximize')) return;

            isDragging = true;
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
            handle.style.cursor = 'grabbing';
            bringToFront(win);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            // Un-maximise if dragging while maximized
            if (win.classList.contains('maximized')) {
                win.classList.remove('maximized');
                win.style.width  = win.dataset.origWidth  || '600px';
                win.style.height = win.dataset.origHeight || '400px';
                // Re-center offset so window follows cursor naturally
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

    /**
     * Make a window resizable from the bottom-right corner handle.
     */
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

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    // ==================================================================
    //  5. CALCULATOR APP
    // ==================================================================
    function initCalculator() {
        const calcWindow = document.querySelector('.window[data-app="calculator"]');
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

        // Also allow keyboard input when calculator is focused
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
            // Digits
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

            // Decimal
            if (value === '.') {
                if (waitingForSecondOperand) {
                    currentInput = '0.';
                    waitingForSecondOperand = false;
                    updateDisplay();
                    return;
                }
                if (!currentInput.includes('.')) {
                    currentInput += '.';
                }
                updateDisplay();
                return;
            }

            // AC / Clear
            if (value === 'AC' || value === 'C') {
                currentInput = '0';
                firstOperand = null;
                operator = null;
                waitingForSecondOperand = false;
                updateDisplay();
                return;
            }

            // +/- toggle
            if (value === '+/-' || value === '\u00B1') {
                if (currentInput !== '0') {
                    currentInput = currentInput.startsWith('-')
                        ? currentInput.slice(1)
                        : '-' + currentInput;
                }
                updateDisplay();
                return;
            }

            // Percentage
            if (value === '%') {
                currentInput = String(parseFloat(currentInput) / 100);
                updateDisplay();
                return;
            }

            // Operators: +, -, ×, ÷
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

            // Equals
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
        const termWindow = document.querySelector('.window[data-app="terminal"]');
        if (!termWindow) return;

        const termBody = termWindow.querySelector('.terminal-body') ||
                         termWindow.querySelector('.terminal-content');
        if (!termBody) return;

        const PROMPT = 'lorenzo@MacBook-Pro ~ % ';

        // Render initial welcome message
        appendOutput('Last login: ' + new Date().toString().split(' ').slice(0, 5).join(' ') + ' on ttys000');
        createPromptLine();

        // Focus terminal on click anywhere in body
        termBody.addEventListener('click', () => {
            const input = termBody.querySelector('.terminal-input:last-of-type');
            if (input) input.focus();
        });

        function appendOutput(text) {
            const line = document.createElement('div');
            line.classList.add('terminal-line');
            // Preserve whitespace for things like neofetch
            line.style.whiteSpace = 'pre-wrap';
            line.style.fontFamily = 'inherit';
            line.textContent = text;
            termBody.appendChild(line);
        }

        function appendHTML(html) {
            const line = document.createElement('div');
            line.classList.add('terminal-line');
            line.style.whiteSpace = 'pre';
            line.style.fontFamily = 'inherit';
            line.innerHTML = html;
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

            // Minimal inline styles so it blends with terminal even without CSS
            input.style.background = 'transparent';
            input.style.border = 'none';
            input.style.outline = 'none';
            input.style.color = 'inherit';
            input.style.font = 'inherit';
            input.style.flex = '1';
            input.style.caretColor = 'white';

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const cmd = input.value.trim();
                    // Freeze this line (make it non-editable)
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
            if (cmd === '') {
                createPromptLine();
                return;
            }

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
                    return; // Don't create a second prompt

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
                    const neofetchArt = [
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
                    neofetchArt.forEach(line => appendOutput(line));
                    break;

                case 'date':
                    appendOutput(new Date().toString());
                    break;

                default:
                    // Handle echo
                    if (cmd.toLowerCase().startsWith('echo ')) {
                        appendOutput(cmd.slice(5));
                    } else {
                        appendOutput(`zsh: command not found: ${cmd}`);
                    }
                    break;
            }

            createPromptLine();
        }

        function scrollTerminal() {
            termBody.scrollTop = termBody.scrollHeight;
        }

        // Keep scrolling to bottom whenever content changes
        const observer = new MutationObserver(scrollTerminal);
        observer.observe(termBody, { childList: true, subtree: true });
    }

    // ==================================================================
    //  7. CONTEXT MENU (Right-Click on Desktop)
    // ==================================================================
    function initContextMenu() {
        const desktop = document.querySelector('.desktop') || document.getElementById('desktop');
        if (!desktop) return;

        // Create context menu element if it doesn't exist in the HTML
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
            // Don't show context menu if right-click was on a window, dock, or menu bar
            if (e.target.closest('.window') || e.target.closest('.dock') ||
                e.target.closest('.menu-bar')) {
                return;
            }

            e.preventDefault();
            contextMenu.style.display = 'block';

            // Position at mouse, but keep within viewport
            let x = e.clientX;
            let y = e.clientY;
            const menuRect = contextMenu.getBoundingClientRect();
            if (x + menuRect.width > window.innerWidth) {
                x = window.innerWidth - menuRect.width - 5;
            }
            if (y + menuRect.height > window.innerHeight) {
                y = window.innerHeight - menuRect.height - 5;
            }
            contextMenu.style.left = x + 'px';
            contextMenu.style.top  = y + 'px';
        });

        // Close context menu on any click
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Clicking a menu item just closes (no real action)
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
        const menuBar = document.querySelector('.menu-bar');
        if (!menuBar) return;

        // Define dropdown contents for each menu
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

        const menuItems = menuBar.querySelectorAll('.menu-bar-item, .menu-item');
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

            // Hover-switch behaviour: when one menu is open, hovering another opens that one
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

            // Remove any previous dropdown
            closeDropdown();

            const dropdown = document.createElement('div');
            dropdown.classList.add('menu-dropdown');
            dropdown.style.position = 'fixed';
            dropdown.style.zIndex = '9999';
            dropdown.style.minWidth = '220px';

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

            // Position below the menu-bar item
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
            // Remove active class from all menu items
            menuItems.forEach(mi => {
                mi.classList.remove('active');
                mi._isOpen = false;
            });
        }

        // Close menu dropdown when clicking elsewhere
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
        const clockBtn = document.querySelector('.menu-bar-clock') ||
                         document.querySelector('.menu-bar .clock') ||
                         document.querySelector('.menu-bar-right .datetime');
        if (!clockBtn) return;

        // Create notification center panel if it doesn't exist
        let panel = document.getElementById('notification-center');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'notification-center';
            panel.classList.add('notification-center');
            panel.style.position = 'fixed';
            panel.style.top = '0';
            panel.style.right = '-380px'; // start off-screen
            panel.style.width = '370px';
            panel.style.height = '100vh';
            panel.style.zIndex = '9990';
            panel.style.transition = 'right 0.3s ease';
            panel.style.overflowY = 'auto';

            panel.innerHTML = buildNotificationCenterHTML();
            document.body.appendChild(panel);
        }

        clockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotificationCenter();
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (notificationCenterOpen && !panel.contains(e.target) && e.target !== clockBtn) {
                hideNotificationCenter();
            }
        });

        function toggleNotificationCenter() {
            if (notificationCenterOpen) {
                hideNotificationCenter();
            } else {
                showNotificationCenter();
            }
        }

        function showNotificationCenter() {
            // Refresh the content with current date
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

            // Build a simple calendar grid for the current month
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
                        <thead>
                            <tr>
                                <th>Su</th><th>Mo</th><th>Tu</th><th>We</th><th>Th</th><th>Fr</th><th>Sa</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${calendarRows}
                        </tbody>
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
    //  10. DESKTOP ICONS
    // ==================================================================
    function initDesktopIcons() {
        const desktopIcons = document.querySelectorAll('.desktop-icon');

        desktopIcons.forEach(icon => {
            icon.addEventListener('dblclick', () => {
                // Open finder (or whatever app the icon represents)
                const appName = icon.getAttribute('data-app') || 'finder';
                openApp(appName);
            });
        });
    }

    // ==================================================================
    //  12. CALENDAR DOCK ICON - Show today's date number
    // ==================================================================
    function initCalendarDockIcon() {
        const calendarIcon = document.querySelector('.dock-item[data-app="calendar"]');
        if (!calendarIcon) return;

        const today = new Date().getDate();
        // Try to find a child element meant for the date number
        let dateEl = calendarIcon.querySelector('.calendar-date');
        if (!dateEl) {
            // Create one and overlay it on the icon
            dateEl = document.createElement('span');
            dateEl.classList.add('calendar-date');
            dateEl.style.position = 'absolute';
            dateEl.style.bottom = '4px';
            dateEl.style.left = '50%';
            dateEl.style.transform = 'translateX(-50%)';
            dateEl.style.fontWeight = 'bold';
            dateEl.style.fontSize = '18px';
            dateEl.style.lineHeight = '1';
            dateEl.style.color = '#333';
            dateEl.style.pointerEvents = 'none';
            // Ensure parent is positioned
            calendarIcon.style.position = 'relative';
            calendarIcon.appendChild(dateEl);
        }
        dateEl.textContent = today;
    }
});
