// src/routes/verify/+page.server.ts
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/database';

export const load: PageServerLoad = async ({ url }) => {
  const token = url.searchParams.get('token');

  if (!token) {
    throw redirect(302, '/');
  }

  const user = await db.user.findFirst({
    where: { verificationToken: token }
  });

  if (user) {
    await db.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null }
    });

    // Redirect to login page with a success message
    throw redirect(302, '/login?verified=true');
  } else {
    // Invalid or expired token
    throw redirect(302, '/login?error=invalid_token');
  }
};