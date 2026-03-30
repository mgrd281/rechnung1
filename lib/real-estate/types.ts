export interface RealEstateFilter {
    city?: string
    zipCode?: string
    district?: string
    transactionType: 'RENT' | 'BUY'
    propertyType: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL'
    priceMin?: number
    priceMax?: number
    roomsMin?: number
    areaMin?: number
}

export interface RealEstateListing {
    id: string
    title: string
    address: string
    price: number
    currency: string
    rooms?: number
    area?: number
    imageUrl?: string
    link: string
    provider: string
    description?: string
}

export interface RealEstateProvider {
    name: string
    search(filter: RealEstateFilter): Promise<RealEstateListing[]>
}
