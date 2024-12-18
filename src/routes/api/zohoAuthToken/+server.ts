// src/routes/api/zoho-token/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const REFRESH_TOKEN = process.env.VITE_ZOHO_REFRESH_TOKEN;
const CLIENT_ID = process.meta.env.VITE_ZOHO_CLIENT_ID;
const CLIENT_SECRET = process.meta.env.VITE_ZOHO_CLIENT_SECRET;
const REDIRECT_URI = process.meta.env.VITE_ZOHO_REDIRECT_URI;

let authToken: string | null = null;
let tokenExpiry = 0;

interface TokenResponse {
    access_token: string;
    expires_in: number;
}

async function refreshToken(): Promise<void> {
    const response = await fetch('https://accounts.zoho.in/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            refresh_token: REFRESH_TOKEN,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'refresh_token'
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: TokenResponse = await response.json();
    authToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000);
}

export const GET: RequestHandler = async () => {
    // If token is expired or will expire in the next 5 minutes, refresh it
    if (!authToken || Date.now() > tokenExpiry - 300000) {
        await refreshToken();
    }

    return json({ token: authToken });
};
