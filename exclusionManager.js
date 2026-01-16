// Exclusion management - pattern matching, smart filters, tree rendering

import { defaultExclusions, matchesWildcard, parseGitignore } from './utils.js';
import { packCode, getFilePriority, setFilePriority } from './outputFormatter.js';
import { LazyLoader, VirtualScroller } from './performance.js';

// Global state
export let excludedPaths = new Set();
export let folderTree = {};
export let gitignorePatterns = [];
export let customPatterns = [];
let virtualScroller = null;
const lazyLoader = new LazyLoader(500); // Threshold for lazy loading

// Reset exclusions
export function resetExclusions() {
	excludedPaths.clear();
	gitignorePatterns = [];
	customPatterns = [];
}

// Function to check if a path should be excluded
export function shouldExclude(filePath) {
	// Check if the exact path is excluded
	if (excludedPaths.has(filePath)) return true;

	// Check if any parent folder is excluded
	const pathParts = filePath.split('/');
	for (let i = 0; i < pathParts.length; i++) {
		const partialPath = pathParts.slice(0, i + 1).join('/');
		if (excludedPaths.has(partialPath)) return true;
	}

	return false;
}

// Function to check if path matches default exclusions
export function matchesDefaultExclusion(filePath) {
	const fileName = filePath.split('/').pop();
	const pathParts = filePath.split('/');

	return defaultExclusions.some(exclusion => {
		// Check if any part of the path matches the exclusion
		if (pathParts.includes(exclusion)) return true;

		// Check if filename matches the exclusion
		if (fileName === exclusion) return true;

		// Check wildcard patterns (*.pyc, *.dll, etc.)
		if (exclusion.includes('*')) {
			return matchesWildcard(fileName, exclusion);
		}

		return false;
	});
}

// Function to check if path matches any pattern (gitignore or custom)
export function matchesPattern(filePath, patterns) {
	if (!patterns || patterns.length === 0) return false;

	const fileName = filePath.split('/').pop();
	const pathParts = filePath.split('/');

	return patterns.some(pattern => {
		// Check if any part of the path matches
		if (pathParts.includes(pattern)) return true;

		// Check if filename matches
		if (fileName === pattern) return true;

		// Check wildcard patterns
		if (pattern.includes('*')) {
			return matchesWildcard(fileName, pattern);
		}

		return false;
	});
}

// Function to load and parse .gitignore file
export async function loadGitignore(projectFiles) {
	const gitignoreFile = projectFiles.find(file =>
		file.webkitRelativePath.split('/').pop() === '.gitignore'
	);

	if (gitignoreFile) {
		try {
			const content = await gitignoreFile.text();
			gitignorePatterns = parseGitignore(content);
			console.log('Loaded .gitignore patterns:', gitignorePatterns);
		} catch (error) {
			console.error('Error parsing .gitignore:', error);
		}
	}
}

// Function to set custom exclusion patterns
export function setCustomPatterns(patterns) {
	customPatterns = patterns
		.split(/[,\n]/)
		.map(p => p.trim())
		.filter(p => p.length > 0);
}

