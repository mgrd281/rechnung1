# Product Intelligence Platform - Implementation Plan

## 📋 Overview
Enterprise-grade Product Intelligence System for discovering, analyzing, and managing products with AI-powered insights.

**Positioning:** Professional Sourcing + Analytics Platform (NOT dropshipping scraper)

---

## 🏗️ Architecture Overview

### Database Schema
- `product_candidates` - Discovered products (internal)
- `product_sources` - Source configurations
- `discovery_jobs` - Crawl jobs
- `competitor_prices` - Price tracking
- `trend_snapshots` - Historical trend data
- `bundle_suggestions` - Auto-generated bundles

### Core Services
1. **Discovery Engine** (`lib/products/discovery/`)
2. **Intelligence Layer** (`lib/products/intelligence/`)
3. **Content Generator** (`lib/products/ai-content/`)
4. **Shopify Publisher** (`lib/products/shopify/`)

---

## 📊 Phase 1: Foundation (Database + Types)

### 1.1 Database Schema
```prisma
model ProductCandidate {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Basic Info
  title             String
  description       String?
  brand             String?
  category          String?
  ean               String?
  sourceUrl         String
  images            Json     // Array of image URLs
  
  // Pricing
  detectedPrice     Float?
  minCompetitorPrice Float?
  avgCompetitorPrice Float?
  maxCompetitorPrice Float?
  suggestedPrice    Float?
  
  // Intelligence
  trendScore        Int      @default(0)    // 0-100
  demandLevel       String   @default("medium") // low/medium/high
  riskScore         Int      @default(50)   // 0-100
  estimatedProfit   Float?
  marginPercent     Float?
  
  // AI Content
  aiTitle           String?
  aiDescription     String?
  aiBulletPoints    Json?
  
  // Metadata
  firstSeen         DateTime @default(now())
  lastUpdated       DateTime @updatedAt
  freshnessScore    Int      @default(0)
  
  // Seasonality
  seasonalityWindow String?  // "Nov-Dec" or null
  bestSellingFrom   DateTime?
  bestSellingTo     DateTime?
  
  // Status
  status            String   @default("new") // new/reviewed/published/rejected
  publishedToShopify Boolean @default(false)
  shopifyProductId  String?
  
  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id])
  competitorPrices  CompetitorPrice[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model DiscoveryJob {
  id                String   @id @default(cuid())
  organizationId    String
  
  // Configuration
  mode              String   // manual/auto/website
  query             String?  // Brand or category
  targetUrl         String?  // For website mode
  priceMin          Float?
  priceMax          Float?
  freshnessDays     Int      @default(30)
  
  // Status
  status            String   @default("pending") // pending/running/completed/failed
  startedAt         DateTime?
  finishedAt        DateTime?
  
  // Results
  productsFound     Int      @default(0)
  productsImported  Int      @default(0)
  errorMessage      String?
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  createdAt         DateTime @default(now())
}

model CompetitorPrice {
  id                String   @id @default(cuid())
  productCandidateId String
  
  vendor            String   // "Amazon", "Idealo", etc.
  price             Float
  availability      String?  // "in_stock", "out_of_stock"
  url               String
  
  product           ProductCandidate @relation(fields: [productCandidateId], references: [id], onDelete: Cascade)
  scrapedAt         DateTime @default(now())
}

model TrendSnapshot {
  id                String   @id @default(cuid())
  query             String
  trendValue        Int      // Google Trends score
  searchVolume      Int?
  
  capturedAt        DateTime @default(now())
  @@index([query, capturedAt])
}
```

### 1.2 TypeScript Types
```typescript
// types/product-intelligence.ts
export type DiscoveryMode = 'manual' | 'auto' | 'website'
export type DemandLevel = 'low' | 'medium' | 'high'
export type ProductStatus = 'new' | 'reviewed' | 'published' | 'rejected'
export type TrendBadge = 'rising' | 'hot' | 'stable' | 'declining'
export type RiskLevel = 'safe' | 'medium' | 'high'

export interface ProductIntelligence {
  trendScore: number
  trendBadge: TrendBadge
  estimatedProfit: number
  marginPercent: number
  demandLevel: DemandLevel
  riskScore: number
  riskLevel: RiskLevel
  competitorPrices: CompetitorPrice[]
  suggestedBundles?: BundleSuggestion[]
}

export interface BundleSuggestion {
  products: string[] // Product IDs
  estimatedProfit: number
  confidence: number
}
```

