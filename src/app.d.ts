// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			/** true, wenn ein gültiges Session-Cookie vorliegt */
			authenticated: boolean;
		}
		interface PageState {
			/** Eintrag-Detail als Dialog (Shallow Routing von der Startseite) */
			detail?: {
				booking: {
					id: number;
					title: string;
					description: string | null;
					name: string;
					contact: string;
					isPublic: boolean;
					openEnd: boolean;
					startsAt: number;
					endsAt: number;
					createdAt: number;
				};
				weekDate: string;
				justSaved: boolean;
			};
		}
	}
}

export {};
