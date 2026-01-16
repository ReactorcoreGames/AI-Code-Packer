// UI Controller - event handlers, modals, status updates

import { handleFolderSelection } from './fileManager.js';
import { getPackedCode, setCurrentFormat, getCurrentFormat, initializeFormat } from './outputFormatter.js';
import { generateFileName } from './utils.js';
import { projectFiles } from './fileManager.js';
import { setCustomPatterns, buildFolderTree, applyPreset } from './exclusionManager.js';
import { packCode } from './outputFormatter.js';

// Function to switch between tabs
export function switchTab(tabName) {
	// Hide all tab contents
	const tabContents = document.querySelectorAll('.tab-content');
	tabContents.forEach(tab => tab.classList.remove('active'));

	// Remove active class from all tab buttons
	const tabButtons = document.querySelectorAll('.tab-btn');
	tabButtons.forEach(btn => btn.classList.remove('active'));

	// Show the selected tab content
	const selectedTab = document.getElementById(`${tabName}-tab`);
	if (selectedTab) {
		selectedTab.classList.add('active');
	}

	// Add active class to the clicked tab button
	const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
	if (selectedButton) {
		selectedButton.classList.add('active');
	}

	// Update UI elements based on active tab
	updateTabVisibility();
}

// Function to update visibility of elements based on current tab and project state
export function updateTabVisibility() {
	const hasFiles = projectFiles && projectFiles.length > 0;
	const folderTree = document.getElementById('folder-tree');
	const noFilesMessage = document.getElementById('no-files-message');
	const outputText = document.getElementById('output-text');
	const previewEmptyMessage = document.getElementById('preview-empty-message');

	// Filter tab
	if (folderTree && noFilesMessage) {
		if (hasFiles) {
			folderTree.style.display = 'block';
			noFilesMessage.style.display = 'none';
		} else {
			folderTree.style.display = 'none';
			noFilesMessage.style.display = 'block';
		}
	}

	// Preview tab
	if (outputText && previewEmptyMessage) {
		if (hasFiles && outputText.value) {
			outputText.style.display = 'block';
			previewEmptyMessage.style.display = 'none';
		} else {
			outputText.style.display = 'none';
			previewEmptyMessage.style.display = 'block';
		}
	}
}

