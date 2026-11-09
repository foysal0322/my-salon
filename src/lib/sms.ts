/**
 * Bulk SMS BD Client
 * Documentation: http://bulksmsbd.net
 * Approved OTP format: "Your {Brand/Company Name} OTP is XXXX"
 */

const BULKSMSBD_API_KEY = process.env.BULKSMSBD_API_KEY || "6zssQL0HVDAsHHX5PSwW";
const BULKSMSBD_SENDER_ID = process.env.BULKSMSBD_SENDER_ID || "8809648910616";
const BULKSMSBD_API_URL = "http://bulksmsbd.net/api/smsapi";

export interface SendSmsResult {
  success: boolean;
  responseCode?: number;
  message?: string;
  error?: string;
}

/**
 * Normalizes any Bangladesh phone format (01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX)
 * to Bulk SMS BD requirement: 8801XXXXXXXXX
 */
export function formatBdPhoneForSms(rawPhone: string): string {
  let cleaned = String(rawPhone || "").trim().replace(/\D/g, "");
  if (cleaned.startsWith("880")) {
    return cleaned;
  }
  if (cleaned.startsWith("0")) {
    return `88${cleaned}`;
  }
  return `880${cleaned}`;
}

/**
 * Sends OTP SMS via Bulk SMS BD gateway
 * @param rawPhone e.g. "01711223344"
 * @param otpCode 6-digit or 4-digit code e.g. "123456"
 */
export async function sendOtpSms(rawPhone: string, otpCode: string): Promise<SendSmsResult> {
  const formattedNumber = formatBdPhoneForSms(rawPhone);
  const smsBody = `Your AmarSalon OTP is ${otpCode}`;

  const queryParams = new URLSearchParams({
    api_key: BULKSMSBD_API_KEY,
    type: "text",
    number: formattedNumber,
    senderid: BULKSMSBD_SENDER_ID,
    message: smsBody,
  });

  const url = `${BULKSMSBD_API_URL}?${queryParams.toString()}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json().catch(() => null);

    if (data && (data.response_code === 202 || data.response_code === "202")) {
      return {
        success: true,
        responseCode: 202,
        message: data.success_message || "SMS Submitted Successfully",
      };
    }

    return {
      success: false,
      responseCode: data?.response_code,
      error: data?.error_message || "SMS delivery unconfirmed",
    };
  } catch (error: any) {
    console.error("[BulkSMSBD] Failed to send SMS:", error?.message || error);
    return {
      success: false,
      error: error?.name === "AbortError" ? "SMS Gateway timed out" : error?.message || "SMS send failed",
    };
  }
}

