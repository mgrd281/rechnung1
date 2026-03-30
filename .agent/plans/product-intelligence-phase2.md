# Product Intelligence Platform - Phase 2 Roadmap

## 🎯 Vision: From Intelligence → Autonomous Commerce

**Phase 1** (DONE): Product Intelligence Platform  
**Phase 2** (FUTURE): Autonomous Commerce System

Comparable to internal tooling of **Amazon**, **Zalando**, **Shopify Plus**.

---

## 📋 Phase 2 Features Overview

| Feature | Status | Complexity | Impact |
|---------|--------|------------|--------|
| **Auto Repricing** | Not Started | High | Revenue +15-25% |
| **Dynamic Discounting** | Not Started | Medium | Conversion +10-20% |
| **Supplier Scoring** | Not Started | Medium | Quality +30% |
| **Private Label Detection** | Not Started | High | Margin +50-100% |

---

## 🔄 Feature 1: AUTO REPRICING

### Goal
Automatically adjust selling prices based on real-time competitor market data.

### How It Works

```
1. System monitors competitor prices continuously (every 6h)
2. Admin defines repricing rules per product/category
3. Algorithm calculates optimal price within constraints
4. System updates Shopify price automatically
5. All changes are logged for audit
```

### Business Rules

**Constraints:**
- Never go below `minPrice` (admin-defined)
- Never go above `maxPrice` (admin-defined)
- Never violate `minimumMargin` % (e.g., 25%)
- Never change price more than X% per day

**Strategies:**
- **Competitive Match**: Match lowest competitor (within margin)
- **Undercut**: Always 5% below competitor
- **Premium**: Stay +10% above market average
- **Dynamic**: Adjust based on demand + competition

### Data Model

```prisma
model RepricingRule {
  id                String   @id @default(uuid())
  organizationId    String
  productId         String?  // null = global rule
  category          String?  // null = all categories
  
  enabled           Boolean  @default(true)
  strategy          String   // competitive_match, undercut, premium, dynamic
  
  minPrice          Float
  maxPrice          Float
  minimumMarginPercent Float  @default(25)
  maxDailyChange    Float    @default(10) // max % change per day
  
  // Strategy-specific params
  undercutPercent   Float?   // for undercut strategy
  premiumPercent    Float?   // for premium strategy
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  logs              RepricingLog[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model RepricingLog {
  id                String   @id @default(uuid())
  ruleId            String
  productId         String
  
  oldPrice          Float
  newPrice          Float
  reason            String   // "competitor_drop", "demand_increase"
  competitorPrices  Json     // snapshot
  
  rule              RepricingRule @relation(fields: [ruleId], references: [id])
  createdAt         DateTime @default(now())
}
```

### Algorithm (Simplified)

```typescript
function calculateOptimalPrice(
  product: Product,
  rule: RepricingRule,
  competitorPrices: number[]
): number {
  const minCompetitorPrice = Math.min(...competitorPrices)
  const avgCompetitorPrice = avg(competitorPrices)
  
  let targetPrice: number
  
  switch (rule.strategy) {
    case 'competitive_match':
      targetPrice = minCompetitorPrice
      break
    case 'undercut':
      targetPrice = minCompetitorPrice * (1 - rule.undercutPercent / 100)
      break
    case 'premium':
      targetPrice = avgCompetitorPrice * (1 + rule.premiumPercent / 100)
      break
    case 'dynamic':
      targetPrice = calculateDynamic(product, competitorPrices)
      break
  }
  
  // Apply constraints
  const minAllowed = Math.max(
    rule.minPrice,
    product.cost / (1 - rule.minimumMarginPercent / 100)
  )
  
  targetPrice = Math.max(minAllowed, Math.min(rule.maxPrice, targetPrice))
  
  // Check daily change limit
  const maxChange = product.currentPrice * (rule.maxDailyChange / 100)
  const change = Math.abs(targetPrice - product.currentPrice)
  
  if (change > maxChange) {
    return product.currentPrice + (targetPrice > product.currentPrice ? maxChange : -maxChange)
  }
  
  return targetPrice
}
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ AUTO REPRICING                                     [ON] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Current Price:      149.99 €                           │
│ Competitor Min:     139.99 €  ↓ 7%                     │
│ Recommended Price:  144.99 €                           │
│                                                         │
│ Strategy: [Undercut -5%  ▼]                            │
│                                                         │
│ Constraints:                                            │
│   Min Price:   120.00 €                                │
│   Max Price:   180.00 €                                │
│   Min Margin:  25 %                                    │
│                                                         │
│ [Update Shopify Now]  [Price History →]                │
└─────────────────────────────────────────────────────────┘
```

