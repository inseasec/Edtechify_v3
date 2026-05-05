export const DEFAULT_TWILIO_INSTRUCTIONS = `1. Create a Twilio account (or sign in):
   https://www.twilio.com/try-twilio

2. Open Twilio Console Dashboard:
   https://console.twilio.com/

3. Get Account SID + Auth Token:
   - In Console, find “Account Info”
   - Copy Account SID → USER_TWILIO_ACCOUNT_SID
   - Reveal/copy Auth Token → USER_TWILIO_AUTH_TOKEN

4. Get a Twilio phone number (this becomes USER_TWILIO_FROM_NUMBER):
   - Console → Phone Numbers → Manage → Buy a number
   - Choose SMS-capable number → buy
   - Use full E.164 format (example: +12184004870)

5. Country code default (optional):
   - USER_TWILIO_DEFAULT_COUNTRY_CODE: +91 (or your default)

Notes:
- For trial accounts, you may need to verify recipient numbers in Twilio before sending SMS.
- If USER_TWILIO_AUTH_TOKEN shows ********, it is already saved — paste a new value only when you want to rotate it.`
