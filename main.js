// Main entry point - initializes the application

import { initializeEventListeners } from './uiController.js';
import { initializeFormat, initializePriorities } from './outputFormatter.js';
import { initializeUXEnhancements } from './uxEnhancements.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
	// Initialize format and priorities from localStorage
	initializeFormat();
	initializePriorities();

	// Initialize event listeners
	initializeEventListeners();

	// Initialize UX enhancements (keyboard shortcuts, recent projects, etc.)
	initializeUXEnhancements();
});