### Safety Mechanisms

✅ **Margin Protection**: Never go below minimum margin  
✅ **Price Limits**: Hard min/max boundaries  
✅ **Change Limits**: Max % change per day  
✅ **Audit Log**: Every price change recorded  
✅ **Manual Override**: Admin can pause/override anytime  
✅ **Alert System**: Notify on unusual price movements  

---

## 💸 Feature 2: DYNAMIC DISCOUNTING

### Goal
Apply smart, temporary discounts only when strategically beneficial.

### Discount Triggers

| Trigger | Condition | Action |
|---------|-----------|--------|
| **Stale Inventory** | No sale in X days | -5% to -15% |
| **Low Demand** | Demand score < 30 | -10% |
| **High Stock** | Stock > threshold | -10% to -20% |
| **Event Approaching** | Black Friday in 7 days | -15% to -30% |
| **Competitor Promo** | Competitor has sale | Match or beat |
| **End of Season** | Category: Fashion, Winter ending | -20% to -50% |

### Data Model

```prisma
model DiscountRule {
  id                String   @id @default(uuid())
  organizationId    String
  
  name              String
  enabled           Boolean  @default(true)
  priority          Int      @default(0) // higher = applied first
  
  // Trigger conditions
  triggerType       String   // stale_inventory, low_demand, high_stock, event, competitor
  
  // Stale inventory
  inactivityDays    Int?
  
  // Low demand
  demandThreshold   Int?
  
  // High stock
  stockThreshold    Int?
  
  // Event
  eventName         String?  // black_friday, christmas, easter
  daysBefore        Int?
  
  // Discount config
  discountType      String   // percentage, fixed
  discountValue     Float
  maxDiscount       Float    // cap at X%
  
  // Time limits
  startDate         DateTime?
  endDate           DateTime?
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  applications      DiscountApplication[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model DiscountApplication {
  id                String   @id @default(uuid())
  ruleId            String
  productId         String
  
  originalPrice     Float
  discountedPrice   Float
  discountPercent   Float
  
  appliedAt         DateTime @default(now())
  removedAt         DateTime?
  shopifyUpdated    Boolean  @default(false)
  
  rule              DiscountRule @relation(fields: [ruleId], references: [id])
}
```

### Example Scenarios

**Scenario 1: Stale Product**
```
Product: "Wireless Mouse XYZ"
Last Sale: 45 days ago
Rule: If no sale > 30 days → -10%

Action: Apply 10% discount
        Update Shopify price
        Monitor for 14 days
        If sold → remove discount
        If not sold → increase to -15%
```

**Scenario 2: Black Friday**
```
Date: Nov 22 (Black Friday = Nov 29)
Rule: 7 days before BF → -20% on Electronics

Action: Scan all Electronics products
        Apply 20% discount
        Schedule removal for Dec 2
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ DYNAMIC DISCOUNTING RULES                               │
├─────────────────────────────────────────────────────────┤
│ ✓ Stale Inventory (45+ days) → -15%                    │
│   └─ 12 products currently discounted                   │
│                                                         │
│ ✓ Black Friday Auto-Promo                              │
│   └─ Activates in 25 days · Electronics -25%           │
│                                                         │
│ ✓ Low Demand Detection → -10%                          │
│   └─ 3 products currently discounted                    │
│                                                         │
│ [+ Add New Rule]                                        │
└─────────────────────────────────────────────────────────┘
```

---

## ⭐ Feature 3: SUPPLIER SCORING

### Goal
Rate and rank suppliers to identify best partners and optimize sourcing decisions.

### Scoring Factors

| Factor | Weight | Good | Bad |
|--------|--------|------|-----|
| **Delivery Speed** | 25% | < 3 days | > 7 days |
| **Price Stability** | 20% | ±2% variance | > 10% variance |
| **Product Quality** | 25% | 0-1% returns | > 5% returns |
| **Issue Frequency** | 15% | < 1 per 100 orders | > 5 per 100 orders |
| **Communication** | 10% | < 4h response | > 24h response |
| **Refund Rate** | 5% | < 0.5% | > 3% |

### Score Calculation

