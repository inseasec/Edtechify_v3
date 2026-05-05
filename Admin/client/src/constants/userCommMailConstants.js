/** Mask returned by API for saved secrets; same as Authentication / SMTP UI. */
export const USER_COMM_MASK = '********'

export const DEFAULT_SMTP_INSTRUCTIONS = `1. Use a real mailbox you control (example: Gmail). The app will send OTP emails from this account.

2. Open Google Account settings:
   https://myaccount.google.com/
   Sign in with the same Gmail you want to use.

3. Turn ON 2‑Step Verification (required for App Password):
   - Click Security (left menu)
   - Under “How you sign in to Google” → 2‑Step Verification
   - Click Get started → complete setup (phone / authenticator)

4. Create an App Password (this becomes USER_MAIL_PASSWORD):
   https://myaccount.google.com/apppasswords
   - Select app → Mail
   - Select device → Other (Custom name) → type “Rankwell OTP”
   - Generate → copy the 16‑character password (may include spaces)
   - Paste into USER_MAIL_PASSWORD (not your normal Gmail password)

5. Recommended Gmail settings:
   - USER_MAIL_HOST: smtp.gmail.com
   - USER_MAIL_PORT: 587 (STARTTLS)
   - USER_MAIL_USERNAME: your full email address
   - USER_MAIL_SMTP_AUTH: true
   - USER_MAIL_SMTP_STARTTLS: true

Notes:
- If USER_MAIL_PASSWORD shows ********, it is already saved — paste a new value only when you want to rotate it.
- For corporate SMTP (Microsoft 365, SendGrid, SES, etc.), use the provider’s SMTP host/port and an app password / API key (as SMTP password).`
