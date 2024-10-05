import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/database';
import bcrypt from 'bcrypt';

export const actions: Actions = {
  resetPassword: async ({ request }) => {
    const data = await request.formData();
    const token = data.get('token');
    const password = data.get('password');
    const confirmPassword = data.get('confirmPassword');

    if (!token || typeof token !== 'string') {
      return fail(400, { error: 'Invalid reset token.' });
    }

    if (!password || !confirmPassword || password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match.' });
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return fail(400, { error: 'Invalid or expired reset token.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    throw redirect(302, '/login?reset=success');
  }
};