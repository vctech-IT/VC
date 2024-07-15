import type { PageServerLoad } from './$types';
import type { SalesOrder } from '$lib/types';
import { redirect } from '@sveltejs/kit'

interface ZohoResponse {
    salesorders: SalesOrder[];
    page_context: {
        page: number;
        per_page: number;
        has_more_page: boolean;
        report_name: string;
        applied_filter: string;
        sort_column: string;
        sort_order: string;
    };
}

async function getToken(fetch: typeof globalThis.fetch): Promise<string> {
    const tokenResponse = await fetch('/api/zohoAuthToken');
    const { token } = await tokenResponse.json();
    return token;
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
        // redirect user if not logged in
        if (!locals.user) {
            throw redirect(302, new URL('/login', 'http://localhost:5173').toString());
    }
    
         if (!locals.user) {
            throw redirect(302, new URL('/login', 'https://vc-tech.vercel.app/').toString());
    }
    
    const token = await getToken(fetch);

    const response = await fetch(`https://www.zohoapis.in/books/v3/salesorders?organization_id=60005679410`, {
        headers: {
            'Authorization': `Zoho-oauthtoken ${token}`
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ZohoResponse = await response.json();

    return {
        orders: data.salesorders,
    };
};