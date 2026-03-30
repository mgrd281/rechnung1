// ========================================
// SHOPIFY API INTEGRATION
// ========================================

import { getShopifySettings, ShopifySettings } from './shopify-settings'

// ========================================
// TYPES & INTERFACES
// ========================================

export interface ShopifyOrder {
  id: number
  name: string // Order number (e.g., "#1001")
  email: string
  created_at: string
  updated_at: string
  total_price: string
  subtotal_price: string
  total_tax: string
  currency: string
  financial_status: string // paid, pending, refunded, etc.
  fulfillment_status: string | null
  customer: {
    id: number
    email?: string
    first_name?: string
    last_name?: string
    name?: string
    phone?: string | null
    default_address?: {
      first_name?: string
      last_name?: string
      address1?: string
      address2?: string | null
      city?: string
      zip?: string
      country?: string
      country_code?: string
      company?: string | null
      province?: string | null
      province_code?: string | null
    }
  }
  billing_address: {
    first_name?: string
    last_name?: string
    name?: string
    address1?: string
    address2?: string | null
    city?: string
    zip?: string
    country?: string
    country_code?: string
    company?: string | null
    province?: string | null
    province_code?: string | null
  }
  line_items: Array<{
    id: number
    title: string
    quantity: number
    price: string
    sku: string | null
    product_id: number
    variant_id: number
    vendor?: string
    fulfillable_quantity?: number
    grams?: number
    requires_shipping?: boolean
  }>
  tax_lines: Array<{
    title: string
    price: string
    rate: number
  }>
}

export interface ShopifyProduct {
  id: number
  title: string
  handle: string
  product_type: string
  created_at: string
  updated_at: string
  tags?: string
  vendor?: string
  status?: string
  body_html?: string
  images?: Array<{ id: number, src: string, alt: string | null }>
  variants: Array<{
    id: number
    title: string
    price: string
    sku: string | null
    inventory_quantity: number
  }>
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
  orders: ShopifyOrder[]
}

// ========================================
// SHOPIFY API CLIENT
// ========================================

// Helper function to check if a value is real and meaningful
const isValidValue = (value: any): boolean => {
  return value &&
    value !== 'MISSING' &&
    value !== 'NULL' &&
    value !== 'undefined' &&
    value.toString().trim() !== ''
}

export class ShopifyAPI {
  private settings: ShopifySettings
  private baseUrl: string

  constructor(settings?: ShopifySettings) {
    this.settings = settings || getShopifySettings()

    // Sanitize settings
    if (this.settings.shopDomain) {
      this.settings.shopDomain = this.settings.shopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim()
    }
    if (this.settings.accessToken) {
      this.settings.accessToken = this.settings.accessToken.trim()
    }

    this.baseUrl = `https://${this.settings.shopDomain}/admin/api/${this.settings.apiVersion}`
  }


