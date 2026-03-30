
export const DEFAULT_HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
  
  * { box-sizing: border-box; }
  body { 
    font-family: 'Inter', sans-serif; 
    margin: 0; 
    padding: 0; 
    color: #1a1a1a; 
    line-height: 1.4;
    font-size: 11px;
    background: white;
  }
  
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    margin: auto;
    position: relative;
  }

  .header { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 25mm; 
    align-items: flex-start;
  }
  
  .logo-container {
    display: flex;
    flex-direction: column;
  }

  .logo-bar { 
    background: #5B8272; 
    color: white; 
    padding: 12px 24px; 
    font-weight: 700; 
    font-size: 26px; 
    text-transform: uppercase;
    letter-spacing: 1px;
    display: inline-block;
  }
  
  .sender-line-small { 
    font-size: 8px; 
    color: #777; 
    margin-top: 8px;
    border-bottom: 1px solid #eee;
    padding-bottom: 4px;
    width: fit-content;
  }
  
  .info-box { 
    background: #E8F3F1; 
    padding: 24px; 
    width: 65mm;
    border-radius: 2px;
  }
  
  .info-box h2 { 
    margin: 0 0 12px 0; 
    font-size: 16px; 
    font-weight: 700;
    color: #1a1a1a;
  }
  
  .info-row { 
    display: flex; 
    justify-content: space-between; 
    margin-bottom: 6px; 
  }
  
  .info-row span:first-child { color: #555; }
  .info-row span:last-child { font-weight: 600; }

  .recipient-container {
    margin-bottom: 25mm;
    width: 90mm;
  }
  
  .recipient-container h3 { 
    margin: 0 0 4px 0; 
    font-size: 13px; 
    font-weight: 700; 
  }
  
  .recipient-container p { 
    margin: 0; 
    font-size: 11px; 
    color: #333;
  }

  h1.document-title { 
    font-size: 34px; 
    font-weight: 700; 
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }
  
  .intro-text { 
    font-size: 11px; 
    margin-bottom: 25px; 
    color: #444;
  }

  /* Table Styling */
  .items-table-container {
      margin-bottom: 20mm;
  }
  
  table.items-table { 
    width: 100%; 
    border-collapse: collapse; 
  }
  
  table.items-table th { 
    background: #E8F3F1; 
    border-top: 1.5px solid #5B8272; 
    border-bottom: 1.5px solid #5B8272; 
    padding: 10px 8px; 
    text-align: left; 
    font-size: 10px; 
    font-weight: 700;
    color: #3C504B; 
    text-transform: uppercase;
  }
  
  table.items-table td { 
    padding: 12px 8px; 
    border-bottom: 1px solid #f0f0f0; 
    vertical-align: top;
  }

  .totals-section { 
    display: flex; 
    flex-direction: column; 
    align-items: flex-end; 
    margin-top: 10px;
  }
  
  .total-row { 
    display: flex; 
    justify-content: space-between; 
    width: 65mm; 
    padding: 6px 0;
  }
  
  .total-row.grand-total { 
    font-weight: 700; 
    font-size: 14px; 
    border-top: 1px solid #D0E0DE; 
    border-bottom: 1px solid #D0E0DE; 
    margin-top: 4px; 
    padding: 10px 0; 
    background: #fbfdfd;
  }

  /* Footer Styling */
  .footer { 
    position: absolute; 
    bottom: 0; 
    left: 0; 
    right: 0; 
    background: #E8F3F1; 
    padding: 10mm 20mm; 
    display: grid; 
    grid-template-columns: 1fr 1fr 1fr; 
    gap: 20mm; 
    font-size: 9px; 
    color: #3C504B; 
  }
  
  .footer-col h4 { margin: 0 0 6px 0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer-col p { margin: 2px 0; opacity: 0.8; }
  
  .tax-row {
      grid-column: span 3;
      margin-top: 15px;
      display: flex;
      gap: 40px;
      border-top: 1px solid rgba(91, 130, 114, 0.1);
      padding-top: 10px;
  }
  /* Addon Styles: Information Blocks */
  .addon-extra-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 25px;
    padding: 12px 0;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .addon-item h4 { 
    margin: 0 0 4px 0; 
    font-size: 9px; 
    text-transform: uppercase; 
    color: #777; 
    letter-spacing: 0.5px;
  }
  
  .addon-item p { 
    margin: 0; 
    font-size: 11px; 
    font-weight: 500;
  }

  /* Addon Styles: Payment Reminder Block */
  .addon-payment-details {
    margin-top: 30px;
    padding: 15px;
    background: #fbfdfd;
    border: 1px dashed #D0E0DE;
    border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    page-break-inside: avoid;
  }

  .addon-payment-text h4 { margin: 0 0 5px 0; color: #5B8272; font-size: 10px; }
  .addon-payment-text p { margin: 0; font-size: 10px; color: #444; line-height: 1.5; }

  .addon-qr-placeholder {
    width: 25mm;
    height: 25mm;
    background: #fff;
    border: 1px solid #eee;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: #ccc;
    text-align: center;
  }

</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo-container">
        <div class="logo-bar">{{logo_name}}</div>
        <div class="sender-line-small">{{sender_line}}</div>
      </div>
      <div class="info-box">
        <h2>Rechnung</h2>
        <div class="info-row"><span>Rechnungs-Nr.</span> <span>{{number}}</span></div>
        <div class="info-row"><span>Kunden-Nr.</span> <span>{{customer_number}}</span></div>
        <div class="info-row"><span>Datum</span> <span>{{date}}</span></div>
      </div>
    </div>

    <div class="recipient-container">
      <h3>{{customer_name}}</h3>
      <p>{{customer_address}}</p>
      <p>{{customer_zip}} {{customer_city}}</p>
      <p>{{customer_country}}</p>
    </div>

    <h1 class="document-title">{{title}}</h1>
    
    <!-- HIER EINFÜGEN: Extra Info Block -->
    <div class="addon-extra-info">
      <div class="addon-item">
        <h4>Lieferdatum / Leistungszeitraum</h4>
        <p>{{delivery_date}}</p>
      </div>
      <div class="addon-item">
        <h4>Zahlungsbedingungen</h4>
        <p>{{payment_terms}}</p>
      </div>
    </div>

    <p class="intro-text">{{body_text}}</p>

    <div class="items-table-container">
        {{items_table}}
    </div>

    <div class="totals-section">
      <div class="total-row"><span>Summe netto</span> <span>{{subtotal}} EUR</span></div>
      <div class="total-row"><span>MwSt. {{tax_rate}}%</span> <span>{{tax_amount}} EUR</span></div>
      <div class="total-row grand-total"><span>Gesamtbetrag</span> <span>{{total}} EUR</span></div>
    </div>

    <!-- HIER EINFÜGEN: Payment Details Block -->
    <div class="addon-payment-details">
      <div class="addon-payment-text">
        <h4>Zahlungsinformationen</h4>
        <p>Bitte überweisen Sie den Betrag bis zum <strong>{{due_date}}</strong> auf das unten genannte Konto.<br>
        Verwendungszweck: <strong>Rechnung {{number}}</strong></p>
      </div>
      <div class="addon-qr-placeholder">
        GiroCode<br>Placeholder
      </div>
    </div>

    <div class="footer">
      <div class="footer-col">
        <h4>Absender</h4>
        <p>{{manager_name}}</p>
        <p>{{org_address}}</p>
        <p>{{org_zip}} {{org_city}}</p>
        <p>{{org_country}}</p>
      </div>
      <div class="footer-col">
        <h4>Kontakt</h4>
        <p>Email: {{email}}</p>
        <p>Tel: {{phone}}</p>
        <p>Geschäftsführer: {{manager_name}}</p>
      </div>
      <div class="footer-col">
        <h4>Bankverbindung</h4>
        <p>{{bank_name}}</p>
        <p>IBAN: {{iban}}</p>
        <p>BIC: {{bic}}</p>
      </div>
      <div class="tax-row">
          <span>Steuernummer: {{tax_id}}</span>
          <span>USt-IdNr: {{vat_id}}</span>
      </div>
    </div>
  </div>
</body>
</html>
`
