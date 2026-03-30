import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

// This is a placeholder for the Gmail integration.
// To make this work, you need to:
// 1. Set up a Google Cloud Project with Gmail API enabled.
// 2. Create a Service Account or OAuth 2.0 Client ID.
// 3. Store credentials in environment variables.

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

export async function syncGmailMessages() {
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
        console.warn('Gmail credentials not configured. Skipping sync.');
        return;
    }

    const oAuth2Client = new google.auth.OAuth2(
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REDIRECT_URI
    );

    oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    try {
        // 1. List messages
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread', // Or filter by label, e.g., 'label:SUPPORT'
        });

        const messages = res.data.messages;
        if (!messages || messages.length === 0) {
            console.log('No new messages found.');
            return;
        }

        for (const message of messages) {
            // 2. Get message details
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
            });

            const headers = msg.data.payload?.headers;
            const subject = headers?.find(h => h.name === 'Subject')?.value;
            const from = headers?.find(h => h.name === 'From')?.value;
            const to = headers?.find(h => h.name === 'To')?.value;
            const date = headers?.find(h => h.name === 'Date')?.value;

            // Extract email address from 'From' header (e.g., "Name <email@example.com>")
            const emailMatch = from?.match(/<(.+)>/);
            const senderEmail = emailMatch ? emailMatch[1] : from;

            if (!senderEmail) continue;

            // 3. Find customer by email
            const customer = await prisma.customer.findFirst({
                where: { email: senderEmail }
            });

            if (customer) {
                // 4. Save email to database
                await prisma.emailMessage.create({
                    data: {
                        customerId: customer.id,
                        gmailId: message.id,
                        subject: subject,
                        content: msg.data.snippet || '', // In reality, parse payload.body
                        snippet: msg.data.snippet,
                        from: from || '',
                        to: to || '',
                        receivedAt: date ? new Date(date) : new Date(),
                        isInternal: false,
                    }
                });

                // 5. Optional: Create or update ticket
                // Check if subject contains a ticket ID, etc.
            }
        }
    } catch (error) {
        console.error('Error syncing Gmail:', error);
    }
}