```typescript
function calculateSupplierScore(supplier: Supplier): number {
  const weights = {
    deliverySpeed: 0.25,
    priceStability: 0.20,
    productQuality: 0.25,
    issueFrequency: 0.15,
    communication: 0.10,
    refundRate: 0.05
  }
  
  const scores = {
    deliverySpeed: scoreDeliverySpeed(supplier),
    priceStability: scorePriceStability(supplier),
    productQuality: scoreProductQuality(supplier),
    issueFrequency: scoreIssueFrequency(supplier),
    communication: scoreCommunication(supplier),
    refundRate: scoreRefundRate(supplier)
  }
  
  let totalScore = 0
  for (const [metric, weight] of Object.entries(weights)) {
    totalScore += scores[metric] * weight
  }
  
  return Math.round(totalScore)
}
```

### Data Model

```prisma
model SupplierScore {
  id                String   @id @default(uuid())
  supplierId        String   @unique
  
  // Overall
  totalScore        Int      // 0-100
  rating            String   // excellent, good, medium, poor
  
  // Individual scores
  deliveryScore     Int
  priceStabilityScore Int
  qualityScore      Int
  issueScore        Int
  communicationScore Int
  refundScore       Int
  
  // Stats for calculation
  avgDeliveryDays   Float
  priceVariance     Float
  returnRate        Float
  issuesCount       Int
  totalOrders       Int
  avgResponseHours  Float
  refundRate        Float
  
  lastCalculated    DateTime @default(now())
  trend             String   // improving, stable, declining
  
  supplier          Supplier @relation(fields: [supplierId], references: [id])
  history           SupplierScoreHistory[]
}

model SupplierScoreHistory {
  id                String   @id @default(uuid())
  scoreId           String
  
  score             Int
  calculatedAt      DateTime @default(now())
  
  scoreRecord       SupplierScore @relation(fields: [scoreId], references: [id])
}
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ SUPPLIER: TechSource GmbH                          [85] │
│ Rating: 🟢 EXCELLENT              Trend: ↗ IMPROVING   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Delivery Speed        ████████░░  85/100  (2.4 days)   │
│ Price Stability       █████████░  92/100  (±1.5%)      │
│ Product Quality       ████████░░  88/100  (0.8% ret.)  │
│ Issue Frequency       ███████░░░  78/100  (2 per 100)  │
│ Communication         ██████████  95/100  (2.1h avg)   │
│ Refund Rate           ██████████  98/100  (0.2%)       │
│                                                         │
│ Total Orders: 847  ·  Active Since: Jan 2024           │
│                                                         │
│ [View Details]  [Score History →]                      │
└─────────────────────────────────────────────────────────┘
```

### Benefits

✅ **Sourcing Decisions**: Prefer high-score suppliers  
✅ **Negotiation Power**: Use scores to negotiate better terms  
✅ **Risk Mitigation**: Avoid low-score suppliers  
✅ **Performance Tracking**: Monitor supplier improvement  

---

## 🏷️ Feature 4: PRIVATE LABEL DETECTION

### Goal
Identify products suitable for transitioning to **Karinex private label** (own brand).

### Detection Signals

| Signal | Weight | Positive Indicator |
|--------|--------|-------------------|
| **Weak Brand** | 30% | Brand score < 40, unknown brand |
| **Low Competition** | 25% | < 5 sellers with similar product |
| **Stable Demand** | 20% | Demand level = medium/high, stable over 90 days |
| **Good Margin** | 15% | Current margin > 35% |
| **Easy Sourcing** | 10% | Generic/OEM product available |

### Private Label Opportunity Score

```typescript
function calculatePrivateLabelScore(product: Product): {
  score: number
  opportunity: 'excellent' | 'good' | 'poor'
  estimatedMarginIncrease: number
  reasoning: string[]
} {
  const signals = {
    weakBrand: product.brandScore < 40,
    lowCompetition: product.competitorCount < 5,
    stableDemand: product.demandLevel !== 'low' && product.demandStability > 70,
    goodMargin: product.marginPercent > 35,
    genericProduct: product.isGeneric || product.hasOEM
  }
  
  let score = 0
  const reasoning: string[] = []
  
  if (signals.weakBrand) {
    score += 30
    reasoning.push('Schwache/unbekannte Marke → leicht zu ersetzen')
  }
  
  if (signals.lowCompetition) {
    score += 25
    reasoning.push('Geringe Konkurrenz → Marktchance')
  }
  
  if (signals.stableDemand) {
    score += 20
    reasoning.push('Stabile Nachfrage → planbar')
  }
  
  if (signals.goodMargin) {
    score += 15
    reasoning.push('Gute aktuelle Marge → Potenzial')
  }
  
  if (signals.genericProduct) {
    score += 10
    reasoning.push('Generisches Produkt → OEM verfügbar')
  }
  
  // Estimate margin increase
  const currentMargin = product.marginPercent
  const estimatedPrivateLabelMargin = currentMargin * 1.5 // +50%
  const increase = estimatedPrivateLabelMargin - currentMargin
  
  const opportunity = score >= 70 ? 'excellent' : score >= 50 ? 'good' : 'poor'
  
  return {
    score,
    opportunity,
    estimatedMarginIncrease: increase,
    reasoning
  }
}
```

