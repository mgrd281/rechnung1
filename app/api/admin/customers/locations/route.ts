export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// City Coordinate Dictionary (Simplified)
// In a real app, this would be a Geocoding API or a larger database.
const CITY_COORDINATES: Record<string, [number, number]> = {
    'Berlin': [52.5200, 13.4050],
    'Hamburg': [53.5511, 9.9937],
    'München': [48.1351, 11.5820],
    'Munich': [48.1351, 11.5820],
    'Köln': [50.9375, 6.9603],
    'Cologne': [50.9375, 6.9603],
    'Frankfurt': [50.1109, 8.6821],
    'Stuttgart': [48.7758, 9.1829],
    'Düsseldorf': [51.2277, 6.7735],
    'Leipzig': [51.3397, 12.3731],
    'Dortmund': [51.5136, 7.4653],
    'Essen': [51.4556, 7.0116],
    'Bremen': [53.0793, 8.8017],
    'Dresden': [51.0504, 13.7373],
    'Hannover': [52.3759, 9.7320],
    'Nürnberg': [49.4521, 11.0767],
    'Wien': [48.2082, 16.3738],
    'Vienna': [48.2082, 16.3738],
    'Zürich': [47.3769, 8.5417],
    'Zurich': [47.3769, 8.5417],
    'Bern': [46.9480, 7.4474],
    'Basel': [47.5596, 7.5886],
    'Paris': [48.8566, 2.3522],
    'London': [51.5074, -0.1278],
    'Amsterdam': [52.3676, 4.9041],
    'Brussels': [50.8503, 4.3517],
    'Madrid': [40.4168, -3.7038],
    'Rome': [41.9028, 12.4964],
}

// Country Centroids (Fallback)
const COUNTRY_COORDINATES: Record<string, [number, number]> = {
    'DE': [51.1657, 10.4515],
    'Germany': [51.1657, 10.4515],
    'Deutschland': [51.1657, 10.4515],
    'AT': [47.5162, 14.5501],
    'Austria': [47.5162, 14.5501],
    'Österreich': [47.5162, 14.5501],
    'CH': [46.8182, 8.2275],
    'Switzerland': [46.8182, 8.2275],
    'Schweiz': [46.8182, 8.2275],
    'US': [37.0902, -95.7129],
    'USA': [37.0902, -95.7129],
    'FR': [46.2276, 2.2137],
    'France': [46.2276, 2.2137],
    'GB': [55.3781, -3.4360],
    'UK': [55.3781, -3.4360],
    'NL': [52.1326, 5.2913],
    'IT': [41.8719, 12.5674],
    'ES': [40.4637, -3.7492]
}

export async function GET() {
    try {
        // Retrieve all customers (Super Admin View)
        // In a multi-tenant setup, we would filter by organizationId here
        const customers = await prisma.customer.findMany({
            select: {
                id: true,
                city: true,
                country: true,
                name: true,
                email: true
            }
        })

        // Group by City (primary) or Country (fallback)
        const locationMap = new Map<string, {
            name: string,
            lat: number,
            lng: number,
            count: number,
            customers: any[],
            type: 'city' | 'country'
        }>()

        for (const customer of customers) {
            let lat: number | undefined
            let lng: number | undefined
            let locationName = customer.city || customer.country || 'Unknown'
            let type: 'city' | 'country' = 'city'

            // 1. Try City Lockup
            if (customer.city && CITY_COORDINATES[customer.city]) {
                [lat, lng] = CITY_COORDINATES[customer.city]
            }
            // 2. Try Country Lockup
            else if (customer.country && COUNTRY_COORDINATES[customer.country]) {
                [lat, lng] = COUNTRY_COORDINATES[customer.country]
                locationName = customer.country // Fallback to country bucket
                type = 'country'
            }
            // 3. Skip if no coords found
            else {
                continue
            }

            const key = `${lat},${lng}`

            if (!locationMap.has(key)) {
                locationMap.set(key, {
                    name: locationName,
                    lat,
                    lng,
                    count: 0,
                    customers: [],
                    type
                })
            }

            const entry = locationMap.get(key)!
            entry.count++
            // Only store top 5 customers per cluster to keep payload small
            if (entry.customers.length < 5) {
                entry.customers.push({
                    id: customer.id,
                    name: customer.name,
                    email: customer.email
                })
            }
        }

        const locations = Array.from(locationMap.values())

        return NextResponse.json({ locations })

    } catch (error) {
        console.error("[ADMIN_MAP]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}
