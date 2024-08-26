import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions } from './$types';
import { db } from '$lib/database';
import bcrypt from 'bcrypt';

const resetPassword: Action = async ({ request }) => {
  const data = await request.formData();
  const token = data.get('token');
  const password = data.get('password');

  if (typeof token !== 'string' || !token || typeof password !== 'string' || !password) {
    return fail(400, { error: 'Invalid token or password' });
  }

  const user = await db.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() }
    }
  });

  if (!user) {
    return fail(400, { error: 'Invalid or expired reset token' });
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

  return { success: true };
};

export const actions: Actions = { resetPassword };