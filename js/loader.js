(async function loadComponents() {
    const components = [
        { selector: '#component-lockscreen', file: 'components/lockscreen.html' },
        { selector: '#component-menubar', file: 'components/menubar.html' },
        { selector: '#component-desktop-icons', file: 'components/desktop-icons.html' },
        { selector: '#component-dock', file: 'components/dock.html' },
        { selector: '#component-context-menu', file: 'components/context-menu.html' },
        { selector: '#component-notification-center', file: 'components/notification-center.html' },
        { selector: '#component-apple-menu', file: 'components/apple-menu.html' },
    ];

    const windowFiles = [
        'components/windows/finder.html',
        'components/windows/calculator.html',
        'components/windows/terminal.html',
        'components/windows/safari.html',
        'components/windows/notes.html',
        'components/windows/settings.html',
        'components/windows/messages.html',
    ];

    // Load main components
    await Promise.all(components.map(async ({ selector, file }) => {
        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error(`${file}: ${res.status}`);
            const html = await res.text();
            const el = document.querySelector(selector);
            if (el) el.innerHTML = html;
        } catch (e) {
            console.warn('Failed to load component:', e.message);
        }
    }));

    // Load windows
    const windowContainer = document.querySelector('#component-windows');
    if (windowContainer) {
        const windowHtmls = await Promise.all(windowFiles.map(async (file) => {
            try {
                const res = await fetch(file);
                if (!res.ok) throw new Error(`${file}: ${res.status}`);
                return await res.text();
            } catch (e) {
                console.warn('Failed to load window:', e.message);
                return '';
            }
        }));
        windowContainer.innerHTML = windowHtmls.join('\n');
    }

    // Signal that all components are loaded
    document.dispatchEvent(new Event('components-loaded'));
})();