---

## 🔍 Phase 2: Discovery Engine

### 2.1 Core Crawler (`lib/products/discovery/crawler.ts`)
- Multi-source crawler (Google Shopping, Idealo, Amazon)
- Query generation
- Result extraction
- Deduplication logic

### 2.2 Freshness Detector (`lib/products/discovery/freshness.ts`)
- Sitemap parsing
- Date extraction
- First-indexed detection

### 2.3 Source Adapters
- `google-shopping-adapter.ts`
- `idealo-adapter.ts`
- `amazon-adapter.ts`
- `website-adapter.ts`

---

## 🧠 Phase 3: Intelligence Layer

### 3.1 Trend Detection (`lib/products/intelligence/trends.ts`)
- Google Trends API integration
- Velocity calculation
- Badge assignment

### 3.2 Profit Estimator (`lib/products/intelligence/profit.ts`)
- Market price analysis
- Cost estimation
- Fee calculation
- Margin computation

### 3.3 Demand Forecast (`lib/products/intelligence/demand.ts`)
- Search volume analysis
- Category benchmarks
- Seasonal patterns

### 3.4 Risk Scorer (`lib/products/intelligence/risk.ts`)
- Market saturation
- Competition density
- Copyright checks
- Price erosion detection

### 3.5 Bundle Suggester (`lib/products/intelligence/bundles.ts`)
- Co-purchase patterns
- Category affinity
- Profit calculation

---

## ✍️ Phase 4: AI Content Generation

### 4.1 Title Generator (`lib/products/ai-content/titles.ts`)
- SEO-optimized German titles
- Conversion-focused variants
- Character limits

### 4.2 Description Generator (`lib/products/ai-content/descriptions.ts`)
- Structured content
- Bullet points
- Benefits focus
- Trust elements

---

## 🖼️ Phase 5: Image Pipeline

### 5.1 Image Processor (`lib/products/images/processor.ts`)
- Legal source detection
- Unsplash/Pexels fallback
- Optimization
- Shopify upload

---

## 🛒 Phase 6: Shopify Integration

### 6.1 Publisher (`lib/products/shopify/publisher.ts`)
- Product creation
- Variant handling
- Image assignment
- Inventory sync

---

## 🎨 Phase 7: UI Components

### 7.1 Pages
- `/admin/product-intelligence/manual-search`
- `/admin/product-intelligence/auto-discovery`
- `/admin/product-intelligence/website-import`
- `/admin/product-intelligence/results`

### 7.2 Components
- `ProductCard.tsx` - Intelligence-rich card
- `ManualSearchWizard.tsx`
- `AutoDiscoveryScheduler.tsx`
- `WebsiteImporter.tsx`
- `ProductReviewTable.tsx`
- `CompetitorPriceChart.tsx`
- `TrendIndicator.tsx`
- `ProfitEstimateCard.tsx`

---

## ⚙️ Phase 8: Automation

### 8.1 Cron Jobs
- Hourly discovery runs
- Price updates
- Trend scoring
- Demand recalculation

### 8.2 Dashboard Widgets
- New products count
- Hot trends
- Average margin
- Last crawl status

---

## 🚀 Implementation Order

1. ✅ **Phase 1**: Database schema + types
2. ✅ **Phase 2.1**: Simple crawler framework
3. ✅ **Phase 3.1**: Basic trend detection
4. ✅ **Phase 3.2**: Profit estimation
5. ✅ **Phase 4**: AI content generation
6. ✅ **Phase 7.1**: Manual search UI
7. ✅ **Phase 7.2**: Results page
8. ✅ **Phase 6**: Shopify publishing
9. ✅ **Phase 2.2-2.3**: Advanced crawlers
10. ✅ **Phase 3.3-3.5**: Elite intelligence
11. ✅ **Phase 5**: Image pipeline
12. ✅ **Phase 8**: Automation

---

## 🎯 Success Metrics

- Discovery accuracy > 90%
- Deduplication rate < 5%
- Profit estimation accuracy ±15%
- AI content quality: professional
- No copyright violations
- System uptime > 99%

---

## 🔒 Quality Gates

- No auto-publish without review
- All products manually vetted
- Legal image sources only
- Professional German content
- Accurate pricing data
- Clear risk indicators

---

## 📝 Notes

This is an **Enterprise Product Intelligence Platform** - not a simple scraper.

Quality and legal compliance are paramount.