// Function to apply preset filter profiles
export async function applyPreset(presetType, projectFiles) {
	// Define file extension presets
	const presets = {
		'code-only': {
			include: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
					  'cs', 'php', 'rb', 'swift', 'kt', 'go', 'rs', 'sql', 'html', 'css',
					  'scss', 'sass', 'less', 'vue', 'svelte', 'astro'],
			name: 'Code Only'
		},
		'code-docs': {
			include: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
					  'cs', 'php', 'rb', 'swift', 'kt', 'go', 'rs', 'sql', 'html', 'css',
					  'scss', 'sass', 'less', 'vue', 'svelte', 'astro',
					  'md', 'markdown', 'txt', 'rst', 'adoc'],
			name: 'Code + Documentation'
		},
		'code-config': {
			include: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
					  'cs', 'php', 'rb', 'swift', 'kt', 'go', 'rs', 'sql', 'html', 'css',
					  'scss', 'sass', 'less', 'vue', 'svelte', 'astro',
					  'json', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env'],
			name: 'Code + Config'
		},
		'docs-only': {
			include: ['md', 'markdown', 'txt', 'rst', 'adoc', 'textile', 'wiki', 'pdf', 'doc', 'docx'],
			name: 'Documentation Only'
		},
		'code-media-list': {
			include: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
					  'cs', 'php', 'rb', 'swift', 'kt', 'go', 'rs', 'sql', 'html', 'css',
					  'scss', 'sass', 'less', 'vue', 'svelte', 'astro',
					  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp',
					  'mp4', 'webm', 'avi', 'mov', 'mp3', 'wav', 'ogg', 'flac'],
			name: 'Code + Media Listing'
		},
		'media-list-only': {
			include: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp',
					  'mp4', 'webm', 'avi', 'mov', 'mp3', 'wav', 'ogg', 'flac',
					  'pdf', 'zip', 'rar', '7z', 'tar', 'gz'],
			name: 'Media Listing Only'
		},
		'full': {
			include: 'all',
			name: 'Full Project'
		}
	};

	const preset = presets[presetType];
	if (!preset) return;

	// Clear exclusions except defaults
	excludedPaths.clear();

	// Re-apply exclusions based on preset
	projectFiles.forEach(file => {
		const path = file.webkitRelativePath;
		const extension = file.name.split('.').pop().toLowerCase();

		// Always apply default exclusions
		if (matchesDefaultExclusion(path) ||
			matchesPattern(path, gitignorePatterns) ||
			matchesPattern(path, customPatterns)) {
			excludedPaths.add(path);
			return;
		}

		// Apply preset-specific filtering
		if (preset.include !== 'all') {
			// Exclude if extension not in preset's include list
			if (!preset.include.includes(extension)) {
				excludedPaths.add(path);
			}
		}
		// If preset.include === 'all', don't exclude anything (except defaults)
	});

	// Re-render tree and repack
	renderFolderTree();
	const { packCode } = await import('./outputFormatter.js');
	await packCode(projectFiles);
}

// Function to build folder tree structure
export function buildFolderTree(projectFiles) {
	folderTree = {};

	projectFiles.forEach(file => {
		const path = file.webkitRelativePath;
		const parts = path.split('/');
		let current = folderTree;

		parts.forEach((part, index) => {
			if (!current[part]) {
				current[part] = {
					isFile: index === parts.length - 1,
					path: parts.slice(0, index + 1).join('/'),
					children: {}
				};
			}
			current = current[part].children;
		});
	});

	// Auto-exclude based on default exclusions, gitignore, and custom patterns
	projectFiles.forEach(file => {
		const path = file.webkitRelativePath;
		if (matchesDefaultExclusion(path) ||
			matchesPattern(path, gitignorePatterns) ||
			matchesPattern(path, customPatterns)) {
			excludedPaths.add(path);
		}
	});

	renderFolderTree();
}

// Function to render folder tree with checkboxes
export function renderFolderTree() {
	const folderTreeDiv = document.getElementById('folder-tree');
	folderTreeDiv.innerHTML = '';

	// Flatten tree for counting
	const flatItems = flattenTree(folderTree);

	// Use lazy loading for large trees
	if (lazyLoader.shouldUseLazyLoading(flatItems.length)) {
		renderLargeTree(flatItems, folderTreeDiv);
	} else {
		renderTreeNode(folderTree, folderTreeDiv, 0);
	}
}

// Flatten tree structure for lazy loading
function flattenTree(node, depth = 0, path = []) {
	const items = [];
	const entries = Object.entries(node).sort((a, b) => {
		const aIsFile = a[1].isFile;
		const bIsFile = b[1].isFile;
		if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
		return a[0].localeCompare(b[0]);
	});

	entries.forEach(([name, data]) => {
		items.push({ name, data, depth, path: [...path, name] });
		if (!data.isFile && data.children) {
			items.push(...flattenTree(data.children, depth + 1, [...path, name]));
		}
	});

	return items;
}

