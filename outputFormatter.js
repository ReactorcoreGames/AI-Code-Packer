// Output formatting - code packing, token counting, format generation

import { isTextFile, isMediaFile, estimateTokens } from './utils.js';
import { shouldExclude } from './exclusionManager.js';
import { updateStatistics, showStatus } from './uiController.js';
import { debounce } from './performance.js';

// Global state
export let packedCode = '';
export let currentFormat = 'plain'; // plain, xml, json, markdown, tree
export let filePriorities = {}; // Store file priorities {path: priority}
let fileWorker = null; // Web Worker for background processing

// Get packed code (used by uiController for copy/download)
export function getPackedCode() {
	return packedCode;
}

// Get/Set current format
export function getCurrentFormat() {
	return currentFormat;
}

export function setCurrentFormat(format) {
	currentFormat = format;
	// Save to localStorage
	localStorage.setItem('outputFormat', format);
}

// Initialize format from localStorage
export function initializeFormat() {
	const savedFormat = localStorage.getItem('outputFormat');
	if (savedFormat) {
		currentFormat = savedFormat;
	}
}

// File priority management
export function setFilePriority(filePath, priority) {
	if (priority === 0) {
		delete filePriorities[filePath];
	} else {
		filePriorities[filePath] = priority;
	}
	// Save to localStorage
	localStorage.setItem('filePriorities', JSON.stringify(filePriorities));
}

export function getFilePriority(filePath) {
	return filePriorities[filePath] || 0;
}

export function clearFilePriorities() {
	filePriorities = {};
	localStorage.removeItem('filePriorities');
}

// Initialize priorities from localStorage
export function initializePriorities() {
	const savedPriorities = localStorage.getItem('filePriorities');
	if (savedPriorities) {
		try {
			filePriorities = JSON.parse(savedPriorities);
		} catch (e) {
			filePriorities = {};
		}
	}
}

// Initialize Web Worker
function initializeWorker() {
	if (!fileWorker && typeof Worker !== 'undefined') {
		try {
			fileWorker = new Worker('fileWorker.js');
			fileWorker.onerror = (error) => {
				console.warn('Web Worker not available, falling back to main thread:', error);
				fileWorker = null;
			};
		} catch (e) {
			console.warn('Web Worker initialization failed, using main thread:', e);
			fileWorker = null;
		}
	}
	return fileWorker;
}

// Function to update token count with color-coding (debounced)
function updateTokenCountInternal(tokens) {
	const tokenCountSpan = document.getElementById('token-count');
	tokenCountSpan.textContent = tokens.toLocaleString();

	// Remove all color classes
	tokenCountSpan.classList.remove('token-green', 'token-yellow', 'token-orange', 'token-red');

	// Add appropriate color class based on token count
	if (tokens < 8000) {
		tokenCountSpan.classList.add('token-green');
	} else if (tokens < 32000) {
		tokenCountSpan.classList.add('token-yellow');
	} else if (tokens < 100000) {
		tokenCountSpan.classList.add('token-orange');
	} else {
		tokenCountSpan.classList.add('token-red');
	}
}

// Debounced version to prevent excessive updates
export const updateTokenCount = debounce(updateTokenCountInternal, 300);

// Function to update total lines of code
export async function updateTotalLines(projectFiles) {
	let totalLines = 0;

	for (const file of projectFiles) {
		const filePath = file.webkitRelativePath;
		if (!shouldExclude(filePath) && isTextFile(file.name)) {
			await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					const lines = content.split('\n').length;
					totalLines += lines;
					resolve();
				};
				reader.readAsText(file);
			});
		}
	}

	document.getElementById('total-lines').textContent = totalLines.toLocaleString();
}

// Helper function to sort files by priority
function sortFilesByPriority(files) {
	return files.sort((a, b) => {
		const priorityA = getFilePriority(a.webkitRelativePath);
		const priorityB = getFilePriority(b.webkitRelativePath);
		// Higher priority first (5 > 4 > 3 > 2 > 1 > 0)
		return priorityB - priorityA;
	});
}