  /**
   * Make authenticated request to Shopify API with retry logic for 429
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}, retries = 3): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`

    console.log(`🔗 Making Shopify API request to: ${url}`)

    let lastError: any = null
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'X-Shopify-Access-Token': this.settings.accessToken,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        })

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '2'
          const waitTime = parseInt(retryAfter) * 1000 + (attempt * 1000)
          console.warn(`⏳ Shopify API Rate Limited (429). Waiting ${waitTime}ms before retry ${attempt + 1}/${retries}...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`❌ Shopify API Error Response (${response.status}):`, errorText)
          throw new Error(`Shopify API Error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        return response
      } catch (error) {
        lastError = error
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        }
      }
    }

    throw lastError || new Error('Max retries reached for Shopify API request')
  }


  /**
   * Test connection to Shopify
   */
  async testConnection(): Promise<{ success: boolean; message: string; shop?: any }> {
    try {
      const response = await this.makeRequest('/shop.json')
      const data = await response.json()

      return {
        success: true,
        message: `Verbindung erfolgreich! Shop: ${data.shop?.name}`,
        shop: data.shop
      }
    } catch (error) {
      console.error('❌ Detailed connection error:', error)
      return {
        success: false,
        message: `Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
      }
    }
  }

  /**
   * Get orders from Shopify with unlimited cursor pagination
   */
  async getOrders(params: {
    limit?: number
    status?: string
    financial_status?: string
    created_at_min?: string
    created_at_max?: string
    name?: string
    maxPages?: number
  } = {}): Promise<ShopifyOrder[]> {
    try {
      // Remove limit restriction for complete import
      const requestedLimit = params.limit || 999999 // Unlimited by default
      const maxPerPage = 250 // Shopify API maximum per page
      const maxPages = params.maxPages || 1000 // Default safety limit

      let allOrders: ShopifyOrder[] = []
      let pageCount = 0
      let hasMorePages = true
      let pageInfo: any = null

      console.log(`🚀 Starting fetch of orders (Max Pages: ${maxPages})`)
      console.log(`📅 Date range: ${params.created_at_min} to ${params.created_at_max}`)
      console.log(`💰 Financial status: ${params.financial_status || 'any'}`)

      // Some Shopify API versions reject the `status` param with 400. We'll try with status=any first,
      // and if the first page fails due to 400, we'll retry without the status param.
      let tryWithStatusAny = true
      let firstAttemptDone = false

      while (hasMorePages && pageCount < maxPages) { // Use dynamic maxPages
        const searchParams = new URLSearchParams()
        searchParams.set('limit', '250') // Always request max per page for efficiency

        // Request specific fields including customer data
        // Request ALL fields by default to ensure no data is missing (especially addresses)
        // searchParams.set('fields', 'id,name,email,created_at,updated_at,total_price,subtotal_price,total_tax,currency,financial_status,fulfillment_status,customer,billing_address,shipping_address,line_items,tax_lines')
        // Attempt to include all orders (open/closed/cancelled)
        if (tryWithStatusAny) {
          searchParams.set('status', 'any')
        }

        // Financial status filter
        if (params.financial_status && params.financial_status !== 'any') {
          searchParams.set('financial_status', params.financial_status)
        }

        // Date range with proper timezone handling
        if (params.created_at_min) {
          searchParams.set('created_at_min', params.created_at_min)
        }
        if (params.created_at_max) {
          searchParams.set('created_at_max', params.created_at_max)
        }

        // Filter by name (Order number)
        if (params.name) {
          searchParams.set('name', params.name)
          // When searching by name, we usually want to ignore status filters to find the specific order
          if (!params.status) searchParams.set('status', 'any')
        }

        // Cursor pagination using page_info
        if (pageInfo && pageInfo.next) {
          // IMPORTANT: When using page_info, we MUST NOT send other filter parameters
          // Shopify API requires ONLY page_info and limit
          searchParams.delete('status')
          searchParams.delete('financial_status')
          searchParams.delete('created_at_min')
          searchParams.delete('created_at_max')

          searchParams.set('page_info', pageInfo.next)
        }

        try {
          console.log(`🔄 Page ${pageCount + 1}: Fetching ${maxPerPage} orders...`)
          console.log(`🔗 URL params: ${searchParams.toString()}`)
          console.log(`🔌 Shopify API Request: ${this.baseUrl}/orders.json?${searchParams.toString()}`)

          const response = await this.makeRequest(`/orders.json?${searchParams}`)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const data = await response.json()
          const orders = data.orders || []

          // Extract pagination info from Link header
          const linkHeader = response.headers.get('Link')
          pageInfo = this.parseLinkHeader(linkHeader)

          console.log(`📦 Page ${pageCount + 1}: Received ${orders.length} orders`)
          console.log(`🔗 Has next page: ${!!pageInfo?.next}`)

          if (orders.length === 0) {
            console.log('🏁 No more orders available')
            hasMorePages = false
            break
          }

          // Filter out duplicates
          const newOrders = orders.filter((order: any) =>
            !allOrders.some(existing => existing.id === order.id)
          )

          if (newOrders.length === 0 && !pageInfo?.next) {
            console.log('🔄 No new orders found and no next page, stopping')
            hasMorePages = false
            break
          }

          allOrders.push(...newOrders)
          pageCount++

          console.log(`✅ Page ${pageCount}: Added ${newOrders.length} new orders, total: ${allOrders.length}`)

          // Check if we have more pages
          if (!pageInfo?.next) {
            console.log('📄 No more pages available')
            hasMorePages = false
          }

          // Rate limiting - more aggressive for unlimited import
          if (pageCount % 10 === 0) {
            console.log(`⏳ Rate limiting: waiting 3 seconds after ${pageCount} pages...`)
            await new Promise(resolve => setTimeout(resolve, 3000))
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }

        } catch (error: any) {
          console.error(`❌ Error on page ${pageCount + 1}:`, error)
          // If the very first page failed and we tried with status=any, retry once without it
          if (pageCount === 0 && tryWithStatusAny && !firstAttemptDone) {
            firstAttemptDone = true
            tryWithStatusAny = false
            console.warn('⚠️ Retrying without status=any due to first-page failure...')
            // Small delay before retry
            await new Promise(resolve => setTimeout(resolve, 800))
            continue
          } else {
            if (pageCount === 0) {
              throw error // If first page also fails without status, throw error
            }
            // For subsequent pages, just stop pagination
            hasMorePages = false
            break
          }
        }
      }

      // Sort final results by created_at descending
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      console.log(`✅ UNLIMITED IMPORT COMPLETED: ${allOrders.length} orders fetched in ${pageCount} pages`)

      // Only apply limit if specifically requested and not unlimited
      if (params.limit && params.limit < 999999) {
        return allOrders.slice(0, params.limit)
      }

      return allOrders
    } catch (error) {
      console.error('Error fetching Shopify orders:', error)
      throw error
    }
  }

  /**
   * Parse Link header for cursor pagination
   */
  private parseLinkHeader(linkHeader: string | null): { next?: string, previous?: string } {
    if (!linkHeader) return {}

    const links: any = {}
    const parts = linkHeader.split(',')

    parts.forEach(part => {
      const section = part.split(';')
      if (section.length < 2) return

      const urlMatch = section[0].match(/<(.*)>/)
      if (!urlMatch) return
      const url = urlMatch[1].trim()

      const relMatch = section[1].match(/rel="?([^"]*)"?/)
      if (!relMatch) return
      const rel = relMatch[1].trim()

      // Extract page_info from URL
      const pageInfoMatch = url.match(/page_info=([^&]+)/)
      if (pageInfoMatch) {
        links[rel] = decodeURIComponent(pageInfoMatch[1])
      }
    })

    return links
  }

  /**
   * Get specific order by ID with enhanced customer data
   */
  async getOrder(orderId: number): Promise<ShopifyOrder | null> {
    try {
      // First, get the order with ALL fields (no field restriction)
      const response = await this.makeRequest(`/orders/${orderId}.json`)
      const data = await response.json()
      const order = data.order

      if (!order) return null

      // If order has a customer ID, try to get full customer data separately
      if (order.customer?.id) {
        try {
          console.log(`🔍 Fetching detailed customer data for customer ID: ${order.customer.id}`)
          const customerResponse = await this.makeRequest(`/customers/${order.customer.id}.json`)
          const customerData = await customerResponse.json()

          if (customerData.customer) {
            console.log('✅ Enhanced customer data retrieved:', {
              first_name: customerData.customer.first_name,
              last_name: customerData.customer.last_name,
              email: customerData.customer.email,
              phone: customerData.customer.phone,
              addresses_count: customerData.customer.addresses?.length || 0
            })

            // Merge enhanced customer data
            order.customer = {
              ...order.customer,
              ...customerData.customer
            }
          }
        } catch (customerError: any) {
          console.log('⚠️ Could not fetch detailed customer data:', customerError.message)
        }
      }

      return order
    } catch (error) {
      console.error(`Error fetching Shopify order ${orderId}:`, error)
      return null
    }
  }

  /**
   * Get customer data by ID with all addresses
   */
  async getCustomer(customerId: number): Promise<any | null> {
    try {
      console.log(`🔍 Fetching customer data for ID: ${customerId}`)
      const response = await this.makeRequest(`/customers/${customerId}.json`)
      const data = await response.json()

      if (data.customer) {
        console.log('✅ Customer data retrieved:', {
          id: data.customer.id,
          first_name: data.customer.first_name,
          last_name: data.customer.last_name,
          email: data.customer.email,
          phone: data.customer.phone,
          addresses_count: data.customer.addresses?.length || 0
        })
      }

      return data.customer || null
    } catch (error) {
      console.error(`Error fetching customer ${customerId}:`, error)
      return null
    }
  }

  /**
   * Create a new product in Shopify
   */
  async createProduct(productData: any): Promise<ShopifyProduct> {
    try {
      console.log('🚀 Creating new product in Shopify...')
      const response = await this.makeRequest('/products.json', {
        method: 'POST',
        body: JSON.stringify({ product: productData })
      })

      const data = await response.json()
      console.log('✅ Product created successfully:', data.product?.id)
      return data.product
    } catch (error) {
      console.error('Error creating Shopify product:', error)
      throw error
    }
  }

  /**
   * Get products from Shopify
   */
  async getProducts(params: {
    limit?: number
    product_type?: string
    tags?: string
    ids?: string
    fetchOptions?: RequestInit
    fields?: string // Optional: specify which fields to fetch
  } = {}): Promise<ShopifyProduct[]> {
    try {
      const requestedLimit = params.limit || 50
      const maxPerPage = 250

      let allProducts: ShopifyProduct[] = []
      let pageCount = 0
      let hasMorePages = true
      let pageInfo: any = null

      // If requested limit is small, use single page logic for efficiency
      if (requestedLimit <= maxPerPage) {
        const searchParams = new URLSearchParams()
        searchParams.set('limit', requestedLimit.toString())
        if (params.product_type) searchParams.set('product_type', params.product_type)
        if (params.tags) searchParams.set('tags', params.tags)
        if (params.ids) searchParams.set('ids', params.ids)
        if (params.fields) {
          searchParams.set('fields', params.fields)
        } else {
          searchParams.set('fields', 'id,title,handle,vendor,product_type,status,tags,created_at,updated_at,images,variants')
        }

        const response = await this.makeRequest(`/products.json?${searchParams}`, params.fetchOptions)
        const data = await response.json()
        allProducts = data.products || []
      } else {
        // Unlimited / Multi-page fetch
        console.log(`🚀 Starting UNLIMITED fetch of products (Limit: ${requestedLimit})`)

        while (hasMorePages && allProducts.length < requestedLimit) {
          const searchParams = new URLSearchParams()
          searchParams.set('limit', maxPerPage.toString())

          // Standard filters
          if (params.product_type) searchParams.set('product_type', params.product_type)
          if (params.tags) searchParams.set('tags', params.tags)
          if (params.ids) searchParams.set('ids', params.ids)
          if (params.fields) {
            searchParams.set('fields', params.fields)
          } else {
            searchParams.set('fields', 'id,title,handle,vendor,product_type,status,tags,created_at,updated_at,images,variants')
          }

          // Cursor pagination
          if (pageInfo && pageInfo.next) {
            // When using page_info, other filters typically must be omitted or identical
            // Shopify API usually ignores filters if page_info is present, or requires ONLY page_info
            searchParams.delete('product_type')
            searchParams.delete('tags')
            searchParams.delete('ids')

            searchParams.set('page_info', pageInfo.next)
          }

          console.log(`🔄 Fetching products page ${pageCount + 1}...`)
          const response = await this.makeRequest(`/products.json?${searchParams}`, params.fetchOptions)
          const data = await response.json()
          const products = data.products || []

          // Parse Link header
          const linkHeader = response.headers.get('Link')
          console.log(`🔗 Page ${pageCount + 1} Link Header:`, linkHeader)
          pageInfo = this.parseLinkHeader(linkHeader)
          console.log(`🔗 Page ${pageCount + 1} Parsed Link:`, JSON.stringify(pageInfo))

          allProducts.push(...products)
          pageCount++

          console.log(`📦 Page ${pageCount}: Received ${products.length} products, total so far: ${allProducts.length}`)

          if (products.length === 0 || !pageInfo?.next) {
            console.log('🏁 No more pages of products available')
            hasMorePages = false
          }

          // Rate limiting check
          if (pageCount % 10 === 0) await new Promise(r => setTimeout(r, 1000))
        }
      }

      // Minimize data structure if needed, or return as is. The existing code mapped it.
      // Let's keep the mapping consistency.
      const mappedProducts = allProducts.map((product: any) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        vendor: product.vendor,
        product_type: product.product_type,
        tags: product.tags,
        created_at: product.created_at,
        updated_at: product.updated_at,
        images: product.images?.map((img: any) => ({ src: img.src })) || [],
        variants: product.variants?.map((v: any) => ({
          id: v.id,
          title: v.title,
          price: v.price,
          sku: v.sku,
          barcode: v.barcode,
          inventory_quantity: v.inventory_quantity
        })) || []
      }))

      // Slice to exact limit if we over-fetched slightly due to page size
      return mappedProducts.length > requestedLimit ? mappedProducts.slice(0, requestedLimit) : mappedProducts
    } catch (error) {
      console.error('Error fetching Shopify products:', error)
      throw error
    }
  }


  /**
   * Get collections from Shopify
   */
  async getCollections(params: {
    limit?: number
    title?: string
  } = {}): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('limit', (params.limit || 250).toString())

      if (params.title) {
        searchParams.set('title', params.title)
      }

      // Fetch both smart (automated) and custom (manual) collections
      const [smartResponse, customResponse] = await Promise.all([
        this.makeRequest(`/smart_collections.json?${searchParams}`),
        this.makeRequest(`/custom_collections.json?${searchParams}`)
      ])

      const smartData = await smartResponse.json()
      const customData = await customResponse.json()

      const smartCollections = smartData.smart_collections || []
      const customCollections = customData.custom_collections || []

      // Combine and sort by title
      const allCollections = [...smartCollections, ...customCollections].sort((a, b) =>
        a.title.localeCompare(b.title)
      )

      return allCollections
    } catch (error) {
      console.error('Error fetching Shopify collections:', error)
      throw error
    }
  }

  /**
   * Delete a product from Shopify
   */
  async deleteProduct(productId: string | number): Promise<void> {
    try {
      console.log(`🗑️ Deleting product ${productId}...`)
      await this.makeRequest(`/products/${productId}.json`, {
        method: 'DELETE'
      })
      console.log('✅ Product deleted successfully')
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error)
      throw error
    }
  }

  /**
   * Update a product in Shopify
   */
  async updateProduct(productId: number, productData: any): Promise<ShopifyProduct> {
    try {
      console.log(`🔄 Updating product ${productId}...`)
      const response = await this.makeRequest(`/products/${productId}.json`, {
        method: 'PUT',
        body: JSON.stringify({ product: productData })
      })

      const data = await response.json()
      console.log('✅ Product updated successfully')
      return data.product
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error)
      throw error
    }
  }

  /**
   * Update an inventory item in Shopify
   */
  async updateInventoryItem(inventoryItemId: number, data: { harmonized_system_code?: string, country_code_of_origin?: string }): Promise<any> {
    try {
      console.log(`🔄 Updating inventory item ${inventoryItemId}...`)
      const response = await this.makeRequest(`/inventory_items/${inventoryItemId}.json`, {
        method: 'PUT',
        body: JSON.stringify({ inventory_item: { id: inventoryItemId, ...data } })
      })

      const result = await response.json()
      console.log('✅ Inventory item updated successfully')
      return result.inventory_item
    } catch (error) {
      console.error(`Error updating inventory item ${inventoryItemId}:`, error)
      throw error
    }
  }

  /**
   * Add a product to a collection (using Collects API)
   */
  async addProductToCollection(productId: number, collectionId: number): Promise<any> {
    try {
      console.log(`➕ Adding product ${productId} to collection ${collectionId}...`)
      const response = await this.makeRequest('/collects.json', {
        method: 'POST',
        body: JSON.stringify({
          collect: {
            product_id: productId,
            collection_id: collectionId
          }
        })
      })

      const data = await response.json()
      console.log('✅ Product added to collection successfully')
      return data.collect
    } catch (error) {
      console.error(`Error adding product ${productId} to collection ${collectionId}:`, error)
      return null
    }
  }

  /**
   * Get a single product from Shopify
   */
  async getProduct(productId: number | string): Promise<ShopifyProduct | null> {
    try {
      const response = await this.makeRequest(`/products/${productId}.json`)
      const data = await response.json()
      return data.product || null
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error)
      return null
    }
  }

  /**
   * Update a product image in Shopify
   */
  async updateImage(productId: number | string, imageId: number | string, imageData: any): Promise<any> {
    try {
      console.log(`🔄 Updating image ${imageId} for product ${productId}...`)
      const response = await this.makeRequest(`/products/${productId}/images/${imageId}.json`, {
        method: 'PUT',
        body: JSON.stringify({ image: { id: imageId, ...imageData } })
      })

      const data = await response.json()
      console.log('✅ Image updated successfully')
      return data.image
    } catch (error) {
      console.error(`Error updating image ${imageId} for product ${productId}:`, error)
      throw error
    }
  }

  /**
   * Get abandoned checkouts from Shopify
   */
  async getAbandonedCheckouts(params: {
    limit?: number
    created_at_min?: string
  } = {}): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('limit', (params.limit || 50).toString())

      if (params.created_at_min) {
        searchParams.set('created_at_min', params.created_at_min)
      }

      // Shopify API for checkouts
      const response = await this.makeRequest(`/checkouts.json?${searchParams}`)
      const data = await response.json()

      return data.checkouts || []
    } catch (error) {
      console.error('Error fetching Shopify abandoned checkouts:', error)
      return []
    }
  }

  /**
   * Get customers from Shopify with pagination
   */
  async getCustomers(params: {
    limit?: number
    since_id?: number
    query?: string
  } = {}): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('limit', (params.limit || 250).toString())
      if (params.since_id) searchParams.set('since_id', params.since_id.toString())
      if (params.query) searchParams.set('query', params.query)

      const response = await this.makeRequest(`/customers.json?${searchParams}`)
      const data = await response.json()
      return data.customers || []
    } catch (error) {
      console.error('Error fetching Shopify customers:', error)
      return []
    }
  }

  /**
   * Search customers by query (name, email, company)
   */
  async searchCustomers(query: string): Promise<any[]> {
    return this.getCustomers({ query, limit: 10 })
  }

  /**
   * Flexible order search (partial matches)
   */
  async searchOrdersFlexible(query: string): Promise<ShopifyOrder[]> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('query', query)
      searchParams.set('status', 'any')
      searchParams.set('limit', '10')

      const response = await this.makeRequest(`/orders/search.json?${searchParams}`)
      const data = await response.json()
      return data.orders || []
    } catch (error) {
      console.error('Error searching Shopify orders:', error)
      return []
    }
  }

  /**
   * Get orders since last import
   */
  async getNewOrders(): Promise<ShopifyOrder[]> {
    const lastImport = this.settings.lastImport
    const params: any = {
      financial_status: 'any', // Import all orders regardless of payment status
      limit: 250 // Maximum allowed by Shopify
    }

    if (lastImport) {
      params.created_at_min = lastImport
    }

    return this.getOrders(params)
  }

  /**
   * Get Blogs from Shopify
   */
  async getBlogs(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/blogs.json')
      const data = await response.json()
      return data.blogs || []
    } catch (error) {
      console.error('Error fetching blogs:', error)
      return []
    }
  }

  /**
   * Create a new Article in a Blog
   */
  async createArticle(blogId: number, articleData: {
    title: string
    author?: string
    tags?: string
    body_html?: string
    summary_html?: string
    published?: boolean
    meta_title?: string
    meta_description?: string
    handle?: string
  }): Promise<any> {
    try {
      console.log(`📝 Creating article in blog ${blogId}...`)
      const payload: any = { ...articleData }

      // Handle SEO Metafields for Shopify
      if (articleData.meta_title || articleData.meta_description) {
        payload.metafields = []
        if (articleData.meta_title) {
          payload.metafields.push({
            key: 'title_tag',
            value: articleData.meta_title,
            namespace: 'global',
            type: 'single_line_text_field'
          })
        }
        if (articleData.meta_description) {
          payload.metafields.push({
            key: 'description_tag',
            value: articleData.meta_description,
            namespace: 'global',
            type: 'multi_line_text_field'
          })
        }
      }

      const response = await this.makeRequest(`/blogs/${blogId}/articles.json`, {
        method: 'POST',
        body: JSON.stringify({ article: payload })
      })

      const data = await response.json()
      console.log('✅ Article created successfully:', data.article?.id)
      return data.article
    } catch (error) {
      console.error('Error creating article:', error)
      throw error
    }
  }
  /**
   * Fulfill an order using Fulfillment Orders API (modern approach)
   */
  async createFulfillment(orderId: number): Promise<any> {
    try {
      console.log(`📦 Fetching fulfillment orders for order ${orderId}...`)

      // 1. Get Fulfillment Orders
      const foResponse = await this.makeRequest(`/orders/${orderId}/fulfillment_orders.json`)
      const foData = await foResponse.json()

      if (!foData.fulfillment_orders || foData.fulfillment_orders.length === 0) {
        throw new Error('No fulfillment orders found for this order')
      }

      // Filter for open fulfillment orders
      const openFulfillmentOrders = foData.fulfillment_orders.filter(
        (fo: any) => fo.status === 'open' || fo.status === 'in_progress'
      )

      if (openFulfillmentOrders.length === 0) {
        console.log('⚠️ No open fulfillment orders found. Order might be already fulfilled.')
        return { success: true, message: 'Order already fulfilled' }
      }

      // 2. Create Fulfillment for the first open fulfillment order
      // We assume all items can be fulfilled at once for digital products
      const fulfillmentOrder = openFulfillmentOrders[0]

      const payload = {
        fulfillment: {
          line_items_by_fulfillment_order: [
            {
              fulfillment_order_id: fulfillmentOrder.id
            }
          ],
          notify_customer: false // Don't send Shopify's shipping email since we sent the key
        }
      }

      console.log(`🚀 Creating fulfillment for fulfillment_order_id: ${fulfillmentOrder.id}`)

      const response = await this.makeRequest('/fulfillments.json', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      console.log('✅ Fulfillment created successfully:', data.fulfillment?.id)
      return data
    } catch (error) {
      console.error(`Error fulfilling order ${orderId}:`, error)
      // Don't throw, just log and return error object so we don't break the flow
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Cancel an order in Shopify
   */
  async cancelOrder(orderId: number): Promise<any> {
    try {
      console.log(`🚫 Cancelling order ${orderId}...`)
      const response = await this.makeRequest(`/orders/${orderId}/cancel.json`, {
        method: 'POST',
        body: JSON.stringify({}) // Empty body or optional reason
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
      }

      const data = await response.json()
      console.log('✅ Order cancelled successfully')
      return data
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Fully refund an order (used when cancellation is not possible, e.g. fulfilled orders)
   */
  async fullyRefundOrder(orderId: number): Promise<any> {
    try {
      console.log(`💸 Fully refunding order ${orderId}...`)

      // 1. Fetch order to get items
      const order = await this.getOrder(orderId)
      if (!order) throw new Error('Order not found')

      // 2. Construct refund payload
      const refundLineItems = order.line_items.map(item => ({
        line_item_id: item.id,
        quantity: item.quantity,
        restock_type: 'no_restock' // Digital goods usually don't need restock, or make it configurable
      }))

      const payload: any = {
        refund: {
          currency: order.currency,
          notify: false, // We handle notifications
          refund_line_items: refundLineItems,
        }
      }

      // Add shipping refund if applicable
      // Note: calculating shipping refund is tricky without 'shipping_lines' detail in the interface
      // For now, we'll skip explicit shipping refund unless we fetch it from 'order' object which has it.
      // The 'ShopifyOrder' interface in this file doesn't show 'shipping_lines', but the API returns it.
      // Let's rely on what we have. If we want to refund shipping, we need the amount.
      // We can try to refund the full 'total_price' via 'transactions' if it was paid, 
      // but 'refund_line_items' is safer for inventory/status.

      // If we want to refund the *amount* (money), we need 'transactions'.
      // If the order is 'pending' payment, we just want to zero it out?
      // If we send 'refund_line_items', Shopify calculates the amount.

      const response = await this.makeRequest(`/orders/${orderId}/refunds.json`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(JSON.stringify(error))
      }

      const data = await response.json()
      console.log('✅ Order fully refunded successfully')
      return data
    } catch (error) {
      console.error(`Error refunding order ${orderId}:`, error)
      throw error
    }
  }

  /**
   * Get transactions for an order
   */
  async getTransactions(orderId: number): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/orders/${orderId}/transactions.json`)
      const data = await response.json()
      return data.transactions || []
    } catch (error) {
      console.error(`Error fetching transactions for order ${orderId}:`, error)
      return []
    }
  }

