export interface Toast {
	id: number;
	message: string;
	type: 'error' | 'success';
}

const DISMISS_AFTER_MS = 6000;

let nextId = 1;

export const toasts = $state<Toast[]>([]);

export function addToast(message: string, type: Toast['type'] = 'error'): void {
	const id = nextId++;
	toasts.push({ id, message, type });
	setTimeout(() => dismissToast(id), DISMISS_AFTER_MS);
}

export function dismissToast(id: number): void {
	const index = toasts.findIndex((t) => t.id === id);
	if (index !== -1) {
		toasts.splice(index, 1);
	}
}