// Render large tree with virtualization
function renderLargeTree(items, container) {
	// Add a note about large project
	const note = document.createElement('div');
	note.className = 'info-message';
	note.textContent = `Large project detected (${items.length} items). Using optimized rendering.`;
	note.style.marginBottom = '1rem';
	container.appendChild(note);

	// Create scrollable container
	const scrollContainer = document.createElement('div');
	scrollContainer.style.height = '600px';
	scrollContainer.style.overflowY = 'auto';
	scrollContainer.style.border = '1px solid var(--border-color)';
	scrollContainer.style.borderRadius = '4px';
	scrollContainer.style.padding = '0.5rem';
	container.appendChild(scrollContainer);

	// Use virtual scroller
	if (virtualScroller) {
		virtualScroller.update(items);
	} else {
		virtualScroller = new VirtualScroller(
			scrollContainer,
			items,
			(item, index) => createTreeItemElement(item.name, item.data, item.depth),
			30 // estimated item height
		);
	}
}

// Create tree item element (reusable for both rendering modes)
function createTreeItemElement(name, data, depth) {
	const itemDiv = document.createElement('div');
	itemDiv.className = 'tree-item';

	const indent = '&nbsp;'.repeat(depth * 4);
	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.id = `check-${data.path}`;
	checkbox.checked = !excludedPaths.has(data.path);
	checkbox.onchange = () => toggleExclusion(data.path, checkbox.checked);

	const label = document.createElement('label');
	label.htmlFor = `check-${data.path}`;
	label.innerHTML = indent + (data.isFile ? '📄 ' : '📁 ') + name;
	label.className = data.isFile ? 'tree-file' : 'tree-folder';

	if (excludedPaths.has(data.path)) {
		label.classList.add('excluded-label');
	}

	itemDiv.appendChild(checkbox);
	itemDiv.appendChild(label);

	// Add priority star button for files
	if (data.isFile) {
		const priority = getFilePriority(data.path);
		const priorityBtn = document.createElement('button');
		priorityBtn.className = 'priority-btn';
		priorityBtn.innerHTML = priority > 0 ? `⭐${priority}` : '☆';
		priorityBtn.title = 'Set file priority (1-5, higher appears first in output)';
		priorityBtn.onclick = (e) => {
			e.preventDefault();
			togglePriority(data.path, priorityBtn);
		};

		if (priority > 0) {
			priorityBtn.classList.add('active');
			priorityBtn.classList.add(`priority-${priority}`);
		}

		itemDiv.appendChild(priorityBtn);
	}

	return itemDiv;
}

// Function to render individual tree node
function renderTreeNode(node, container, depth) {
	const entries = Object.entries(node).sort((a, b) => {
		// Folders first, then files
		const aIsFile = a[1].isFile;
		const bIsFile = b[1].isFile;
		if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
		return a[0].localeCompare(b[0]);
	});

	entries.forEach(([name, data]) => {
		const itemDiv = createTreeItemElement(name, data, depth);
		container.appendChild(itemDiv);

		// Recursively render children for folders
		if (!data.isFile && Object.keys(data.children).length > 0) {
			renderTreeNode(data.children, container, depth + 1);
		}
	});
}

// Function to toggle file priority
function togglePriority(filePath, button) {
	import('./fileManager.js').then(({ projectFiles }) => {
		let currentPriority = getFilePriority(filePath);
		let newPriority = (currentPriority + 1) % 6; // Cycle 0-5

		setFilePriority(filePath, newPriority);

		// Update button display
		button.innerHTML = newPriority > 0 ? `⭐${newPriority}` : '☆';
		button.className = 'priority-btn';
		if (newPriority > 0) {
			button.classList.add('active');
			button.classList.add(`priority-${newPriority}`);
		}

		// Repack code to update output with new priorities
		packCode(projectFiles);
	});
}

// Function to toggle exclusion for a path
export function toggleExclusion(path, include) {
	// Import projectFiles dynamically to avoid circular dependency
	import('./fileManager.js').then(({ projectFiles }) => {
		if (include) {
			excludedPaths.delete(path);
			// Also include all children
			projectFiles.forEach(file => {
				if (file.webkitRelativePath.startsWith(path + '/') || file.webkitRelativePath === path) {
					excludedPaths.delete(file.webkitRelativePath);
				}
			});
		} else {
			excludedPaths.add(path);
			// Also exclude all children
			projectFiles.forEach(file => {
				if (file.webkitRelativePath.startsWith(path + '/') || file.webkitRelativePath === path) {
					excludedPaths.add(file.webkitRelativePath);
				}
			});
		}

		// Re-render tree and repack
		renderFolderTree();
		packCode(projectFiles);
	});
}
