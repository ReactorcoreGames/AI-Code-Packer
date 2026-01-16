// UX Enhancements - recent projects, keyboard shortcuts, preset sharing

import { switchTab, copyToClipboard, downloadPackedCode } from './uiController.js';
import { setCustomPatterns, buildFolderTree } from './exclusionManager.js';
import { packCode } from './outputFormatter.js';

// Recent projects management
const MAX_RECENT_PROJECTS = 5;

export function saveRecentProject(projectName, projectPath, fileCount) {
	const recentProjects = getRecentProjects();

	// Create project entry
	const projectEntry = {
		name: projectName,
		path: projectPath,
		fileCount: fileCount,
		timestamp: Date.now()
	};

	// Remove duplicate if exists
	const filtered = recentProjects.filter(p => p.path !== projectPath);

	// Add to front and limit to MAX_RECENT_PROJECTS
	filtered.unshift(projectEntry);
	const limited = filtered.slice(0, MAX_RECENT_PROJECTS);

	// Save to localStorage
	localStorage.setItem('recentProjects', JSON.stringify(limited));

	// Update UI
	renderRecentProjects();
}

export function getRecentProjects() {
	try {
		const stored = localStorage.getItem('recentProjects');
		return stored ? JSON.parse(stored) : [];
	} catch (e) {
		console.error('Error loading recent projects:', e);
		return [];
	}
}

export function clearRecentProjects() {
	localStorage.removeItem('recentProjects');
	renderRecentProjects();
}

export function renderRecentProjects() {
	const recentProjects = getRecentProjects();

	// Find or create recent projects container in Upload tab
	let container = document.getElementById('recent-projects-container');
	if (!container) {
		container = document.createElement('div');
		container.id = 'recent-projects-container';
		container.className = 'recent-projects';

		const uploadTab = document.getElementById('upload-tab');
		const card = uploadTab.querySelector('.card');
		const instructions = card.querySelector('.instructions');

		// Insert before instructions
		if (instructions) {
			card.insertBefore(container, instructions);
		} else {
			card.appendChild(container);
		}
	}

	if (recentProjects.length === 0) {
		container.innerHTML = '';
		container.style.display = 'none';
		return;
	}

	container.style.display = 'block';

	let html = '<h3>Recent Projects</h3>';
	html += '<div class="recent-projects-list">';

	recentProjects.forEach((project, index) => {
		const date = new Date(project.timestamp);
		const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

		html += `
			<div class="recent-project-item">
				<div class="recent-project-info">
					<div class="recent-project-name">📁 ${project.name}</div>
					<div class="recent-project-meta">${project.fileCount} files • ${dateStr}</div>
				</div>
				<button class="btn btn-small" onclick="window.loadRecentProject(${index})">
					Load
				</button>
			</div>
		`;
	});

	html += '</div>';
	html += '<button class="btn btn-small btn-secondary" onclick="window.clearRecentProjects()">Clear All</button>';

	container.innerHTML = html;
}

// Note: Actual loading of recent project would require file system access
// which browsers don't allow. This is a placeholder for the UI.
window.loadRecentProject = function(index) {
	const projects = getRecentProjects();
	const project = projects[index];
	alert(`To reload "${project.name}", please select the folder again using the "Choose Project Folder" button.\n\nBrowsers don't allow automatic file system access for security reasons.`);
};

window.clearRecentProjects = clearRecentProjects;

// Preset export/import functionality
export function exportPreset(presetName) {
	const customPatternsEl = document.getElementById('custom-patterns');
	const customPatterns = customPatternsEl ? customPatternsEl.value : '';

	const preset = {
		name: presetName,
		version: '1.0',
		customPatterns: customPatterns,
		timestamp: Date.now()
	};

	const json = JSON.stringify(preset, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `code-packer-preset-${presetName.toLowerCase().replace(/\s+/g, '-')}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function importPreset(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const preset = JSON.parse(e.target.result);

				// Validate preset structure
				if (!preset.name || !preset.version) {
					throw new Error('Invalid preset file format');
				}

				// Apply custom patterns
				if (preset.customPatterns) {
					const customPatternsEl = document.getElementById('custom-patterns');
					if (customPatternsEl) {
						customPatternsEl.value = preset.customPatterns;
					}
				}

				resolve(preset);
			} catch (error) {
				reject(error);
			}
		};
		reader.onerror = () => reject(new Error('Failed to read preset file'));
		reader.readAsText(file);
	});
}

// Keyboard shortcuts - REMOVED per user request
// Users preferred not having keyboard shortcuts that interfere with normal usage

// Add preset export/import UI to Filter tab
export function addPresetManagement() {
	const filterTab = document.getElementById('filter-tab');
	if (!filterTab) return;

	const card = filterTab.querySelector('.card');
	if (!card) return;

	// Check if already added
	if (document.getElementById('preset-management')) return;

	const managementSection = document.createElement('div');
	managementSection.id = 'preset-management';
	managementSection.className = 'filter-section';
	managementSection.innerHTML = `
		<h3>Preset Management</h3>
		<p class="helper-text">Save your custom exclusion patterns as a preset for future use.</p>
		<div class="preset-management-actions">
			<input type="text" id="preset-name-input" class="preset-name-input" placeholder="Preset name..." />
			<button id="export-preset-btn" class="btn btn-small">💾 Export Preset</button>
			<label for="import-preset-input" class="btn btn-small btn-secondary">📂 Import Preset</label>
			<input type="file" id="import-preset-input" accept=".json" style="display: none;" />
		</div>
		<div id="preset-status" class="pattern-status"></div>
	`;

	// Insert at the end of the card
	card.appendChild(managementSection);

	// Add event listeners
	document.getElementById('export-preset-btn').addEventListener('click', () => {
		const nameInput = document.getElementById('preset-name-input');
		const presetName = nameInput.value.trim() || 'my-preset';
		exportPreset(presetName);
		showPresetStatus('Preset exported successfully!', 'success');
		nameInput.value = '';
	});

	document.getElementById('import-preset-input').addEventListener('change', async (e) => {
		const file = e.target.files[0];
		if (file) {
			try {
				const preset = await importPreset(file);
				showPresetStatus(`Preset "${preset.name}" imported successfully!`, 'success');
				e.target.value = ''; // Reset file input
			} catch (error) {
				showPresetStatus(`Error importing preset: ${error.message}`, 'error');
			}
		}
	});
}

function showPresetStatus(message, type) {
	const statusDiv = document.getElementById('preset-status');
	if (statusDiv) {
		statusDiv.textContent = message;
		statusDiv.className = `pattern-status visible ${type}`;
		setTimeout(() => {
			statusDiv.classList.remove('visible');
		}, 4000);
	}
}

// Keyboard shortcuts help - REMOVED

// Initialize all UX enhancements
export function initializeUXEnhancements() {
	renderRecentProjects();
	addPresetManagement();
}
