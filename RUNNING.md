# How to Run AI Code Packer

Due to browser security restrictions with ES6 modules, this app needs to be served via HTTP rather than opened directly from the file system.

## Quick Start Options

### Option 1: Python HTTP Server (Easiest)

If you have Python installed:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: http://localhost:8000

### Option 2: Node.js HTTP Server

If you have Node.js installed:

```bash
# Install http-server globally (one time)
npm install -g http-server

# Run from project directory
http-server -p 8000
```

Then open: http://localhost:8000

### Option 3: VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 4: Browser Extensions

Firefox: Install "Live Server Web Extension"
Chrome: Install "Web Server for Chrome"

## Why is this needed?

The app uses modern JavaScript modules (ES6 imports/exports) for better code organization. Browsers block module loading from `file://` URLs due to CORS security policies. Running a local server provides the `http://` protocol needed for modules to work properly.
