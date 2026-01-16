// File management - upload, parsing, and tree building

import { defaultExclusions, formatFileSize, isTextFile } from './utils.js';
import { buildFolderTree, resetExclusions, loadGitignore } from './exclusionManager.js';
import { packCode, updateTotalLines } from './outputFormatter.js';
import { updateStatistics, showStatus, updateTabVisibility, switchTab } from './uiController.js';
import { saveRecentProject } from './uxEnhancements.js';

// Global state
export let projectFiles = [];
export let totalSize = 0;

// Set project files (used by other modules)
export function setProjectFiles(files) {
	projectFiles = files;
}

// Function to handle folder selection and automatic packing
export async function handleFolderSelection(event) {
	projectFiles = Array.from(event.target.files);
	totalSize = projectFiles.reduce((acc, file) => acc + file.size, 0);

	// Reset exclusions
	resetExclusions();

	// Update statistics
	updateStatistics(projectFiles.length, formatFileSize(totalSize), 0);

	showStatus(`Processing ${projectFiles.length} files...`, 'processing');

	// Get project name from first file's path
	const projectName = projectFiles[0].webkitRelativePath.split('/')[0];
	const projectPath = projectFiles[0].webkitRelativePath.split('/')[0]; // Browser limitation

	// Save to recent projects
	saveRecentProject(projectName, projectPath, projectFiles.length);

	// Load .gitignore if present
	await loadGitignore(projectFiles);

	// Build folder tree
	buildFolderTree(projectFiles);

	// Start packing immediately
	await packCode(projectFiles);

	// Update lines count
	await updateTotalLines(projectFiles);

	// Update UI visibility and switch to filter tab
	updateTabVisibility();
	switchTab('filter');

	showStatus(`Successfully loaded ${projectFiles.length} files. Review exclusions in the Filter tab.`, 'success');
}
