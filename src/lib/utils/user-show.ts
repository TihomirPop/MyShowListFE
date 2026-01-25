import { Status } from '$lib/types/user-show';

/**
 * Get display label for status (capitalize first letter)
 */
export function getStatusLabel(status: string): string {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Get all status options for dropdown
 */
export function getAllStatusOptions(): Array<{ value: Status; label: string }> {
	return [
		{ value: Status.WATCHING, label: 'Watching' },
		{ value: Status.COMPLETED, label: 'Completed' },
		{ value: Status.ON_HOLD, label: 'On Hold' },
		{ value: Status.DROPPED, label: 'Dropped' },
		{ value: Status.PLAN_TO_WATCH, label: 'Plan to Watch' }
	];
}

/**
 * Format progress display as {current}/{total}
 */
export function formatProgress(current: number, total: number | null): string {
	const totalDisplay = total ?? '?';
	return `${current}/${totalDisplay}`;
}

/**
 * Validate progress input (must be >= 0 and <= episode count)
 */
export function validateProgress(
	value: string,
	episodeCount: number | null
): { valid: boolean; error?: string; progress?: number } {
	const parsed = parseInt(value, 10);

	if (isNaN(parsed)) {
		return { valid: false, error: 'Progress must be a number' };
	}

	if (parsed < 0) {
		return { valid: false, error: 'Progress cannot be negative' };
	}

	if (episodeCount !== null && parsed > episodeCount) {
		return { valid: false, error: `Progress cannot exceed ${episodeCount} episodes` };
	}

	return { valid: true, progress: parsed };
}

/**
 * Get progress display with icon based on show type
 */
export function getProgressDisplay(userShow: import('$lib/types/user-show').UserShowDto): string {
	const show = userShow.show;
	const icon = show.type === 'MOVIE' ? '🎬' : '📺';

	if (show.type === 'MOVIE') {
		return `${icon} ${userShow.progress}/1`;
	}

	const total = show.episodeCount ?? '?';
	return `${icon} ${userShow.progress}/${total}`;
}

/**
 * Get status badge color scheme
 */
export function getStatusColor(status: string): { bg: string; text: string } {
	const colors: Record<string, { bg: string; text: string }> = {
		'watching': { bg: '#667eea', text: 'white' },
		'completed': { bg: '#48bb78', text: 'white' },
		'on hold': { bg: '#ed8936', text: 'white' },
		'dropped': { bg: '#f56565', text: 'white' },
		'plan to watch': { bg: '#4299e1', text: 'white' }
	};
	return colors[status] || { bg: '#718096', text: 'white' };
}
