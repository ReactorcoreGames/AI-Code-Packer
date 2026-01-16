# Code Packer

## Premise

A web application that helps developers package and prepare their codebase for sharing with AI assistants like Claude.

## Goal

Enable developers to efficiently select, organize, and format their project files into a single consolidated output that can be easily copied and pasted into AI chat interfaces. This streamlines the process of getting AI assistance with coding tasks by removing the friction of manually gathering and formatting relevant code files.

## Core Purpose

- Simplify code sharing with AI assistants
- Reduce manual effort in preparing code context
- Make it easier to get AI help on development tasks

## Current Features

### Tab-Based Navigation (4 Tabs)
1. **Upload Tab**: Project folder selection and recent projects access
2. **Filter Tab**: Presets, custom patterns, file tree, and statistics
3. **Export Tab**: Format selection, preview, copy/download actions
4. **Help Tab**: Complete usage guide and pattern documentation

### File Management
- **Folder Upload**: Select entire project folders through browser file picker (webkitdirectory API)
- **Smart File Detection**: Automatically identifies 50+ text-based file types (JavaScript, TypeScript, Python, Java, Go, HTML, CSS, Markdown, config files, and more)
- **Auto-Exclusions**: Intelligent filtering of common build artifacts, dependencies, and environment files (node_modules, .git, dist, build, .env, lock files, __pycache__, target/, etc.)
- **Interactive Exclusion Tree**: Visual folder structure with checkboxes to selectively include or exclude specific files and folders
- **Virtual Scrolling**: Efficient rendering of large file trees (500+ files)

### Filtering System
- **Quick Presets**: 7 one-click profiles (Code Only, Code+Docs, Code+Config, Docs Only, Code+Media List, Media List Only, Full Project)
- **Custom Patterns**: Glob pattern support for advanced exclusions (wildcards, recursive matching)
- **Pattern Management**: Export/import custom pattern configurations as JSON presets
- **gitignore Support**: Automatic detection and parsing of .gitignore files
- **Media File Handling**: Lists media files without including binary content

### Output Formats
Five different export formats:
- **Plain Text**: Simple, readable format (default, works everywhere)
- **XML**: Structured with CDATA sections for code content
- **JSON**: Machine-readable array of file objects
- **Markdown**: Collapsible sections with syntax highlighting
- **Tree**: Visual folder structure with file metadata (no content)

### Export & Preview
- **Real-time Preview**: Live display of packed code in selected format
- **Copy to Clipboard**: One-click copying for immediate pasting into AI chats
- **Download**: Export with format-specific filename and timestamp
- **Format Persistence**: Remembers last selected format via localStorage

### Analytics & Metrics
- **Token Counter**: Real-time estimation of AI context usage with color-coded warnings
  - Green: Under 8K tokens (ideal)
  - Yellow: 8K-32K tokens
  - Orange: 32K-100K tokens
  - Red: Over 100K tokens (context limit warning)
- **File Statistics**: Total file count, lines of code, and project size
- **Dynamic Updates**: Metrics recalculate instantly as files are included or excluded

### UX Enhancements
- **Recent Projects**: Quick access to last 5 loaded projects (saved in localStorage)
- **Preset Management**: Export/import custom exclusion pattern configurations
- **Status Feedback**: Real-time processing messages and success indicators
- **Responsive Design**: Works on desktop and mobile devices
- **Tooltips**: Contextual help throughout the interface

## Style & Design

### Visual Identity
- **Color Scheme**: Clean, professional palette with muted teal/green primary colors
  - Primary: Teal green (#2c614f)
  - Background: Light mint gray (#f0f5f3)
  - Accents: Forest green header with white cards
- **Typography**: System fonts (Segoe UI, San Francisco, native) for fast loading and platform consistency
- **Layout**: Centered content with 1000px max width for optimal readability

### Interaction Design
- **Smooth Animations**: Subtle hover effects, modal transitions, and button lift animations
- **Visual Hierarchy**: Clear sections with card-based layout and consistent spacing
- **Intuitive Controls**: Familiar UI patterns (checkboxes, buttons, textareas)
- **Status Indicators**: Color-coded feedback for success, processing, and error states

### Accessibility
- **Responsive Breakpoints**: Mobile-optimized layouts at 768px and below
- **Readable Typography**: 1.6 line-height and comfortable font sizing
- **Clear Contrast**: Dark text on light backgrounds with WCAG-compliant color choices

---

## Technical Architecture

### Modular JavaScript Structure (1,969 total lines)
- **main.js** (18 lines): Application entry point, initializes all modules
- **fileManager.js** (55 lines): File upload handling and project file storage
- **exclusionManager.js** (405 lines): Pattern matching, tree rendering, preset application
- **outputFormatter.js** (460 lines): Code packing, format generation, token estimation
- **uiController.js** (308 lines): Event handlers, tab switching, status updates
- **utils.js** (205 lines): Shared utilities (file type detection, token estimation, wildcard matching)
- **performance.js** (167 lines): Virtual scrolling, debouncing, lazy loading
- **uxEnhancements.js** (242 lines): Recent projects, preset export/import
- **fileWorker.js** (109 lines): Web Worker for background processing

### Key Design Patterns
- **ES6 Modules**: Import/export for clean dependency management
- **Separation of Concerns**: UI, data, formatting, and utilities in separate modules
- **State Management**: Centralized state in respective modules with exports
- **LocalStorage Persistence**: Format preferences, file priorities, recent projects, pattern presets
- **Performance Optimization**: Virtual scrolling for large trees, debouncing for updates, Web Workers for heavy processing

---

## Development Guidelines

### Code Organization
- Files are well-modularized with clear responsibilities
- Largest modules (exclusionManager, outputFormatter) handle complex logic
- Maintain separation between UI (uiController) and business logic
- Keep utility functions centralized in utils.js