  /**
   * Create a discount code for abandoned cart recovery
   */
  async createDiscountCode(code: string, percentage: number): Promise<string | null> {
    try {
      console.log(`🎟️ Creating discount code ${code} (${percentage}%)...`)

      // 1. Create Price Rule
      const priceRulePayload = {
        price_rule: {
          title: `Recovery Discount ${code}`,
          target_type: "line_item",
          target_selection: "all",
          allocation_method: "across",
          value_type: "percentage",
          value: `-${percentage}.0`,
          customer_selection: "all",
          starts_at: new Date().toISOString(),
          once_per_customer: true,
          usage_limit: 1
        }
      }

      const ruleResponse = await this.makeRequest('/price_rules.json', {
        method: 'POST',
        body: JSON.stringify(priceRulePayload)
      })

      const ruleData = await ruleResponse.json()

      if (!ruleData.price_rule) {
        throw new Error('Failed to create price rule')
      }

      const priceRuleId = ruleData.price_rule.id

      // 2. Create Discount Code
      const codePayload = {
        discount_code: {
          code: code
        }
      }

      const codeResponse = await this.makeRequest(`/price_rules/${priceRuleId}/discount_codes.json`, {
        method: 'POST',
        body: JSON.stringify(codePayload)
      })

      const codeData = await codeResponse.json()

      if (codeData.discount_code) {
        console.log('✅ Discount code created successfully')
        return codeData.discount_code.code
      }

      return null

    } catch (error) {
      console.error('Error creating discount code:', error)
      return null
    }
  }
  /**
   * Make authenticated GraphQL request to Shopify
   */
  async makeGraphQLRequest(query: string, variables: any = {}): Promise<any> {
    const url = `https://${this.settings.shopDomain}/admin/api/${this.settings.apiVersion}/graphql.json`

    console.log(`🔗 Making Shopify GraphQL request to: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': this.settings.accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables })
    })

    const result = await response.json()

    if (result.errors) {
      console.error('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2))
      throw new Error(`GraphQL Error: ${result.errors[0].message}`)
    }

    return result.data
  }

  /**
   * Get all active publications (Sales Channels)
   */
  async getPublications(): Promise<any[]> {
    const query = `
      query getPublications {
        publications(first: 20) {
          edges {
            node {
              id
              name
              catalog {
                title
              }
            }
          }
        }
      }
    `
    try {
      const data = await this.makeGraphQLRequest(query)
      return data.publications.edges.map((edge: any) => edge.node)
    } catch (error) {
      console.error('Error fetching publications:', error)
      return []
    }
  }

  /**
   * Publish a product to ALL available sales channels
   */
  async publishProductToAllChannels(productId: string | number): Promise<void> {
    try {
      // 1. Get all publications
      const publications = await this.getPublications()
      if (publications.length === 0) {
        console.warn('⚠️ No publications found to publish to.')
        return
      }

      console.log(`📢 Publishing product ${productId} to ${publications.length} channels...`)

      // 2. Prepare GID
      const productGid = productId.toString().startsWith('gid://')
        ? productId
        : `gid://shopify/Product/${productId}`

      // 3. Construct Mutation Input
      // mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) 
      const input = publications.map(pub => ({ publicationId: pub.id }))

      const mutation = `
        mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
          publishablePublish(id: $id, input: $input) {
            userErrors {
              field
              message
            }
          }
        }
      `

      // 4. Execute
      const data = await this.makeGraphQLRequest(mutation, {
        id: productGid,
        input: input
      })

      if (data.publishablePublish?.userErrors?.length > 0) {
        console.error('❌ Publish errors:', data.publishablePublish.userErrors)
      }
    } catch (error) {
      console.error('❌ Failed to publish product to channels:', error)
    }
  }