// Format generators for different output types
async function generatePlainTextFormat(projectFiles) {
	let folderStructure = 'Folder Structure:\n';
	let mediaFiles = '\nMedia/Binary Files (listed but not included):\n';
	let codeContent = '\nCode Content:\n';
	let hasMediaFiles = false;

	// Collect all non-excluded files
	const includedFiles = projectFiles.filter(file => !shouldExclude(file.webkitRelativePath));

	// Add folder structure
	for (const file of includedFiles) {
		const filePath = file.webkitRelativePath;
		const priority = getFilePriority(filePath);
		const priorityIndicator = priority > 0 ? ` ⭐${priority}` : '';
		folderStructure += `${filePath}${priorityIndicator}\n`;

		// Detect media files
		if (isMediaFile(file.name)) {
			const fileSize = (file.size / 1024).toFixed(2);
			mediaFiles += `${filePath} (${fileSize} KB)${priorityIndicator}\n`;
			hasMediaFiles = true;
		}
	}

	// Sort files by priority
	const sortedFiles = sortFilesByPriority([...includedFiles]);

	// Process text files for code content
	for (const file of sortedFiles) {
		const filePath = file.webkitRelativePath;
		if (isTextFile(file.name) && !isMediaFile(file.name)) {
			await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					const priority = getFilePriority(filePath);
					const priorityIndicator = priority > 0 ? ` ⭐${priority}` : '';
					codeContent += `\n--- ${filePath}${priorityIndicator} ---\n${content}\n`;
					resolve();
				};
				reader.readAsText(file);
			});
		}
	}

	let output = folderStructure;
	if (hasMediaFiles) {
		output += mediaFiles;
	}
	output += codeContent;
	return output;
}

async function generateXMLFormat(projectFiles) {
	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<codebase>\n';

	const includedFiles = projectFiles.filter(file => !shouldExclude(file.webkitRelativePath));
	const sortedFiles = sortFilesByPriority([...includedFiles]);

	for (const file of sortedFiles) {
		const filePath = file.webkitRelativePath;
		const priority = getFilePriority(filePath);

		if (isTextFile(file.name) && !isMediaFile(file.name)) {
			await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					// Escape XML special characters
					const escapedContent = content
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;')
						.replace(/'/g, '&apos;');

					const priorityAttr = priority > 0 ? ` priority="${priority}"` : '';
					xml += `  <file path="${filePath}"${priorityAttr}>\n`;
					xml += `    <content><![CDATA[${content}]]></content>\n`;
					xml += `  </file>\n`;
					resolve();
				};
				reader.readAsText(file);
			});
		} else if (isMediaFile(file.name)) {
			const fileSize = (file.size / 1024).toFixed(2);
			const priorityAttr = priority > 0 ? ` priority="${priority}"` : '';
			xml += `  <media-file path="${filePath}" size="${fileSize}KB"${priorityAttr} />\n`;
		}
	}

	xml += '</codebase>';
	return xml;
}

async function generateJSONFormat(projectFiles) {
	const files = [];

	const includedFiles = projectFiles.filter(file => !shouldExclude(file.webkitRelativePath));
	const sortedFiles = sortFilesByPriority([...includedFiles]);

	for (const file of sortedFiles) {
		const filePath = file.webkitRelativePath;
		const priority = getFilePriority(filePath);

		if (isTextFile(file.name) && !isMediaFile(file.name)) {
			await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					const fileObj = {
						path: filePath,
						type: 'text',
						content: content
					};
					if (priority > 0) {
						fileObj.priority = priority;
					}
					files.push(fileObj);
					resolve();
				};
				reader.readAsText(file);
			});
		} else if (isMediaFile(file.name)) {
			const fileSize = (file.size / 1024).toFixed(2);
			const fileObj = {
				path: filePath,
				type: 'media',
				size: `${fileSize}KB`
			};
			if (priority > 0) {
				fileObj.priority = priority;
			}
			files.push(fileObj);
		}
	}

	return JSON.stringify(files, null, 2);
}

async function generateMarkdownFormat(projectFiles) {
	let md = '# Codebase Contents\n\n';
	md += '## Table of Contents\n\n';

	const includedFiles = projectFiles.filter(file => !shouldExclude(file.webkitRelativePath));
	const sortedFiles = sortFilesByPriority([...includedFiles]);

	// Generate TOC
	const textFiles = sortedFiles.filter(file => isTextFile(file.name) && !isMediaFile(file.name));
	textFiles.forEach((file, index) => {
		const priority = getFilePriority(file.webkitRelativePath);
		const priorityIndicator = priority > 0 ? ` ⭐${priority}` : '';
		md += `${index + 1}. [${file.webkitRelativePath}${priorityIndicator}](#file-${index})\n`;
	});

	md += '\n## Files\n\n';

	// Process text files with collapsible sections
	for (let i = 0; i < textFiles.length; i++) {
		const file = textFiles[i];
		const filePath = file.webkitRelativePath;
		const priority = getFilePriority(filePath);
		const priorityIndicator = priority > 0 ? ` ⭐${priority}` : '';

		await new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target.result;
				const fileExt = file.name.split('.').pop();

				md += `<details id="file-${i}">\n`;
				md += `<summary><strong>${filePath}${priorityIndicator}</strong></summary>\n\n`;
				md += `\`\`\`${fileExt}\n${content}\n\`\`\`\n\n`;
				md += `</details>\n\n`;
				resolve();
			};
			reader.readAsText(file);
		});
	}

	// Add media files section
	const mediaFilesList = sortedFiles.filter(file => isMediaFile(file.name));
	if (mediaFilesList.length > 0) {
		md += '## Media/Binary Files\n\n';
		mediaFilesList.forEach(file => {
			const fileSize = (file.size / 1024).toFixed(2);
			const priority = getFilePriority(file.webkitRelativePath);
			const priorityIndicator = priority > 0 ? ` ⭐${priority}` : '';
			md += `- ${file.webkitRelativePath}${priorityIndicator} (${fileSize} KB)\n`;
		});
	}

	return md;
}

