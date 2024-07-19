import { fail } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import type { Actions } from '../../$types';
import { db } from '$lib/database';

export const actions: Actions = {
  resetPassword: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const verificationCode = data.get('verificationCode');
    const newPassword = data.get('newPassword');
    const confirmPassword = data.get('confirmPassword');

    if (
      typeof email !== 'string' ||
      typeof verificationCode !== 'string' ||
      typeof newPassword !== 'string' ||
      typeof confirmPassword !== 'string'
    ) {
      return fail(400, { error: 'Invalid input' });
    }

    if (newPassword !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return fail(400, { error: 'User not found' });
    }

    // Here, you should implement a proper verification code check
    // This is just a placeholder
    if (verificationCode !== '123456') {
      return fail(400, { error: 'Invalid verification code' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { email },
      data: { passwordHash },
    });

    return { success: true };
  },
};