  async getRedirects(params: { limit?: number } = {}): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('limit', (params.limit || 250).toString())
      const response = await this.makeRequest('/redirects.json?' + searchParams.toString())
      const data = await response.json()
      return data.redirects || []
    } catch (error) {
      console.error('Error fetching redirects:', error)
      return []
    }
  }

  async createRedirect(path: string, target: string): Promise<any> {
    try {
      const response = await this.makeRequest('/redirects.json', {
        method: 'POST',
        body: JSON.stringify({ redirect: { path, target } })
      })
      const data = await response.json()
      return data.redirect
    } catch (error) {
      console.error('Error creating redirect:', error)
      throw error
    }
  }

  async deleteRedirect(redirectId: string | number): Promise<void> {
    try {
      await this.makeRequest('/redirects/' + redirectId + '.json', { method: 'DELETE' })
    } catch (error) {
      console.error('Error deleting redirect:', error)
      throw error
    }
  }

  async getAllStorefrontPaths(): Promise<{ products: string[], collections: string[], pages: string[] }> {
    try {
      const [products, collections, pages] = await Promise.all([
        this.getProducts({ limit: 250, fields: 'handle' }),
        this.getCollections({ limit: 250 }),
        this.getPages({ limit: 250 })
      ])
      return {
        products: products.map(p => '/products/' + p.handle),
        collections: collections.map(c => '/collections/' + c.handle),
        pages: pages.map(p => '/pages/' + p.handle)
      }
    } catch (e) {
      console.error('Error fetching storefront paths:', e)
      return { products: [], collections: [], pages: [] }
    }
  }

  async getPages(params: { limit?: number } = {}): Promise<any[]> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.set('limit', (params.limit || 250).toString())
      const response = await this.makeRequest('/pages.json?' + searchParams.toString())
      const data = await response.json()
      return data.pages || []
    } catch (error) {
      console.error('Error fetching pages:', error)
      return []
    }
  }

  async getArticles(blogId: string | number) {
    const response = await this.makeRequest(`/blogs/${blogId}/articles.json`)
    const data = await response.json()
    return data.articles || []
  }

  async deleteArticle(blogId: string | number, articleId: string | number) {
    return this.makeRequest(`/blogs/${blogId}/articles/${articleId}.json`, {
      method: 'DELETE'
    })
  }

}

