import { fail, redirect } from '@sveltejs/kit'
import type { Action, Actions, PageServerLoad } from './$types'
import bcrypt from 'bcrypt'
import { db } from '$lib/database'
import nodemailer from 'nodemailer';

// // using an enum for user roles to avoid typos
// // if you're not using TypeScript use an object
enum Roles {
  ADMIN = 'ADMIN',
  USER = 'USER',
  OPERATION = 'OPERATION',
  WAREHOUSE = 'WAREHOUSE',
  MATERIALPROCURE = 'MATERIALPROCURE',
  ACCOUNTANT = 'ACCOUNTANT',
  MANAGER = 'MANAGER'
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'shubhamrane190@gmail.com',
    pass: 'srux wqpj mmte dexb'
  }
});

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
    redirect(302, '/')
  }
}

//fetching the data of the reg form
const register: Action = async ({ request }) => {
  const data = await request.formData()
  const username = data.get('username')
  const password = data.get('password')
  const email = data.get('email')
  const phone = data.get('phoneNo')
  const role = data.get('role')

  // Server-side validation functions
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return re.test(email);
  }
    

//mention the fields
  if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      typeof email !== 'string' ||
      typeof phone !== 'string' ||
      typeof role !== 'string' ||
      !username ||
      !password ||
      !email ||
      !phone ||
      !role ||
      !(role in Roles) ||
      !validateEmail(email)
  ) {
    return fail(400, { invalid: true })
  }

  const user = await db.user.findUnique({
    where: { username },
  })
    
    const emailid = await db.user.findUnique({
        where: { email },
    })

    const phoneno = await db.user.findUnique({
        where: { phoneNo: phone },
    })
    
    
    //cheking if user exist

  if (user) {
    return fail(400, { user: true })
    }

    if (emailid) {
        return fail(400, { emailid: true })
    }

    if (phoneno) {
        return fail(400, { phoneno: true })
  }
  
  const verificationToken = crypto.randomUUID();

    //creating the user in db
  await db.user.create({
    data: {
      username,
      passwordHash: await bcrypt.hash(password, 10),
      email,
      phoneNo: phone,

      userAuthToken: crypto.randomUUID(),
      role: { connect: { name: role as Roles } },
      isVerified: false,
      verificationToken,
    },
  })

  // Send verification email
  try {
    await transporter.sendMail({
      from: '"VC Technologies" <noreply@vctechnologies.com>',
      to: email,
      subject: "Verify Your Email Address",
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
            <td align="center" bgcolor="#ffffff" style="padding: 40px 0;">
                <img src="https://i.ibb.co/x2j5Ck6/vc2-Photoroom.png" alt="VC Technologies Logo" width="200" style="display: block;">
            </td>
        </tr>
        <tr>
            <td style="padding: 40px 30px;">
                <h1 style="color: #007bff; margin-bottom: 20px;">Verify Your Email Address</h1>
                <p style="font-size: 16px; line-height: 1.6; color: #333333; margin-bottom: 20px;">Hello ${username},</p>
                <p style="font-size: 16px; line-height: 1.6; color: #333333; margin-bottom: 20px;">Thank you for registering with VC Technologies. To complete your registration and verify your email address, please click the button below:</p>
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
                    <tr>
                        <td align="center">
                            <a href="https://vc-tech.vercel.app/verify?token=${verificationToken}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">Verify Email</a>
                        </td>
                    </tr>
                </table>
                <p style="font-size: 16px; line-height: 1.6; color: #333333; margin-bottom: 20px;">If you didn't create an account with us, you can safely ignore this email.</p>
                <p style="font-size: 16px; line-height: 1.6; color: #333333; margin-bottom: 20px;">This link will expire in 24 hours for security reasons.</p>
                <p style="font-size: 14px; line-height: 1.6; color: #666666;">If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
                <p style="font-size: 14px; line-height: 1.6; color: #007bff;">https://vc-tech.vercel.app/verify?token=${verificationToken}</p>
            </td>
        </tr>
        <tr>
            <td align="center" bgcolor="#f4f4f4" style="padding: 20px 0;">
                <p style="font-size: 12px; color: #888888;">&copy; 2024 VC Technologies. All rights reserved.</p>
                <p style="font-size: 12px; color: #888888;">Navi Mumbai, Maharashtra, Mumbai, IN</p>
            </td>
        </tr>
    </table>
</body>
</html>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return fail(500, { emailError: true });
  }


  return { success: true, message: 'Registration successful. Please check your email to verify your account.' };
}

export const actions: Actions = { register }