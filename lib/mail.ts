import { Resend } from "resend";

export async function emailOwner(subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_EMAIL;
  if (!apiKey || !to) return false;
  const from = process.env.RESEND_FROM || "The Library <onboarding@resend.dev>";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) {
    console.error("Resend failed", error);
    return false;
  }
  return true;
}
