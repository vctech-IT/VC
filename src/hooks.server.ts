import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/database';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const handle: Handle = async ({ event, resolve }) => {
  const session = event.cookies.get('session');

  if (!session) {
    return await resolve(event);
  }

  const user = await db.user.findUnique({
    where: { userAuthToken: session },
    select: { 
      id: true, 
      username: true, 
      email: true, 
      phoneNo: true,
      role: { select: { name: true } },
      createdAt: true,
      image: true,
      lastActivity: true
    }
  });

  if (user) {
    const now = new Date();
    const lastActivity = user.lastActivity ? new Date(user.lastActivity) : null;

    if (!lastActivity || now.getTime() - lastActivity.getTime() > SESSION_TIMEOUT) {
      // User has timed out, log them out
      await db.user.update({
        where: { id: user.id },
        data: { lastLogout: now }
      });
      event.cookies.set('session', '', {
        path: '/',
        expires: new Date(0),
      });
    } else {
      // User is active, update their session
      event.locals.user = {
        id: user.id,
        name: user.username,
        email: user.email,
        phoneNo: user.phoneNo,
        role: user.role.name,
        createdAt: user.createdAt,
        image: user.image,
        lastActivity: lastActivity
      };

      await db.user.update({
        where: { id: user.id },
        data: { lastActivity: now }
      });
    }
  }

  return await resolve(event);
};