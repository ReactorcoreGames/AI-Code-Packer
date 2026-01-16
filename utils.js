// Shared utilities and constants

// Text-based file extensions
export const textFileExtensions = [
	'txt', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass',
	'less', 'json', 'xml', 'md', 'markdown', 'py', 'java', 'c', 'cpp',
	'h', 'hpp', 'cs', 'php', 'rb', 'swift', 'kt', 'go', 'rs', 'sql',
	'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'sh', 'bash', 'env',
	'gitignore', 'dockerfile', 'vue', 'svelte', 'astro', 'graphql',
	'prisma', 'csv', 'tsv'
];

// Smart default exclusions (folders and files)
export const defaultExclusions = [
	// JavaScript/Node.js
	'node_modules',
	'package-lock.json',
	'yarn.lock',
	'pnpm-lock.yaml',
	'npm-debug.log',
	'yarn-error.log',
	'.next',
	'.nuxt',

	// Python
	'__pycache__',
	'*.pyc',
	'*.pyo',
	'*.pyd',
	'.Python',
	'venv',
	'env',
	'ENV',
	'virtualenv',
	'.pytest_cache',
	'*.egg-info',
	'dist',
	'build',
	'.tox',

	// Java
	'target',
	'*.class',
	'*.jar',
	'*.war',
	'*.ear',

	// .NET
	'bin',
	'obj',
	'*.dll',
	'*.exe',
	'*.pdb',

	// Ruby
	'vendor/bundle',
	'*.gem',
	'.bundle',

	// Go
	'vendor',
	'*.test',

	// Rust
	'Cargo.lock',

	// Version Control
	'.git',
	'.svn',
	'.hg',

	// Build/Cache directories
	'.cache',
	'cache',
	'tmp',
	'temp',
	'coverage',
	'.nyc_output',

	// Environment files
	'.env',
	'.env.local',
	'.env.development',
	'.env.production',
	'.env.test',

	// IDE/Editor files
	'.vscode',
	'.idea',
	'.DS_Store',
	'Thumbs.db',
	'*.swp',
	'*.swo',
	'*~'
];

// Media file extensions (detected but not loaded)
export const mediaExtensions = [
	// Images
	'png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'ico', 'webp', 'tiff', 'tif',
	// Audio
	'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
	// Video
	'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'mpeg', 'mpg',
	// Fonts
	'ttf', 'otf', 'woff', 'woff2', 'eot',
	// Archives
	'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
	// Binary data
	'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'
];

// Function to check if a file is text-based
export function isTextFile(filename) {
	const extension = filename.split('.').pop().toLowerCase();
	return textFileExtensions.includes(extension) || filename.toLowerCase().endsWith('gitignore');
}

// Function to check if a file is a media/binary file
export function isMediaFile(filename) {
	const extension = filename.split('.').pop().toLowerCase();
	return mediaExtensions.includes(extension);
}

// Function to match wildcard patterns and glob patterns
export function matchesWildcard(filepath, pattern) {
	if (!pattern.includes('*')) {
		return filepath === pattern || filepath.endsWith('/' + pattern);
	}

	// Handle ** (match any directory depth)
	if (pattern.includes('**')) {
		// Convert glob pattern to regex
		let regexPattern = pattern
			.replace(/\./g, '\\.')           // Escape dots
			.replace(/\*\*/g, '<<<STAR>>>')  // Placeholder for **
			.replace(/\*/g, '[^/]*')         // * matches anything except /
			.replace(/<<<STAR>>>/g, '.*');   // ** matches anything including /

		// Handle leading ** (e.g., **/backup/*)
		if (pattern.startsWith('**/')) {
			regexPattern = '(^|/)' + regexPattern.slice(4);
		}

		const regex = new RegExp(regexPattern);
		return regex.test(filepath);
	}

	// Handle simple wildcards (e.g., *.log, test*)
	// Check against filename only
	const filename = filepath.split('/').pop();
	const regexPattern = pattern
		.replace(/\./g, '\\.')
		.replace(/\*/g, '.*');
	const regex = new RegExp('^' + regexPattern + '$');

	return regex.test(filename);
}

// Function to estimate tokens from text (3.5 chars per token for code)
export function estimateTokens(text) {
	return Math.ceil(text.length / 3.5);
}

// Function to format file size
export function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to generate file name for download
export function generateFileName(projectFiles) {
	const date = new Date();
	const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
	const timeString = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
	const projectName = projectFiles[0].webkitRelativePath.split('/')[0];
	return `${projectName}_${dateString}_${timeString}.txt`;
}

// Function to parse .gitignore content into exclusion patterns
export function parseGitignore(content) {
	if (!content) return [];

	return content
		.split('\n')
		.map(line => line.trim())
		.filter(line => {
			// Remove comments and empty lines
			return line && !line.startsWith('#');
		})
		.map(pattern => {
			// Remove leading slash
			if (pattern.startsWith('/')) {
				pattern = pattern.slice(1);
			}
			// Remove trailing slash (it means directory)
			if (pattern.endsWith('/')) {
				pattern = pattern.slice(0, -1);
			}
			return pattern;
		});
}
