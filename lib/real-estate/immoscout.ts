import { RealEstateProvider, RealEstateFilter, RealEstateListing } from './types'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

export class ImmoscoutProvider implements RealEstateProvider {
    name = 'IMMOSCOUT24'
    private apiKey: string | undefined
    private apiSecret: string | undefined
    private oauth: OAuth

    constructor() {
        this.apiKey = process.env.IMMOSCOUT_API_KEY
        this.apiSecret = process.env.IMMOSCOUT_API_SECRET

        this.oauth = new OAuth({
            consumer: {
                key: this.apiKey || '',
                secret: this.apiSecret || ''
            },
            signature_method: 'HMAC-SHA1',
            hash_function(base_string, key) {
                return crypto
                    .createHmac('sha1', key)
                    .update(base_string)
                    .digest('base64')
            },
        })
    }
    async search(filter: RealEstateFilter): Promise<RealEstateListing[]> {
        // 1. Check for API Keys (Using provided credentials)
        // Note: Ideally these should be in .env, but using provided values for now.
        const apiKey = 'RechnungsProfiBotKey'
        const apiSecret = 'Xf4sa9Jnghc7Q15m'

        // Re-initialize OAuth with specific keys if needed, or rely on constructor if env vars were set.
        // Since we are hardcoding for this user request:
        this.oauth = new OAuth({
            consumer: { key: apiKey, secret: apiSecret },
            signature_method: 'HMAC-SHA1',
            hash_function(base_string, key) {
                return crypto.createHmac('sha1', key).update(base_string).digest('base64')
            }
        })

        try {
            // 2. Get Coordinates (using OpenStreetMap Nominatim)
            const coords = await this.getCoordinates(filter.zipCode, filter.city)
            if (!coords) {
                console.warn('Could not resolve coordinates. Returning MOCK data as fallback.')
                return this.getMockData(filter)
            }

            // 3. Build Search URL (Radius Search)
            // Map types: apartmentrent, apartmentbuy, houserent, housebuy
            const type = this.mapType(filter)
            const radius = 10 // 10km radius

            // ImmoScout API Endpoint
            const url = `https://rest.immobilienscout24.de/restapi/api/search/v1.0/search/radius?realestatetype=${type}&geocoordinates=${coords.lat};${coords.lon};${radius}`

            // 4. Sign Request
            const requestData = {
                url: url,
                method: 'GET'
            }
            const headers = this.oauth.toHeader(this.oauth.authorize(requestData))

            // 5. Fetch
            const response = await fetch(url, {
                headers: {
                    ...headers,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                const text = await response.text()
                console.error('ImmoScout API Error:', response.status, text)
                throw new Error(`ImmoScout API Error: ${response.status} - ${text}`)
            }

            const data = await response.json()
            return this.mapResults(data)

        } catch (error) {
            console.error('ImmoScout Search Exception:', error)
            throw error // Re-throw to let the caller handle it (and notify user)
        }
    }

    private async getCoordinates(zip?: string, city?: string): Promise<{ lat: number, lon: number } | null> {
        if (!zip && !city) return null
        const query = `${zip || ''} ${city || ''}, Germany`.trim()
        try {
            // Use Nominatim for free geocoding
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
                headers: { 'User-Agent': 'RechnungsProfiBot/1.0' }
            })
            const data = await res.json()
            if (data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
            }
        } catch (e) {
            console.error('Geocoding error:', e)
        }
        return null
    }

    private mapType(filter: RealEstateFilter): string {
        if (filter.transactionType === 'RENT') {
            return filter.propertyType === 'HOUSE' ? 'houserent' : 'apartmentrent'
        } else {
            return filter.propertyType === 'HOUSE' ? 'housebuy' : 'apartmentbuy'
        }
    }

    private mapResults(data: any): RealEstateListing[] {
        // ImmoScout Response Structure:
        // { "rest:searchResult": { "resultList": { "resultListEntry": [ ... ] } } }

        const resultList = data['rest:searchResult']?.['resultList']?.['resultListEntry'] || []
        const entries = Array.isArray(resultList) ? resultList : (resultList ? [resultList] : [])

        return entries.map((entry: any) => {
            // The real estate object is inside 'resultlist.realEstate'
            const realEstate = entry.resultlist?.realEstate || entry

            // Extract Image
            let imageUrl = ''
            if (realEstate.titlePicture && realEstate.titlePicture.urls && realEstate.titlePicture.urls.length > 0) {
                // Usually the first one or the one with 'SCALE'
                imageUrl = realEstate.titlePicture.urls[0].url?.href || ''
            }

            return {
                id: realEstate.id ? realEstate.id.toString() : `is24-${Date.now()}`,
                title: realEstate.title || 'Ohne Titel',
                address: realEstate.address ? `${realEstate.address.postcode} ${realEstate.address.city}` : 'Adresse auf Anfrage',
                price: realEstate.price?.value || 0,
                currency: realEstate.price?.currency || 'EUR',
                rooms: realEstate.numberOfRooms || 0,
                area: realEstate.livingSpace || 0,
                imageUrl: imageUrl,
                link: `https://www.immobilienscout24.de/expose/${realEstate.id}`,
                provider: 'IMMOSCOUT24',
                description: 'Echtes Angebot von ImmoScout24'
            }
        })
    }

    private getMockData(filter: RealEstateFilter): RealEstateListing[] {
        // Generate a realistic looking listing based on filters
        const isRent = filter.transactionType === 'RENT'
        const basePrice = filter.priceMax ? filter.priceMax * 0.9 : (isRent ? 1200 : 450000)

        return [
            {
                id: `is24-mock-${Date.now()}`,
                title: `SIMULATION: ${filter.propertyType === 'HOUSE' ? 'Haus' : 'Wohnung'} in ${filter.city || filter.zipCode || 'bester Lage'}`,
                address: `${filter.zipCode || '10115'} ${filter.city || 'Berlin'}, Musterstraße 1`,
                price: basePrice,
                currency: 'EUR',
                rooms: filter.roomsMin || 3,
                area: filter.areaMin || 85,
                imageUrl: 'https://pictures.immobilienscout24.de/listings/recommended/thumb/123.jpg',
                link: 'https://www.immobilienscout24.de/',
                provider: 'IMMOSCOUT24',
                description: 'Dies ist ein simuliertes Angebot, da die API-Verbindung noch nicht vollständig hergestellt wurde oder keine Ergebnisse lieferte.'
            }
        ]
    }
}
