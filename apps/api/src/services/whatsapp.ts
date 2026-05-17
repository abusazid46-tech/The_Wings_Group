import { env } from "../config/env.js";

type SendWhatsAppTextInput = {
  phone: string;
  message: string;
};

export type WhatsAppSendResult = {
  sent: boolean;
  status: "SENT" | "QUEUED" | "FAILED";
  whatsappUrl: string;
  providerMessageId?: string;
  providerResponse?: unknown;
  message: string;
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

export function createWhatsAppUrl(phone: string, message: string) {
  return `https://wa.me/91${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppText({ phone, message }: SendWhatsAppTextInput): Promise<WhatsAppSendResult> {
  const cleanPhone = normalizePhone(phone);
  const whatsappUrl = createWhatsAppUrl(cleanPhone, message);

  if (!env.WHATSAPP_PHONE_NUMBER_ID || !env.WHATSAPP_ACCESS_TOKEN) {
    return {
      sent: false,
      status: "QUEUED",
      whatsappUrl,
      message: "WhatsApp Cloud API credentials are not configured. Open the fallback link to send manually."
    };
  }

  const response = await fetch(`https://graph.facebook.com/${env.WHATSAPP_GRAPH_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: `91${cleanPhone}`,
      type: "text",
      text: {
        preview_url: false,
        body: message
      }
    })
  });

  const providerResponse = (await response.json().catch(() => null)) as
    | { messages?: Array<{ id?: string }>; error?: { message?: string } }
    | null;

  if (!response.ok) {
    return {
      sent: false,
      status: "FAILED",
      whatsappUrl,
      providerResponse,
      message: providerResponse?.error?.message ?? "WhatsApp Cloud API request failed."
    };
  }

  return {
    sent: true,
    status: "SENT",
    whatsappUrl,
    providerMessageId: providerResponse?.messages?.[0]?.id,
    providerResponse,
    message: "WhatsApp message sent."
  };
}
