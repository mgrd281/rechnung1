export const dynamic = "force-dynamic"
import { NextResponse } from 'next/server'

export async function GET() {
  // Comprehensive CSV template with all invoice types (Normal, Storno, Gutschrift) - German Headers
  const csvTemplate = `Bestellnummer,Kundenname,E-Mail,Finanzstatus,Erfüllungsstatus,Gesamt,Bestelldatum,Menge,Produktname,Einzelpreis,Artikelnummer,Rechnungsname,Rechnungsadresse,Rechnungsstadt,RechnungsPLZ,Rechnungsland,Liefername,Lieferadresse,Lieferstadt,LieferPLZ,Lieferland,Rechnungstyp,Status,Grund,Originalrechnung
"RE-2024-001","Max Mustermann","max.mustermann@email.com","bezahlt","erfüllt","119.00","2024-01-15 10:30:00","1","Premium T-Shirt","100.00","TSHIRT-001","Max Mustermann","Musterstraße 123","Berlin","12345","Deutschland","Max Mustermann","Musterstraße 123","Berlin","12345","Deutschland","Rechnung","Bezahlt","",""
"RE-2024-002","Anna Schmidt","anna.schmidt@email.com","bezahlt","erfüllt","89.50","2024-01-16 14:20:00","2","Basic Cap","44.75","CAP-001","Anna Schmidt","Beispielweg 456","München","80331","Deutschland","Anna Schmidt","Beispielweg 456","München","80331","Deutschland","Rechnung","Bezahlt","",""
"RE-2024-003","Peter Müller","peter.mueller@email.com","ausstehend","unerfüllt","234.75","2024-01-17 09:15:00","1","Deluxe Hoodie","234.75","HOODIE-001","Peter Müller","Teststraße 789","Hamburg","20095","Deutschland","Peter Müller","Teststraße 789","Hamburg","20095","Deutschland","Rechnung","Offen","",""
"ST-2024-001","Max Mustermann","max.mustermann@email.com","erstattet","storniert","-119.00","2024-01-20 15:30:00","1","Premium T-Shirt (Storno)","100.00","TSHIRT-001","Max Mustermann","Musterstraße 123","Berlin","12345","Deutschland","Max Mustermann","Musterstraße 123","Berlin","12345","Deutschland","Storno","Storniert","Kunde hat Bestellung storniert","RE-2024-001"
"GS-2024-001","Anna Schmidt","anna.schmidt@email.com","teilweise_erstattet","zurückgegeben","-44.75","2024-01-22 11:15:00","1","Basic Cap (Rückerstattung)","44.75","CAP-001","Anna Schmidt","Beispielweg 456","München","80331","Deutschland","Anna Schmidt","Beispielweg 456","München","80331","Deutschland","Gutschrift","Gutschrift","Artikel defekt - Teilrückerstattung","RE-2024-002"
"RE-2024-006","Maria Weber","maria.weber@email.com","bezahlt","erfüllt","156.90","2024-01-18 16:45:00","3","Standard Tasse","52.30","MUG-001","Maria Weber","Probestraße 321","Köln","50667","Deutschland","Maria Weber","Probestraße 321","Köln","50667","Deutschland","Rechnung","Bezahlt","",""
"RE-2024-007","Thomas Klein","thomas.klein@email.com","teilweise","teilweise","78.25","2024-01-19 11:30:00","1","Basic Notizbuch","78.25","NOTEBOOK-001","Thomas Klein","Demoweg 654","Frankfurt","60311","Deutschland","Thomas Klein","Demoweg 654","Frankfurt","60311","Deutschland","Rechnung","Teilweise bezahlt","",""
"RE-2024-008","Lisa Hoffmann","lisa.hoffmann@email.com","ausstehend","unerfüllt","299.99","2024-01-10 08:45:00","1","Premium Laptop Tasche","299.99","BAG-001","Lisa Hoffmann","Hauptstraße 987","Stuttgart","70173","Deutschland","Lisa Hoffmann","Hauptstraße 987","Stuttgart","70173","Deutschland","Rechnung","Überfällig","",""
"ST-2024-002","Lisa Hoffmann","lisa.hoffmann@email.com","erstattet","storniert","-299.99","2024-01-25 14:20:00","1","Premium Laptop Tasche (Storno)","299.99","BAG-001","Lisa Hoffmann","Hauptstraße 987","Stuttgart","70173","Deutschland","Lisa Hoffmann","Hauptstraße 987","Stuttgart","70173","Deutschland","Storno","Storniert","Kunde unzufrieden mit Qualität","RE-2024-008"
"RE-2024-009","Michael Bauer","michael.bauer@email.com","bezahlt","erfüllt","45.50","2024-01-21 13:10:00","5","Einfache Socken","9.10","SOCKS-001","Michael Bauer","Nebenstraße 147","Düsseldorf","40210","Deutschland","Michael Bauer","Nebenstraße 147","Düsseldorf","40210","Deutschland","Rechnung","Bezahlt","",""
"GS-2024-002","Michael Bauer","michael.bauer@email.com","teilweise_erstattet","zurückgegeben","-9.10","2024-01-28 16:30:00","1","Einfache Socken (Rückerstattung)","9.10","SOCKS-001","Michael Bauer","Nebenstraße 147","Düsseldorf","40210","Deutschland","Michael Bauer","Nebenstraße 147","Düsseldorf","40210","Deutschland","Gutschrift","Gutschrift","Ein Paar Socken hatte Löcher","RE-2024-009"
"RE-2024-010","Sarah Wagner","sarah.wagner@email.com","bezahlt","erfüllt","189.75","2024-01-23 10:20:00","1","Designer Schal","189.75","SCARF-001","Sarah Wagner","Parkstraße 258","Bremen","28195","Deutschland","Sarah Wagner","Parkstraße 258","Bremen","28195","Deutschland","Rechnung","Bezahlt","",""
"RE-2024-011","David Richter","david.richter@email.com","ausstehend","unerfüllt","67.80","2024-01-24 12:45:00","1","Sport Handschuhe","67.80","GLOVES-001","David Richter","Sportstraße 369","Hannover","30159","Deutschland","David Richter","Sportstraße 369","Hannover","30159","Deutschland","Rechnung","Offen","",""
"GS-2024-003","Thomas Klein","thomas.klein@email.com","teilweise_erstattet","zurückgegeben","-39.13","2024-01-30 09:40:00","1","Basic Notizbuch (Teilrückerstattung)","39.13","NOTEBOOK-001","Thomas Klein","Demoweg 654","Frankfurt","60311","Deutschland","Thomas Klein","Demoweg 654","Frankfurt","60311","Deutschland","Gutschrift","Gutschrift","Notizbuch hatte Druckfehler auf Seiten","RE-2024-007"`

  // Create response with CSV content
  const response = new NextResponse(csvTemplate, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rechnungen-vorlage-mit-beispielen.csv"',
    },
  })

  return response
}