### Data Model

```prisma
model PrivateLabelOpportunity {
  id                String   @id @default(uuid())
  productId         String   @unique
  organizationId    String
  
  score             Int      // 0-100
  opportunity       String   // excellent, good, poor
  
  // Current state
  currentBrand      String
  currentMargin     Float
  currentDemand     String
  competitorCount   Int
  
  // Estimated private label
  estimatedMarginIncrease Float
  estimatedCost     Float?
  minOrderQuantity  Int?
  
  // Analysis
  weakBrand         Boolean
  lowCompetition    Boolean
  stableDemand      Boolean
  goodMargin        Boolean
  genericProduct    Boolean
  
  reasoning         Json     // Array of strings
  
  // Status
  status            String   @default('detected') // detected, evaluating, sourcing, launched
  notes             String?
  
  organization      Organization @relation(fields: [organizationId], references: [id])
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### UI Mockup

```
┌─────────────────────────────────────────────────────────┐
│ 🏷️ PRIVATE LABEL OPPORTUNITY                     [88]  │
│ Status: EXCELLENT                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Product: Wireless Phone Charger                        │
│ Current Brand: "Unknown Brand XYZ"                     │
│                                                         │
│ Why Good for Private Label:                            │
│ ✓ Schwache/unbekannte Marke → leicht zu ersetzen      │
│ ✓ Nur 3 Konkurrenten → Marktchance                    │
│ ✓ Stabile Nachfrage (High) → planbar                  │
│ ✓ 42% aktuelle Marge → hohes Potenzial                │
│ ✓ Generisches Produkt → OEM verfügbar                 │
│                                                         │
│ Estimated Impact:                                       │
│   Current Margin: 42%                                   │
│   Private Label Margin: ~65% (+23%)                    │
│   Profit Increase: +12.80€ per unit                    │
│                                                         │
│ Next Steps:                                             │
│ [Find OEM Supplier]  [Calculate ROI]  [Mark Interest]  │
└─────────────────────────────────────────────────────────┘
```

### Workflow

```
1. System detects opportunity
2. Admin reviews score + reasoning
3. Admin searches for OEM supplier
4. Admin calculates ROI (MOQ × cost vs projected revenue)
5. Admin decides: Launch private label
6. System tracks: sourcing → production → launch
```

---

## 🚀 Implementation Priority

| Feature | Priority | Estimated Effort | Business Value |
|---------|----------|------------------|----------------|
| **Auto Repricing** | 🔴 High | 3-4 weeks | Very High |
| **Dynamic Discounting** | 🟡 Medium | 2-3 weeks | High |
| **Supplier Scoring** | 🟢 Low | 1-2 weeks | Medium |
| **Private Label Detection** | 🟡 Medium | 2-3 weeks | Very High |

---

## ✅ Phase 2 Acceptance Criteria

- [ ] Auto repricing works within defined constraints
- [ ] Repricing logs every price change
- [ ] Dynamic discounts activate/deactivate by rules
- [ ] Discount applications tracked in database
- [ ] Supplier scores calculated automatically
- [ ] Supplier score history visible
- [ ] Private label opportunities detected
- [ ] Each module can be enabled/disabled per product
- [ ] All changes sync to Shopify
- [ ] Admin dashboard shows all automation status

---

## 🎯 Final Vision

**Phase 1:** Product Intelligence Platform  
→ Find + Analyze + Import products

**Phase 2:** Autonomous Commerce System  
→ Price + Discount + Source + Brand automatically

**Comparable to:**
- Amazon Seller Central (Advanced)
- Shopify Plus
- Zalando Partner Platform

This transforms Karinex from **manual eCommerce** → **AI-driven autonomous trading platform**.
