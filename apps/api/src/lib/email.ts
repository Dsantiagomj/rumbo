import { Resend } from 'resend';

export function createResendClient(apiKey: string) {
  return new Resend(apiKey);
}

export async function sendVerificationEmail(resend: Resend, from: string, to: string, url: string) {
  await resend.emails.send({
    from,
    to,
    subject: 'Verify your email — Rumbo',
    html: `
      <h2>Welcome to Rumbo!</h2>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${url}">Verify Email</a></p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
}

export async function sendResetPasswordEmail(
  resend: Resend,
  from: string,
  to: string,
  url: string,
) {
  await resend.emails.send({
    from,
    to,
    subject: 'Reset your password — Rumbo',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <p><a href="${url}">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}
