// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			    user: {
					name: string
					role: string
					email: string
					id: string
					createdAt: Date
					phoneNo: string
					image: string
				}
			}
		interface PageData {
			user:
			{
				id: string;
				name: string;
				email: string;
				createdAt: Date;
				role: string;
				status: string
				image: string;
			}
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
