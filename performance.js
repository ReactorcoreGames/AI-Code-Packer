// Performance utilities - debouncing, throttling, lazy loading

// Debounce function to limit how often a function can fire
export function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Throttle function to ensure a function is called at most once in a specified time period
export function throttle(func, limit) {
	let inThrottle;
	return function executedFunction(...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => inThrottle = false, limit);
		}
	};
}

// Virtual scroll renderer for large lists
export class VirtualScroller {
	constructor(container, items, renderItem, itemHeight = 30) {
		this.container = container;
		this.items = items;
		this.renderItem = renderItem;
		this.itemHeight = itemHeight;
		this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 5; // Buffer
		this.startIndex = 0;

		this.setupContainer();
		this.render();
		this.attachScrollListener();
	}

	setupContainer() {
		// Create a wrapper for positioning
		this.wrapper = document.createElement('div');
		this.wrapper.style.position = 'relative';
		this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;

		// Create viewport for visible items
		this.viewport = document.createElement('div');
		this.viewport.style.position = 'absolute';
		this.viewport.style.top = '0';
		this.viewport.style.left = '0';
		this.viewport.style.right = '0';

		this.wrapper.appendChild(this.viewport);
		this.container.appendChild(this.wrapper);
	}

	render() {
		const endIndex = Math.min(this.startIndex + this.visibleCount, this.items.length);
		const visibleItems = this.items.slice(this.startIndex, endIndex);

		this.viewport.innerHTML = '';
		this.viewport.style.transform = `translateY(${this.startIndex * this.itemHeight}px)`;

		visibleItems.forEach((item, index) => {
			const element = this.renderItem(item, this.startIndex + index);
			this.viewport.appendChild(element);
		});
	}

	attachScrollListener() {
		const handleScroll = throttle(() => {
			const scrollTop = this.container.scrollTop;
			const newStartIndex = Math.floor(scrollTop / this.itemHeight);

			if (newStartIndex !== this.startIndex) {
				this.startIndex = newStartIndex;
				this.render();
			}
		}, 16); // ~60fps

		this.container.addEventListener('scroll', handleScroll);
	}

	update(newItems) {
		this.items = newItems;
		this.wrapper.style.height = `${this.items.length * this.itemHeight}px`;
		this.render();
	}
}

// Batch processor for handling large datasets in chunks
export async function processBatch(items, processor, batchSize = 50, onProgress = null) {
	const results = [];
	const totalBatches = Math.ceil(items.length / batchSize);

	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);
		const batchResults = await processor(batch);
		results.push(...batchResults);

		if (onProgress) {
			const currentBatch = Math.floor(i / batchSize) + 1;
			onProgress(currentBatch, totalBatches, results.length);
		}

		// Yield to main thread
		await new Promise(resolve => setTimeout(resolve, 0));
	}

	return results;
}

// Memory-efficient file reader with progress
export function readFileWithProgress(file, onProgress) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onprogress = (e) => {
			if (e.lengthComputable && onProgress) {
				const percentComplete = (e.loaded / e.total) * 100;
				onProgress(percentComplete);
			}
		};

		reader.onload = (e) => {
			resolve(e.target.result);
		};

		reader.onerror = (e) => {
			reject(new Error('File read error'));
		};

		reader.readAsText(file);
	});
}

// Lazy loader for progressive rendering
export class LazyLoader {
	constructor(threshold = 500) {
		this.threshold = threshold;
		this.shouldUseLazy = false;
	}

	shouldUseLazyLoading(itemCount) {
		return itemCount > this.threshold;
	}

	async loadInChunks(items, chunkSize, processor) {
		const chunks = [];
		for (let i = 0; i < items.length; i += chunkSize) {
			chunks.push(items.slice(i, i + chunkSize));
		}

		const results = [];
		for (const chunk of chunks) {
			const chunkResults = await processor(chunk);
			results.push(...chunkResults);
			// Allow UI to update
			await new Promise(resolve => requestAnimationFrame(resolve));
		}

		return results;
	}
}
