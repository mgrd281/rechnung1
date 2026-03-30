
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Mock a minimal InvoiceData for the test
const invoiceData = {
    number: "3691",
    customerName: "Laron Falck",
    totalGross: "79.99"
};

async function sendTest() {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'mgrdegh90@gmail.com',
            pass: 'cufejnngkgfovcuj'
        }
    });

    // We need a PDF buffer. We can't easily generate it here due to TS/ESM issues,
    // but we can try to find an existing test PDF or just send a dummy one for now to check connectivity.
    // Wait, I want to send the ACTUAL generated PDF.

    console.log('Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified');

    const mailOptions = {
        from: '"KARINEX" <mgrdegh90@gmail.com>',
        to: 'mgrdegh@gmx.de',
        subject: 'TEST: KARINEX Invoice #3691 - Design Verify',
        text: 'Dies ist ein Test der neuen Rechnungs-Vorlage. Bitte prüfen Sie den Anhang.',
        html: '<b>Dies ist ein Test der neuen Rechnungs-Vorlage.</b><br>Bitte prüfen Sie den Anhang.'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent: ' + info.messageId);
}

sendTest().catch(console.error);
