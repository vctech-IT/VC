import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ cookies }) => {
  const session = cookies.get('session');

  if (session) {
    // Update last logout time
    await db.user.updateMany({
      where: { userAuthToken: session },
      data: { lastLogout: new Date() }
    });

    // Clear the session cookie
    cookies.set('session', '', {
      path: '/',
      expires: new Date(0),
    });
  }

  return json({ success: true });
};