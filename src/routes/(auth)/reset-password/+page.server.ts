import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/database';
import bcrypt from 'bcrypt';

export const actions: Actions = {
resetPassword: async ({ request }) => {
  console.log('Reset password action started');
  try {
    const data = await request.formData();
    const token = data.get('token');
    const password = data.get('password');

    console.log('Token:', token);
    console.log('Password received:', password ? '[REDACTED]' : 'No password');

    if (typeof token !== 'string' || !token || typeof password !== 'string' || !password) {
      console.log('Invalid token or password');
      return fail(400, { error: 'Invalid token or password' });
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      console.log('Invalid or expired reset token');
      return fail(400, { error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed');

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    console.log('User updated successfully');
    redirect(302, '/login');
  } catch (error) {
    console.error('Error in resetPassword action:', error);
    return fail(500, { error: 'An unexpected error occurred' });
  }
}
};