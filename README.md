# AI-Friendly Code Packer

- Mirror 1: https://reactorcoregames.github.io/AI-Code-Packer/
- Mirror 2: https://reactorcore.itch.io/ai-code-packer

![codepacker_cover](https://github.com/user-attachments/assets/a3b73aac-97ce-42aa-a69d-71e48529eac4)

A powerful web application that helps developers package their codebase into AI-friendly formats for seamless interaction with AI assistants like Claude, ChatGPT, and others.

## 🎯 Purpose

Transform your entire project into a single, well-structured text output that AI models can easily understand and work with. Perfect for getting AI assistance on coding tasks, code reviews, debugging, and architectural discussions.

**Screenshots:**

<img width="1920" height="1080" alt="codepacker screenshot (1)" src="https://github.com/user-attachments/assets/6d059d45-dfa0-4d85-85db-3451a7d72282" />

---
<img width="1920" height="1080" alt="codepacker screenshot (2)" src="https://github.com/user-attachments/assets/04bd5148-86d8-4bd5-a596-fa74910eff39" />

---
<img width="1920" height="1080" alt="codepacker screenshot (3)" src="https://github.com/user-attachments/assets/b276bff5-b4bd-40e5-b2e0-50a172fc2e29" />

---
<img width="1920" height="1080" alt="codepacker screenshot (4)" src="https://github.com/user-attachments/assets/5cdd034a-a028-43c0-aba5-bec91e67f98c" />

## ✨ Key Features

### 📁 Smart File Management
- **Folder Upload**: Select entire project folders through your browser
- **Intelligent Auto-Exclusions**: Automatically filters out:
  - Build artifacts (node_modules, dist, build)
  - Version control (.git, .svn)
  - Environment files (.env)
  - Language-specific artifacts (Python `__pycache__`, Java `target/`, etc.)
- **Custom Patterns**: Add your own exclusion patterns with glob support (`*.log`, `test/**`, etc.)
- **Interactive Tree**: Visual folder structure with checkboxes to include/exclude files

### 🎨 Multiple Output Formats
Choose the format that works best for your AI assistant:
- **Plain Text**: Simple, readable format
- **XML**: Structured with CDATA sections
- **JSON**: Array of file objects
- **Markdown**: Collapsible sections with syntax highlighting
- **Tree**: Visual tree structure with metadata

### ⭐ File Prioritization
Mark important files with priority levels (1-5). High-priority files appear first in the output, ensuring critical code gets attention even with token limits.

### 🎛️ Quick Presets
One-click filtering profiles:
- **Code Only**: Just source code files (programming languages)
- **Code + Docs**: Source code + markdown/txt/rst files
- **Code + Config**: Source code + configuration files (JSON, YAML, TOML, etc.)
- **Docs Only**: Documentation files only
- **Code + Media List**: Code files + media file listing (no binary content)
- **Media List Only**: Media file listing only
- **Full Project**: Everything (except default exclusions)

### 📊 Real-Time Analytics
- **Token Counter**: Estimates AI context usage with color coding
  - 🟢 Green: < 8K tokens (ideal)
  - 🟡 Yellow: 8K-32K tokens
  - 🟠 Orange: 32K-100K tokens
  - 🔴 Red: > 100K tokens
- **File Statistics**: Total files, lines of code, project size

### ⚡ Performance Optimized
- **Virtual Scrolling**: Handles 500+ files smoothly
- **Debounced Updates**: Smooth UI during rapid changes
- **Web Worker**: Background processing for large projects

### 🎮 Power User Features
- **Recent Projects**: Quick access to previously loaded projects (up to 5 saved)
- **Preset Export/Import**: Save and share your custom exclusion pattern configurations as JSON files

## 🚀 Quick Start

1. **Open** `index.html` in your web browser
2. **Upload Tab**: Click "Choose Project Folder" to select your project
3. **Filter Tab**: Review auto-detected exclusions, apply presets, or customize patterns
4. **Export Tab**: Choose format, preview output, copy to clipboard or download

## 📁 Project Structure

```
Code Packer/
├── index.html              # Main application page with 4-tab layout
├── styles.css              # All styling and responsive design
├── main.js                 # Application entry point
├── fileManager.js          # File upload and processing (55 lines)
├── exclusionManager.js     # Filtering and tree logic (405 lines)
├── outputFormatter.js      # Format generation (460 lines)
├── uiController.js         # UI event handling (308 lines)
├── utils.js                # Shared utilities (205 lines)
├── performance.js          # Performance optimizations (167 lines)
├── uxEnhancements.js       # Recent projects, preset sharing (242 lines)
├── fileWorker.js           # Web Worker for background tasks (109 lines)
└── Documentation files...
```

## 🔧 Technical Details

### Browser Compatibility
- **Chrome/Edge**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support ✅

### Requirements
- Modern web browser with ES6 module support
- No server-side processing required
- Works entirely client-side (your code never leaves your computer)

### File Type Support
Automatically detects 50+ file types including:
- **Languages**: JS, TS, Python, Java, C/C++, C#, Go, Rust, Ruby, PHP, Swift, Kotlin
- **Web**: HTML, CSS, SCSS, Vue, React, Svelte
- **Config**: JSON, YAML, TOML, INI
- **Docs**: Markdown, TXT, RST
- **And many more...**

## 🎓 Use Cases

1. **Code Review**: Share your entire codebase with AI for comprehensive review
2. **Debugging**: Provide full context for better debugging assistance
3. **Documentation**: Generate documentation with AI that understands your full project
4. **Refactoring**: Get architectural advice based on your complete codebase
5. **Learning**: Ask AI to explain how your project works
6. **Migration**: Get help migrating between frameworks/languages

## 🔒 Privacy & Security

- **100% Client-Side**: All processing happens in your browser
- **No Server Uploads**: Your code never leaves your computer
- **No Tracking**: No analytics or data collection
- **Open Source**: All code is visible and auditable

## 📄 Author & License

Created by [Reactorcore Games](https://linktr.ee/reactorcore)
- MIT License