// Function to toggle exclusion section collapse (kept for backward compatibility)
export function toggleExclusionSection() {
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

// Function to update statistics display
export function updateStatistics(fileCount, sizeText, linesCount) {
	document.getElementById('total-files').textContent = fileCount;
	document.getElementById('project-size').textContent = sizeText;
	if (linesCount !== undefined) {
		document.getElementById('total-lines').textContent = linesCount.toLocaleString();
	}
}

// Function to show status message
export function showStatus(message, type) {
	const folderStatus = document.getElementById('folder-status');
	folderStatus.textContent = message;
	folderStatus.className = `status-message ${type}`;
	folderStatus.style.display = 'block';
}

// Function to copy to clipboard
export async function copyToClipboard() {
	const packedCode = getPackedCode();
	try {
		await navigator.clipboard.writeText(packedCode);
		showStatus('Copied to clipboard!', 'success');

		setTimeout(() => {
			document.getElementById('folder-status').style.display = 'none';
		}, 2000);
	} catch (err) {
		showStatus('Failed to copy to clipboard. Please try again.', 'error');
	}
}

// Function to download packed code
export function downloadPackedCode() {
	const packedCode = getPackedCode();
	const blob = new Blob([packedCode], { type: 'text/plain' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = generateFileName(projectFiles);
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);

	showStatus('Download complete!', 'success');

	setTimeout(() => {
		document.getElementById('folder-status').style.display = 'none';
	}, 2000);
}

// Function to open help modal with animation
export function openHelpModal() {
	const helpModal = document.getElementById('help-modal');
	helpModal.style.display = 'block';
	// Trigger reflow
	helpModal.offsetHeight;
	helpModal.classList.add('active');
}

// Function to close help modal with animation
export function closeHelpModal() {
	const helpModal = document.getElementById('help-modal');
	helpModal.classList.remove('active');
	setTimeout(() => {
		helpModal.style.display = 'none';
	}, 300);
}

// Function to close modal when clicking outside
function closeModalOutside(event) {
	const helpModal = document.getElementById('help-modal');
	if (event.target === helpModal) {
		closeHelpModal();
	}
}

// Function to handle custom pattern application
export async function applyCustomPatterns() {
	if (!projectFiles || projectFiles.length === 0) {
		showPatternStatus('Please load a project first.', 'info');
		return;
	}

	const patternInput = document.getElementById('custom-patterns');
	const patterns = patternInput.value;

	setCustomPatterns(patterns);
	buildFolderTree(projectFiles);
	await packCode(projectFiles);

	const count = patterns.split(/[,\n]/).filter(p => p.trim()).length;
	showPatternStatus(`Applied ${count} custom pattern(s). Tree and output updated.`, 'success');
}

// Function to show pattern status message
function showPatternStatus(message, type) {
	const statusDiv = document.getElementById('pattern-status');
	statusDiv.textContent = message;
	statusDiv.className = `pattern-status visible ${type}`;

	setTimeout(() => {
		statusDiv.classList.remove('visible');
	}, 4000);
}

// Function to handle preset selection
export async function handlePresetClick(presetType) {
	if (!projectFiles || projectFiles.length === 0) {
		showStatus('Please load a project first.', 'info');
		return;
	}

	// Remove active class from all preset buttons
	document.querySelectorAll('.btn-preset').forEach(btn => {
		btn.classList.remove('active');
	});

	// Add active class to clicked button
	const clickedButton = document.querySelector(`[data-preset="${presetType}"]`);
	if (clickedButton) {
		clickedButton.classList.add('active');
	}

	await applyPreset(presetType, projectFiles);
	showStatus(`Applied "${presetType}" preset.`, 'success');

	setTimeout(() => {
		document.getElementById('folder-status').style.display = 'none';
	}, 2000);
}

// Function to update download button text based on format
function updateDownloadButtonText(format) {
	const downloadBtnText = document.getElementById('download-btn-text');
	if (!downloadBtnText) return;

	const formatExtensions = {
		'plain': 'TXT',
		'xml': 'XML',
		'json': 'JSON',
		'markdown': 'MD',
		'tree': 'TXT'
	};

	const extension = formatExtensions[format] || 'TXT';
	downloadBtnText.textContent = `Download as ${extension}`;
}

// Function to handle format change
export async function handleFormatChange(format) {
	if (!projectFiles || projectFiles.length === 0) {
		return;
	}

	setCurrentFormat(format);
	updateDownloadButtonText(format);
	showStatus(`Regenerating output in ${format} format...`, 'processing');
	await packCode(projectFiles);
	showStatus(`Output format changed to ${format}!`, 'success');

	setTimeout(() => {
		document.getElementById('folder-status').style.display = 'none';
	}, 2000);
}

// Initialize event listeners when DOM is ready
export function initializeEventListeners() {
	// Initialize format from localStorage
	initializeFormat();
	const savedFormat = getCurrentFormat();
	const formatRadio = document.querySelector(`input[name="output-format"][value="${savedFormat}"]`);
	if (formatRadio) {
		formatRadio.checked = true;
	}
	// Update download button text based on saved format
	updateDownloadButtonText(savedFormat);

	// File selection
	const projectFolderInput = document.getElementById('project-folder');
	projectFolderInput.addEventListener('change', handleFolderSelection);

	// Buttons
	const downloadBtn = document.getElementById('download-btn');
	const copyBtn = document.getElementById('copy-btn');

	downloadBtn.addEventListener('click', downloadPackedCode);
	copyBtn.addEventListener('click', copyToClipboard);

	// Tab navigation
	const tabButtons = document.querySelectorAll('.tab-btn');
	tabButtons.forEach(button => {
		button.addEventListener('click', () => {
			const tabName = button.getAttribute('data-tab');
			switchTab(tabName);
		});
	});

	// Custom patterns
	const applyPatternsBtn = document.getElementById('apply-patterns-btn');
	if (applyPatternsBtn) {
		applyPatternsBtn.addEventListener('click', applyCustomPatterns);
	}

	// Preset buttons
	const presetButtons = document.querySelectorAll('.btn-preset');
	presetButtons.forEach(button => {
		button.addEventListener('click', () => {
			const preset = button.getAttribute('data-preset');
			handlePresetClick(preset);
		});
	});

	// Format selector
	const formatRadios = document.querySelectorAll('input[name="output-format"]');
	formatRadios.forEach(radio => {
		radio.addEventListener('change', (e) => {
			handleFormatChange(e.target.value);
		});
	});

	// Initialize tab visibility
	updateTabVisibility();
}

// Make toggleExclusionSection available globally for inline onclick handler
window.toggleExclusionSection = toggleExclusionSection;
