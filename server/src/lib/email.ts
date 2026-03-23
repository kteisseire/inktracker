import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'GlimmerLog <onboarding@resend.dev>';

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not set — password reset email not sent');
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Réinitialisation de votre mot de passe GlimmerLog',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
        <h2 style="color: #1a1a2e; margin-bottom: 16px;">Réinitialisation du mot de passe</h2>
        <p style="color: #444; line-height: 1.6;">
          Vous avez demandé la réinitialisation de votre mot de passe GlimmerLog.
          Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #d4a843; color: #1a1a2e; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #888; font-size: 13px; line-height: 1.5;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 11px;">GlimmerLog — Suivi de tournois Lorcana</p>
      </div>
    `,
  });
}
