export interface TrafficSourceResult {
  sourceKey: string
  sourceLabel: string
  rawReferrer: string | null
  utmJson: any | null
}

export function normalizeSource(shopifyOrder: any): TrafficSourceResult {
  if (!shopifyOrder) {
    return {
      sourceKey: 'direct',
      sourceLabel: 'Direkt',
      rawReferrer: null,
      utmJson: null
    }
  }

  // Extract raw data
  const referringSite = (shopifyOrder.referring_site || '').toLowerCase()
  const landingSite = (shopifyOrder.landing_site || '').toLowerCase()
  const sourceName = (shopifyOrder.source_name || 'web').toLowerCase()
  
  // Extract UTMs from note_attributes or landing_site_ref (if available)
  // Shopify usually puts them in note_attributes for some setups, or we parse landing_site
  let utmSource = ''
  let utmMedium = ''
  let utmCampaign = ''
  
  // Try to parse note_attributes for UTMs
  if (Array.isArray(shopifyOrder.note_attributes)) {
    shopifyOrder.note_attributes.forEach((attr: any) => {
      const name = (attr.name || '').toLowerCase()
      const value = (attr.value || '').toLowerCase()
      
      if (name === 'utm_source') utmSource = value
      if (name === 'utm_medium') utmMedium = value
      if (name === 'utm_campaign') utmCampaign = value
    })
  }

  // If not found in attributes, try landing_site params (simple fallback check)
  if (!utmSource && landingSite) {
    try {
      // Create a dummy URL if landingSite is relative, though usually it's full or path
      const urlStr = landingSite.startsWith('http') ? landingSite : `http://dummy.com${landingSite}`
      const url = new URL(urlStr)
      utmSource = url.searchParams.get('utm_source') || ''
      utmMedium = url.searchParams.get('utm_medium') || ''
      utmCampaign = url.searchParams.get('utm_campaign') || ''
    } catch (e) {
      // ignore parsing errors
    }
  }
  
  const utmJson = {
    source: utmSource,
    medium: utmMedium,
    campaign: utmCampaign,
    content: '', // add if needed
    term: ''     // add if needed
  }

  // LOGIC IMPLEMENTATION
  let key = 'unknown'
  let label = 'Unbekannt'

  // Non-web sources (POS, Draft Orders, etc.)
  if (sourceName !== 'web' && sourceName !== 'shopify_draft_order' && sourceName !== 'iphone' && sourceName !== 'android') {
      // Trust the source_name for things like POS
      // Customize as needed, e.g. "shopify_draft_order" might count as "Manuell"
      key = sourceName
      label = sourceName.charAt(0).toUpperCase() + sourceName.slice(1)
      
      if (sourceName === 'pos') label = 'POS'
      
      return { sourceKey: key, sourceLabel: label, rawReferrer: referringSite, utmJson }
  }
  
  // 1. Google
  if (utmSource.includes('google') || referringSite.includes('google.')) {
    key = 'google'
    label = 'Google'
  }
  // 2. Idealo
  else if (referringSite.includes('idealo')) {
    key = 'idealo'
    label = 'Idealo'
  }
  // 3. Facebook
  else if (utmSource.includes('facebook') || utmSource.includes('fb') || referringSite.includes('facebook.com')) {
    key = 'facebook'
    label = 'Facebook'
  }
  // 4. Instagram
  else if (utmSource.includes('instagram') || referringSite.includes('instagram.com')) {
    key = 'instagram'
    label = 'Instagram'
  }
  // 5. TikTok
  else if (utmSource.includes('tiktok') || referringSite.includes('tiktok.com')) {
    key = 'tiktok'
    label = 'TikTok'
  }
  // 6. E-Mail
  else if (utmMedium.includes('email') || utmSource.includes('email') || utmSource.includes('klaviyo') || utmSource.includes('newsletter')) {
    key = 'email'
    label = 'E-Mail'
  }
  // 7. Direct / Fallback
  else {
    // If we have no specific signals but it came from "web"
    if (!referringSite && !utmSource) {
      key = 'direct'
      label = 'Direkt'
    } else {
      // We have a referrer but it didn't match known providers
      // e.g. "bing", "yahoo", or some blog
      // We can default to 'referral' or just use the hostname
      key = 'referral'
      label = 'Referral'
      
      // Try to make a nicer label from referrer
      if (referringSite) {
        try {
           const url = new URL(referringSite.startsWith('http') ? referringSite : `https://${referringSite}`)
           label = url.hostname.replace('www.', '')
        } catch (e) {
           label = referringSite
        }
      }
    }
  }

  return {
    sourceKey: key,
    sourceLabel: label,
    rawReferrer: referringSite,
    utmJson
  }
}
