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

async function fetchAllSalesOrders(fetch: typeof globalThis.fetch, token: string): Promise<SalesOrder[]> {
    let allOrders: SalesOrder[] = [];
    let page = 1;
    const per_page = 200; // You can adjust this value
    let hasMorePage = true;

    while (hasMorePage) {
        const response = await fetch(`https://www.zohoapis.in/books/v3/salesorders?organization_id=60005679410&page=${page}&per_page=${per_page}`, {
            headers: {
                'Authorization': `Zoho-oauthtoken ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ZohoResponse = await response.json();
        allOrders = [...allOrders, ...data.salesorders];
        hasMorePage = data.page_context.has_more_page;
        page++;
    }

    return allOrders;
}

export const load: PageServerLoad = async ({ fetch, locals }) => {
    if (!locals.user) {
        throw redirect(302, '/login');
    }
    
    const token = await getToken(fetch);
    const orders = await fetchAllSalesOrders(fetch, token);

    return {
        orders,
    };
};