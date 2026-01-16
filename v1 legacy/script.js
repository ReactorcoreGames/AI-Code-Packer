// Global variables
let projectFiles = [];
let packedCode = '';
let totalSize = 0;
let excludedPaths = new Set();
let folderTree = {};

// Smart default exclusions
const defaultExclusions = [
	'node_modules',
	'.git',
	'dist',
	'build',
	'.next',
	'.cache',
	'coverage',
	'.env',
	'.env.local',
	'.env.development',
	'.env.production',
	'package-lock.json',
	'yarn.lock',
	'pnpm-lock.yaml'
];

// DOM elements
const projectFolderInput = document.getElementById('project-folder');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const totalFilesSpan = document.getElementById('total-files');
const totalLinesSpan = document.getElementById('total-lines');
const projectSizeSpan = document.getElementById('project-size');
const tokenCountSpan = document.getElementById('token-count');
const exclusionSection = document.getElementById('exclusion-section');
const folderTreeDiv = document.getElementById('folder-tree');
const helpBtn = document.getElementById('help-btn');
const helpModal = document.getElementById('help-modal');
const closeBtn = document.querySelector('.close');
const folderStatus = document.getElementById('folder-status');
const outputText = document.getElementById('output-text');

// Text-based file extensions
const textFileExtensions = [
	'txt', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass',
	'less', 'json', 'xml', 'md', 'markdown', 'py', 'java', 'c', 'cpp',
	'h', 'hpp', 'cs', 'php', 'rb', 'swift', 'kt', 'go', 'rs', 'sql',
	'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'sh', 'bash', 'env',
	'gitignore', 'dockerfile', 'vue', 'svelte', 'astro', 'graphql',
	'prisma', 'csv', 'tsv'
];

// Function to check if a file is text-based
function isTextFile(filename) {
	const extension = filename.split('.').pop().toLowerCase();
	return textFileExtensions.includes(extension) || filename.toLowerCase().endsWith('gitignore');
}

// Function to estimate tokens from text (3.5 chars per token for code)
function estimateTokens(text) {
	return Math.ceil(text.length / 3.5);
}

// Function to update token count with color-coding
function updateTokenCount() {
	const tokens = estimateTokens(packedCode);
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

// Function to check if a path should be excluded
function shouldExclude(filePath) {
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
function matchesDefaultExclusion(filePath) {
	const fileName = filePath.split('/').pop();
	const pathParts = filePath.split('/');

	return defaultExclusions.some(exclusion => {
		return pathParts.includes(exclusion) || fileName === exclusion;
	});
}

// Function to build folder tree structure
function buildFolderTree() {
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

	// Auto-exclude default exclusions
	projectFiles.forEach(file => {
		const path = file.webkitRelativePath;
		if (matchesDefaultExclusion(path)) {
			excludedPaths.add(path);
		}
	});

	renderFolderTree();
}

// Function to render folder tree with checkboxes
function renderFolderTree() {
	folderTreeDiv.innerHTML = '';
	renderTreeNode(folderTree, folderTreeDiv, 0);
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
		container.appendChild(itemDiv);

		// Recursively render children for folders
		if (!data.isFile && Object.keys(data.children).length > 0) {
			renderTreeNode(data.children, container, depth + 1);
		}
	});
}

// Function to toggle exclusion for a path
function toggleExclusion(path, include) {
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
	packCode();
}

// Function to toggle exclusion section collapse
function toggleExclusionSection() {
	const content = document.getElementById('exclusion-content');
	const indicator = document.querySelector('.collapse-indicator');

	if (content.classList.contains('hidden')) {
		content.classList.remove('hidden');
		indicator.classList.remove('collapsed');
	} else {
		content.classList.add('hidden');
		indicator.classList.add('collapsed');
	}
}