/**
 * Convert Shopify Order to internal Invoice format
 */
export function convertShopifyOrderToInvoice(order: any, settings: ShopifySettings) {
  // Extract customer data
  const customer = order.customer || {};
  const billing = order.billing_address || {};

  const firstName = billing.first_name || customer.first_name || '';
  const lastName = billing.last_name || customer.last_name || '';
  const customerName = (billing.name || customer.name || `${firstName} ${lastName}`).trim() || `Customer #${order.id}`;

  const customerEmail = order.email || customer.email || '';

  const zipCode = billing.zip || customer.default_address?.zip || '';
  const city = billing.city || customer.default_address?.city || '';
  const country = billing.country || customer.default_address?.country || 'Germany';
  const countryCode = billing.country_code || customer.default_address?.country_code || 'DE';
  const address1 = billing.address1 || customer.default_address?.address1 || '';
  const address2 = billing.address2 || customer.default_address?.address2 || '';

  // Construct address string
  const addressParts = [
    billing.company || customer.default_address?.company || '',
    address1,
    address2,
    `${zipCode} ${city}`,
    country
  ].filter(part => part && part.trim() !== '');

  const customerAddress = addressParts.join('\n');

  // Map items
  let subtotal = 0;
  let taxAmount = 0;

  const items = order.line_items.map((item: any) => {
    const price = parseFloat(item.price);
    const quantity = parseInt(item.quantity);
    const total = price * quantity;

    // Try to find tax rate from tax_lines
    let taxRate = 19; // Default German tax rate
    if (item.tax_lines && item.tax_lines.length > 0) {
      taxRate = item.tax_lines[0].rate * 100;
    }

    // Shopify price is usually gross.
    // Net = Gross / (1 + rate)
    const net = total / (1 + (taxRate / 100));
    subtotal += net;
    taxAmount += (total - net);

    return {
      description: item.title,
      quantity: quantity,
      unitPrice: price,
      total: total,
      taxRate: taxRate,
      vat: taxRate,
      netAmount: net,
      grossAmount: total,
      taxAmount: total - net,
      ean: item.sku || ''
    };
  });

  const total = subtotal + taxAmount;

  // Dates
  const orderDate = new Date(order.created_at);
  const dueDate = new Date(orderDate);
  dueDate.setDate(orderDate.getDate() + 14); // Default 14 days net

  return {
    id: order.id.toString(),
    number: order.name, // e.g. #1001
    date: orderDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],

    // Flat customer fields
    customerName,
    customerEmail,
    customerAddress,
    customerZip: zipCode,
    customerCity: city,
    customerCountry: country,

    // Nested customer fields (for PDF generator)
    customer: {
      name: customerName,
      email: customerEmail,
      address: address1 + (address2 ? `, ${address2}` : ''),
      zipCode: zipCode,
      city: city,
      country: country,
      countryCode: countryCode,
      companyName: billing.company || customer.default_address?.company || ''
    },

    items,
    subtotal,
    taxAmount,
    taxRate: items.length > 0 ? items[0].taxRate : 19,
    total,
    currency: order.currency || 'EUR',
    paymentMethod: order.gateway || 'Shopify Payments'
  };
}

