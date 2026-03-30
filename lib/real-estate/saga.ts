import { RealEstateProvider, RealEstateFilter, RealEstateListing } from './types'

export class SagaProvider implements RealEstateProvider {
    name = 'SAGA'

    async search(filter: RealEstateFilter): Promise<RealEstateListing[]> {
        // SAGA only has listings in Hamburg
        if (filter.city && !filter.city.toLowerCase().includes('hamburg')) {
            return []
        }

        const url = 'https://www.saga.hamburg/immobiliensuche?type=wohnungen'

        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
                }
            })

            if (!response.ok) {
                console.error('SAGA Fetch Error:', response.status)
                return []
            }

            const html = await response.text()

            // Check if redirected to info page (meaning no listings)
            if (html.includes('hinweis-f%C3%BCr-wohnungsinteressenten') || html.includes('Hinweis für Wohnungsinteressenten')) {
                console.log('SAGA redirected to info page (probably no public listings).')
                return []
            }

            // Parse HTML (Simple Regex for now as we don't have cheerio)
            // Looking for listing containers. This is a guess based on typical structures.
            // Real implementation would need to inspect the actual HTML of a listing.
            // Since we can't see one now, we'll return empty but log the attempt.

            // TODO: Update regex when we have a sample listing HTML
            const listings: RealEstateListing[] = []

            return listings

        } catch (error) {
            console.error('SAGA Search Exception:', error)
            return []
        }
    }
}
