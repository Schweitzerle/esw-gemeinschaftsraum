export interface RateLimiterOptions {
	/** Maximale Anzahl Anfragen pro Fenster */
	limit: number;
	/** Fensterlänge in Millisekunden */
	windowMs: number;
}

export interface RateLimiter {
	/** true = Anfrage erlaubt (und gezählt), false = Limit erreicht */
	check(key: string, nowMs?: number): boolean;
	/** Entfernt abgelaufene Einträge (gelegentlich aufrufen) */
	prune(nowMs?: number): void;
	size(): number;
}

/** Einfacher In-Memory-Rate-Limiter (Sliding Window). Reicht für einen Prozess. */
export function createRateLimiter({ limit, windowMs }: RateLimiterOptions): RateLimiter {
	const hits = new Map<string, number[]>();

	return {
		check(key: string, nowMs: number = Date.now()): boolean {
			const cutoff = nowMs - windowMs;
			const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
			if (recent.length >= limit) {
				hits.set(key, recent);
				return false;
			}
			hits.set(key, [...recent, nowMs]);
			return true;
		},
		prune(nowMs: number = Date.now()): void {
			const cutoff = nowMs - windowMs;
			for (const [key, timestamps] of hits) {
				const recent = timestamps.filter((t) => t > cutoff);
				if (recent.length === 0) {
					hits.delete(key);
				} else {
					hits.set(key, recent);
				}
			}
		},
		size(): number {
			return hits.size;
		}
	};
}
