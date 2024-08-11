import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function sendWhatsAppNotification(pendingUsers, adminPhoneNumber: string, adminUsername: string, adminEmail: string) {
  const message = `
    Hello ${adminUsername},

    You have a new user approval request.

    User Details:
    - Name: ${pendingUsers.username}
    - id : ${pendingUsers.id}
    - Email: ${pendingUsers.email}
    - Mobile: ${pendingUsers.phoneNo}
    - Role: ${pendingUsers.role.name}
  `;

  try {
    const twilioMessage = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+91${adminPhoneNumber}`,
      body: message.trim(),
    });

    console.log(`WhatsApp message sent to ${adminUsername}: ${twilioMessage.sid}`);
    return twilioMessage;
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${adminUsername}:`, error);
    throw error;
  }
}

export async function sendUserApprovalNotification(userPhoneNumber: string, username: string) {
  const message = `Hello ${username}, your account has been approved! You can now log in and start using the platform.`;

  try {
    const twilioMessage = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:+91${userPhoneNumber}`,
      body: message
    });

    console.log(`Approval WhatsApp message sent to ${username}: ${twilioMessage.sid}`);
    return twilioMessage;
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${username}:`, error);
    throw error;
  }
}
