export function validateThumbnailUrl(url: string): string | null {
	if (!url.trim()) {
		return 'Thumbnail URL is required';
	}

	if (url.length > 2048) {
		return 'Thumbnail URL must be less than 2048 characters';
	}

	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return 'Thumbnail URL must use HTTP or HTTPS protocol';
		}
	} catch {
		return 'Invalid URL format';
	}

	return null; // Valid
}