// Function to format file size
function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to handle folder selection and automatic packing
async function handleFolderSelection(event) {
	projectFiles = Array.from(event.target.files);
	totalSize = projectFiles.reduce((acc, file) => acc + file.size, 0);

	// Reset exclusions
	excludedPaths.clear();

	// Update statistics
	totalFilesSpan.textContent = projectFiles.length;
	projectSizeSpan.textContent = formatFileSize(totalSize);

	folderStatus.textContent = `Processing ${projectFiles.length} files...`;
	folderStatus.className = 'status-message processing';
	folderStatus.style.display = 'block';

	// Build folder tree and show exclusion section
	buildFolderTree();
	exclusionSection.style.display = 'block';

	// Start packing immediately
	await packCode();

	// Update lines count
	updateTotalLines();
}

// Function to update total lines of code
async function updateTotalLines() {
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

	totalLinesSpan.textContent = totalLines.toLocaleString();
}

// Function to pack code
async function packCode() {
	let folderStructure = 'Folder Structure:\n';
	let codeContent = '\nCode Content:\n';
	let includedCount = 0;

	// First, add non-excluded files to folder structure
	for (const file of projectFiles) {
		const filePath = file.webkitRelativePath;
		if (!shouldExclude(filePath)) {
			folderStructure += `${filePath}\n`;
			includedCount++;
		}
	}

	// Then, only process text files for code content (excluding filtered files)
	for (const file of projectFiles) {
		const filePath = file.webkitRelativePath;
		if (!shouldExclude(filePath) && isTextFile(file.name)) {
			await new Promise((resolve) => {
				const reader = new FileReader();
				reader.onload = (e) => {
					const content = e.target.result;
					codeContent += `\n--- ${filePath} ---\n${content}\n`;
					resolve();
				};
				reader.readAsText(file);
			});
		}
	}

	packedCode = folderStructure + codeContent;
	outputText.value = packedCode;

	// Update token count
	updateTokenCount();

	// Update file count to show only included files
	totalFilesSpan.textContent = includedCount;

	// Enable buttons
	downloadBtn.disabled = false;
	copyBtn.disabled = false;

	folderStatus.className = 'status-message success';
	folderStatus.textContent = 'Code packing complete!';

	// Hide status after delay
	setTimeout(() => {
		folderStatus.style.display = 'none';
	}, 3000);
}

// Function to copy to clipboard
async function copyToClipboard() {
	try {
		await navigator.clipboard.writeText(packedCode);
		folderStatus.className = 'status-message success';
		folderStatus.textContent = 'Copied to clipboard!';
		folderStatus.style.display = 'block';

		setTimeout(() => {
			folderStatus.style.display = 'none';
		}, 2000);
	} catch (err) {
		folderStatus.className = 'status-message error';
		folderStatus.textContent = 'Failed to copy to clipboard. Please try again.';
		folderStatus.style.display = 'block';
	}
}

// Function to download packed code
function downloadPackedCode() {
	const blob = new Blob([packedCode], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = generateFileName();
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	folderStatus.className = 'status-message success';
	folderStatus.textContent = 'Download complete!';
	folderStatus.style.display = 'block';

	setTimeout(() => {
		folderStatus.style.display = 'none';
	}, 2000);
}

// Function to generate file name
function generateFileName() {
	const date = new Date();
	const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
	const timeString = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
	const projectName = projectFiles[0].webkitRelativePath.split('/')[0];
	return `${projectName}_${dateString}_${timeString}.txt`;
}

// Function to open help modal with animation
function openHelpModal() {
	helpModal.style.display = 'block';
	// Trigger reflow
	helpModal.offsetHeight;
	helpModal.classList.add('active');
}

// Function to close help modal with animation
function closeHelpModal() {
	helpModal.classList.remove('active');
	setTimeout(() => {
		helpModal.style.display = 'none';
	}, 300);
}

// Function to close modal when clicking outside
function closeModalOutside(event) {
	if (event.target === helpModal) {
		closeHelpModal();
	}
}

// Event listeners
projectFolderInput.addEventListener('change', handleFolderSelection);
downloadBtn.addEventListener('click', downloadPackedCode);
copyBtn.addEventListener('click', copyToClipboard);
helpBtn.addEventListener('click', openHelpModal);
closeBtn.addEventListener('click', closeHelpModal);
window.addEventListener('click', closeModalOutside);
