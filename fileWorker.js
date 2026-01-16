// Web Worker for file processing and token counting
// This runs in a separate thread to avoid blocking the UI

// Token estimation (3.5 chars per token for code)
function estimateTokens(text) {
	return Math.ceil(text.length / 3.5);
}

// Text-based file extensions
const textFileExtensions = [
	'txt', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass',
	'less', 'json', 'xml', 'md', 'markdown', 'py', 'java', 'c', 'cpp',
	'h', 'hpp', 'cs', 'php', 'rb', 'swift', 'kt', 'go', 'rs', 'sql',
	'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'sh', 'bash', 'env',
	'gitignore', 'dockerfile', 'vue', 'svelte', 'astro', 'graphql',
	'prisma', 'csv', 'tsv'
];

function isTextFile(filename) {
	const extension = filename.split('.').pop().toLowerCase();
	return textFileExtensions.includes(extension) || filename.toLowerCase().endsWith('gitignore');
}

// Process file content and count tokens
function processFileContent(content) {
	const lines = content.split('\n').length;
	const tokens = estimateTokens(content);
	const chars = content.length;

	return { lines, tokens, chars };
}

// Parse gitignore content
function parseGitignore(content) {
	if (!content) return [];

	return content
		.split('\n')
		.map(line => line.trim())
		.filter(line => line && !line.startsWith('#'))
		.map(pattern => {
			if (pattern.startsWith('/')) {
				pattern = pattern.slice(1);
			}
			if (pattern.endsWith('/')) {
				pattern = pattern.slice(0, -1);
			}
			return pattern;
		});
}

// Message handler
self.onmessage = async function(e) {
	const { type, data } = e.data;

	try {
		switch (type) {
			case 'ESTIMATE_TOKENS':
				const tokens = estimateTokens(data.text);
				self.postMessage({ type: 'TOKENS_ESTIMATED', result: tokens });
				break;

			case 'PROCESS_FILE':
				const result = processFileContent(data.content);
				self.postMessage({
					type: 'FILE_PROCESSED',
					result: result,
					fileId: data.fileId
				});
				break;

			case 'PARSE_GITIGNORE':
				const patterns = parseGitignore(data.content);
				self.postMessage({
					type: 'GITIGNORE_PARSED',
					result: patterns
				});
				break;

			case 'BATCH_PROCESS':
				const batchResults = [];
				for (const item of data.items) {
					if (isTextFile(item.name)) {
						const processed = processFileContent(item.content);
						batchResults.push({
							path: item.path,
							...processed
						});
					}
				}
				self.postMessage({
					type: 'BATCH_PROCESSED',
					result: batchResults
				});
				break;

			default:
				self.postMessage({
					type: 'ERROR',
					error: `Unknown message type: ${type}`
				});
		}
	} catch (error) {
		self.postMessage({
			type: 'ERROR',
			error: error.message
		});
	}
};
