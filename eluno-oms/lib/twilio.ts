import "server-only";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export async function sendWhatsAppAlert(to: string, message: string) {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: message,
    });
    return true;
  } catch (error) {
    console.error("WhatsApp send failed:", error);
    return false;
  }
}