async function generateTreeFormat(projectFiles) {
	let output = 'Project Structure:\n\n';

	const includedFiles = projectFiles.filter(file => !shouldExclude(file.webkitRelativePath));
	const sortedFiles = sortFilesByPriority([...includedFiles]);

	// Build tree structure
	const tree = {};
	sortedFiles.forEach(file => {
		const parts = file.webkitRelativePath.split('/');
		let current = tree;
		parts.forEach((part, index) => {
			if (!current[part]) {
				current[part] = index === parts.length - 1 ? { __file: file } : {};
			}
			current = current[part];
		});
	});

	// Render tree
	function renderTree(node, prefix = '', isLast = true) {
		const entries = Object.keys(node).filter(k => k !== '__file');
		entries.forEach((key, index) => {
			const isLastEntry = index === entries.length - 1;
			const connector = isLastEntry ? '└── ' : '├── ';
			const childPrefix = prefix + (isLastEntry ? '    ' : '│   ');

			if (node[key].__file) {
				const file = node[key].__file;
				const priority = getFilePriority(file.webkitRelativePath);
				const priorityIndicator = priority > 0 ? ` ⭐${priority}` : '';
				const fileSize = (file.size / 1024).toFixed(2);
				const isMedia = isMediaFile(file.name);
				const fileType = isMedia ? ' [media]' : '';
				output += `${prefix}${connector}${key}${priorityIndicator}${fileType} (${fileSize} KB)\n`;
			} else {
				output += `${prefix}${connector}${key}/\n`;
				renderTree(node[key], childPrefix, isLastEntry);
			}
		});
	}

	renderTree(tree);

	output += '\n\nFile Contents:\n\n';

	// Add file contents
	for (const file of sortedFiles) {
		const filePath = file.webkitRelativePath;
		if (isTextFile(file.name) && !isMediaFile(file.name)) {
			await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					const priority = getFilePriority(filePath);
					const priorityIndicator = priority > 0 ? ` ⭐${priority}` : '';
					const lines = content.split('\n').length;
					output += `━━━ ${filePath}${priorityIndicator} (${lines} lines) ━━━\n${content}\n\n`;
					resolve();
				};
				reader.readAsText(file);
			});
		}
	}

	return output;
}

// Main pack code function with format support
export async function packCode(projectFiles) {
	let output = '';
	let includedCount = 0;

	// Count included files
	for (const file of projectFiles) {
		if (!shouldExclude(file.webkitRelativePath)) {
			includedCount++;
		}
	}

	// Generate output based on current format
	switch (currentFormat) {
		case 'xml':
			output = await generateXMLFormat(projectFiles);
			break;
		case 'json':
			output = await generateJSONFormat(projectFiles);
			break;
		case 'markdown':
			output = await generateMarkdownFormat(projectFiles);
			break;
		case 'tree':
			output = await generateTreeFormat(projectFiles);
			break;
		case 'plain':
		default:
			output = await generatePlainTextFormat(projectFiles);
			break;
	}

	packedCode = output;
	document.getElementById('output-text').value = packedCode;

	// Update token count
	const tokens = estimateTokens(packedCode);
	updateTokenCount(tokens);

	// Update file count to show only included files
	const totalFilesSpan = document.getElementById('total-files');
	totalFilesSpan.textContent = includedCount;

	// Enable buttons
	document.getElementById('download-btn').disabled = false;
	document.getElementById('copy-btn').disabled = false;

	showStatus('Code packing complete!', 'success');

	// Hide status after delay
	setTimeout(() => {
		document.getElementById('folder-status').style.display = 'none';
	}, 3000);
}
