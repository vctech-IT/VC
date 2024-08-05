// src/lib/emailService.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'shubhamrane190@gmail.com',
    pass: 'srux wqpj mmte dexb'
  }
});

export async function sendAdminNotification(pendingUsers: any[], to_email: string, admin: string) {
  try {
    const userRows = pendingUsers.map(user => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${user.username}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${user.email}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${user.role.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">
          <a href="https://vc-tech.vercel.app/api/approve-user?userId=${user.id}&adminEmail=${to_email}" style="background-color: #4CAF50; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px; display: inline-block; margin-bottom: 5px;">Approve</a>
          <a href="https://vc-tech.vercel.app/api/decline-user?userId=${user.id}&adminEmail=${to_email}" style="background-color: #f44336; color: white; padding: 8px 12px; text-decoration: none; border-radius: 4px; display: inline-block;">Decline</a>
        </td>
      </tr>
    `).join('');

    await transporter.sendMail({
      from: '"VC Tech" <noreply@vctech.com>',
      to: to_email,
      subject: "Pending User Approvals - Action Required",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pending User Approvals</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #4a90e2; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Pending User Approvals</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Hello ${admin},</p>
                    <p>We have new user registration requests that require your attention. Please review the following users:</p>
                    <div style="overflow-x: auto;">
                      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <thead>
                          <tr style="background-color: #f2f2f2;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Username</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Email</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Role</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${userRows}
                        </tbody>
                      </table>
                    </div>
                    <p style="margin-top: 20px;">You can approve or decline users directly by clicking the respective buttons above. This action can be performed on your mobile device as well.</p>
                    <p>If you need more information before making a decision, please log in to the admin dashboard for full user details.</p>
                    <a href="https://vc-tech.vercel.app/admin" style="display: inline-block; padding: 10px 20px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">View Admin Dashboard</a>
                    <p style="margin-top: 20px;">If you have any questions or concerns, please don't hesitate to contact the IT support team.</p>
                    <p>Best regards,<br>Your VC Tech Team</p>
                </div>
                <div style="background-color: #f8f8f8; padding: 10px 20px; font-size: 12px; color: #666; text-align: center;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `
    });
    console.log('Admin notification sent successfully to', to_email);
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}

export async function sendUserApprovalNotification(userEmail: string, username: string) {
  try {
    await transporter.sendMail({
      from: '"VC Tech" <noreply@vctech.com>',
      to: userEmail,
      subject: "Welcome to VC Tech - Your Account Has Been Approved!",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #2ecc71; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Welcome to VC Tech!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Dear ${username},</p>
                    <p>Great news! Your account has been approved and is now active. We're thrilled to have you join our community.</p>
                    <h2 style="color: #2ecc71;">Next Steps:</h2>
                    <ol>
                        <li>Log in to your account</li>
                        <li>Complete your profile information</li>
                        <li>Explore the features and tools available to you</li>
                        <li>Connect with other users and start collaborating</li>
                    </ol>
                    <p>If you have any questions or need assistance getting started, our support team is here to help.</p>
                    <a href="https://vc-tech.vercel.app/login" style="display: inline-block; padding: 10px 20px; background-color: #2ecc71; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Log In Now</a>
                    <p style="margin-top: 20px;">We're excited to see what you'll achieve with our platform!</p>
                    <p>Best regards,<br>The VC Tech Team</p>
                </div>
                <div style="background-color: #f8f8f8; padding: 10px 20px; font-size: 12px; color: #666; text-align: center;">
                    <p>This email was sent to ${userEmail}. If you didn't request this approval, please contact our support team immediately.</p>
                </div>
            </div>
        </body>
        </html>
      `
    });
    console.log('User approval notification sent successfully to', userEmail);
  } catch (error) {
    console.error('Error sending user approval notification:', error);
  }
}