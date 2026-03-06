<div align="center">

# macOS Sequoia Web

A faithful recreation of **macOS Sequoia** running entirely in your browser.
Pure HTML, CSS & JavaScript. No frameworks. No dependencies.

**[Try the Live Demo](https://senzo13.github.io/macos-sequoia-web/)**

<img src="https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white" alt="HTML5"/>
<img src="https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white" alt="CSS3"/>
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript"/>
<img src="https://img.shields.io/badge/No_Dependencies-green?style=flat" alt="No Dependencies"/>

</div>

---

## Features

| Feature | Description |
|---------|-------------|
| **Lock Screen** | Blurred wallpaper, clock, password input — just press Enter to unlock |
| **Menu Bar** | Fully interactive dark translucent bar with Apple logo, Finder menus, clock, battery, Wi-Fi |
| **Dock** | Glassmorphism dock with smooth magnification on hover and bounce animation on click |
| **Window Management** | Drag, resize, minimize, maximize, close — with smooth animations |
| **Finder** | Sidebar with favorites, folder grid view |
| **Safari** | URL bar, GitHub profile page mockup |
| **Terminal** | Working terminal with commands: `ls`, `whoami`, `pwd`, `neofetch`, `clear`, `echo`, `date` |
| **Calculator** | Fully functional calculator with keyboard support |
| **Notes** | Notes app with sidebar and lined paper editor |
| **Messages** | iMessage-style conversation view |
| **System Settings** | Settings panel with sidebar navigation and toggles |
| **Spotlight Search** | Press `Ctrl+Space` or click the magnifier — search and launch apps |
| **Desktop Selection** | Rubber-band selection on desktop, just like real macOS |
| **Context Menu** | Right-click on desktop for macOS-style context menu |
| **Widgets** | Weather widget, analog clock, and calendar on the desktop |
| **Notification Center** | Click the date/time to open the notification panel |

## Tech Stack

- **Zero dependencies** — no React, no Vue, no Tailwind, no build step
- **Component architecture** — HTML fragments loaded asynchronously via `fetch()`
- **CSS glassmorphism** — `backdrop-filter: blur()` + `saturate()` for that macOS translucent look
- **SVG icons** — All dock icons are hand-crafted SVGs with gradients
- **Responsive** — Adapts to smaller screens

## Project Structure

```
macos-sequoia-web/
  index.html              # Entry point
  css/style.css           # All styles (~2100 lines)
  js/
    loader.js             # Async component loader
    app.js                # All application logic
  components/
    lockscreen.html       # Lock screen
    menubar.html          # Top menu bar
    dock.html             # Dock with app icons
    desktop-icons.html    # Desktop widgets
    windows/
      finder.html         # Finder window
      safari.html         # Safari window
      terminal.html       # Terminal window
      calculator.html     # Calculator window
      notes.html          # Notes window
      settings.html       # System Settings window
      messages.html       # Messages window
  assets/
    wallpaper.jpg         # macOS Sequoia wallpaper
```

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Senzo13/macos-sequoia-web.git

# Open in browser (no build step needed)
open index.html

# Or use any local server
npx serve .
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Space` | Toggle Spotlight Search |
| `Enter` (lock screen) | Unlock desktop |
| Calculator focused | Use number keys, +, -, *, /, Enter, Escape |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

MIT License - feel free to use this project however you want.

---

<div align="center">

**If you like this project, consider giving it a star!**

</div>
