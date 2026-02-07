# Performance Optimization Guide

## Overview

This document outlines the performance optimizations implemented in the Wallet PWA and provides guidelines for maintaining optimal performance as the app evolves.

## Current Performance Metrics

### Lighthouse Scores (Target)
- **Performance**: 85%+
- **Accessibility**: 90%+
- **Best Practices**: 85%+
- **SEO**: 85%+
- **PWA**: 80%+

### Core Web Vitals (Target)
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Build Metrics
- **Client Bundle**: 403 KB gzipped (1.67 MB uncompressed)
- **Server Bundle**: 40.8 KB gzipped (164 KB uncompressed)
- **PWA Cache**: 737 KB (31 precached entries)

## Implemented Optimizations

### 1. Code Splitting & Lazy Loading

**Firebase SDK** (177KB gzipped):
```javascript
// composables/useFirebaseLazy.ts
const { firebaseApp, firebaseFirestore } = await Promise.all([
  import('firebase/app'),
  import('firebase/firestore'),
])
```

**Benefits:**
- Reduces initial bundle by ~177KB for users not using sync
- Improves Time to Interactive (TTI)
- Loads only when needed

**Usage:**
```javascript
// Use lazy version for optional features
import { useFirebaseLazy } from '~/composables/useFirebaseLazy'

// Use regular version for critical features
import { useFirebase } from '~/composables/useFirebase'
```

### 2. Virtual Scrolling

**Large Transaction Lists** (1000+ items):
```vue
<!-- components/VirtualTransactionList.vue -->
<template>
  <div ref="parentRef" style="height: 600px; overflow: auto;">
    <div :style="{ height: `${virtualizer.getTotalSize()}px` }">
      <div
        v-for="item in virtualizer.getVirtualItems()"
        :key="item.key"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${item.size}px`,
          transform: `translateY(${item.start}px)`,
        }"
      >
        <slot name="item" :entry="items[item.index]" :index="item.index" />
      </div>
    </div>
  </div>
</template>
```

**Benefits:**
- Handles 1000+ items at 60fps
- Constant memory usage O(viewport) instead of O(n)
- Reduces initial render time by ~90%

**Usage:**
```vue
<VirtualTransactionList :items="transactions" :estimateSize="80">
  <template #item="{ entry }">
    <TransactionRow :transaction="entry" />
  </template>
</VirtualTransactionList>
```

### 3. Service Worker Caching

**Offline-First Strategy:**
```javascript
// nuxt.config.ts - PWA configuration
pwa: {
  registerType: 'autoUpdate',
  workbox: {
    navigateFallback: '/',
    glob Patterns: ['**/*.{js,css,html,png,svg,ico}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\./,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
          },
        },
      },
    ],
  },
}
```

**Benefits:**
- Instant page loads on repeat visits
- Works fully offline
- Reduces network requests

### 4. Database Optimization

**Indexed Queries:**
```javascript
// composables/useDatabase.ts
db.version(1).stores({
  ledger_entries: 'id, transaction_id, date, status, updated_at, account_id, budget_id, [account_id+date], [budget_id+date], [transaction_id+idx]',
  accounts: 'id, updated_at',
  budgets: 'id, updated_at',
  exchange_rates: 'id, date, updated_at',
  recurring_rules: 'id, updated_at'
})
```

**Benefits:**
- Fast queries on account_id, date, budget_id
- Compound indexes for complex queries
- Efficient date range filtering

**Best Practices:**
```javascript
// Use indexed fields in queries
const entries = await db.ledger_entries
  .where('[account_id+date]')
  .between([accountId, startDate], [accountId, endDate])
  .toArray()
```

### 5. Decimal Math Optimization

**Precise Calculations:**
```javascript
import Decimal from 'decimal.js'

// Configure once globally
Decimal.set({ precision: 20, rounding: 4 })

// Reuse Decimal instances
const amount = new Decimal(100)
const result = amount.mul(0.85).toFixed(2)
```

**Benefits:**
- No floating point errors
- Consistent rounding
- Predictable math

## Future Optimizations

### Priority 1: Additional Code Splitting

**Route-Based Splitting:**
```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  optimization: {
    splitChunks: {
      layouts: true,
      pages: true,
      commons: true,
    },
  },
})
```

**Expected Impact:**
- Reduce initial bundle by 20-30%
- Faster First Contentful Paint (FCP)

### Priority 2: Resource Hints

**Preload Critical Assets:**
```vue
<!-- app.vue -->
<template>
  <Html>
    <Head>
      <Link rel="preload" href="/fonts/main.woff2" as="font" crossorigin />
      <Link rel="preconnect" href="https://fonts.googleapis.com" />
    </Head>
  </Html>
</template>
```

**Expected Impact:**
- Faster font loading
- Reduced layout shifts

### Priority 3: Image Optimization

**Responsive Images:**
```html
<picture>
  <source srcset="/icon-192x192.webp" type="image/webp" />
  <source srcset="/icon-192x192.png" type="image/png" />
  <img src="/icon-192x192.png" alt="Wallet Icon" />
</picture>
```

**Expected Impact:**
- 30-50% smaller images with WebP
- Faster page loads

### Priority 4: Database Connection Pooling

**Reuse Database Connections:**
```javascript
// composables/useDatabase.ts
let dbInstance: Database | null = null

export function useDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Dexie('wallet_db')
    // ... setup
  }
  return dbInstance
}
```

**Current Status:** ✅ Already implemented

## Performance Monitoring

### Lighthouse CI

**Automated Testing:**
```bash
# Run locally
npm run lighthouse

# Runs automatically in CI
# .github/workflows/ci.yml
```

**Configuration:**
```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:4173/", ...]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.85}],
        "first-contentful-paint": ["warn", {"maxNumericValue": 2000}]
      }
    }
  }
}
```

### Performance Budget

**Bundle Size Limits:**
| Asset Type | Budget | Current | Status |
|------------|--------|---------|--------|
| JavaScript | 500 KB | 403 KB | ✅ |
| CSS | 50 KB | ~30 KB | ✅ |
| Images | 200 KB | ~50 KB | ✅ |
| Total (gzipped) | 600 KB | 483 KB | ✅ |

### Real User Monitoring (RUM)

**Recommended Tools:**
- **Sentry**: Error tracking + performance
- **LogRocket**: Session replay + monitoring
- **Google Analytics**: Basic timing metrics

**Example Integration:**
```javascript
// plugins/analytics.client.ts
export default defineNuxtPlugin(() => {
  // Track Core Web Vitals
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.value}`)
        // Send to analytics
      }
    })
    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
  }
})
```

## Performance Testing

### Load Testing

**Test with Large Datasets:**
```bash
# Run load tests
npm test tests/load-testing.test.ts

# Tests:
# - 1000+ transaction creation
# - Balance calculations with large datasets
# - Concurrent operations
# - Memory efficiency
```

### Stress Testing

**Browser DevTools:**
```bash
# Chrome DevTools
# 1. Open Performance tab
# 2. Enable CPU throttling (4x slowdown)
# 3. Enable network throttling (Slow 3G)
# 4. Record interaction
# 5. Analyze flame chart
```

**Lighthouse:**
```bash
# Simulate mobile device
npm run lighthouse -- --preset=mobile

# Simulate slow network
npm run lighthouse -- --throttling.cpuSlowdownMultiplier=4
```

## Best Practices

### 1. Avoid Layout Shifts

```css
/* Reserve space for dynamic content */
.transaction-item {
  min-height: 80px;
  contain: layout;
}

/* Use aspect-ratio for images */
img {
  aspect-ratio: 1 / 1;
  width: 100%;
  height: auto;
}
```

### 2. Optimize Event Handlers

```javascript
// Debounce expensive operations
import { debounce } from 'lodash-es'

const handleSearch = debounce((query) => {
  // Expensive search operation
}, 300)
```

### 3. Use Web Workers for Heavy Computation

```javascript
// Future: Move complex calculations to Web Worker
const worker = new Worker('/workers/calculations.js')
worker.postMessage({ type: 'calculate_balance', accountId })
worker.onmessage = (e) => {
  const balance = e.data.balance
}
```

### 4. Minimize Reflows

```javascript
// Batch DOM updates
const fragment = document.createDocumentFragment()
transactions.forEach(tx => {
  const div = document.createElement('div')
  div.textContent = tx.description
  fragment.appendChild(div)
})
container.appendChild(fragment)
```

### 5. Use Passive Event Listeners

```javascript
// Improve scroll performance
element.addEventListener('scroll', handler, { passive: true })
element.addEventListener('touchstart', handler, { passive: true })
```

## Performance Checklist

Before deploying:

- [ ] Run Lighthouse audit (all pages > 85%)
- [ ] Check bundle size (< 600 KB gzipped)
- [ ] Test with CPU throttling (4x slowdown)
- [ ] Test with slow network (Slow 3G)
- [ ] Verify Service Worker caching
- [ ] Check for console errors/warnings
- [ ] Validate Core Web Vitals
- [ ] Test offline functionality
- [ ] Profile memory usage (< 50 MB heap)
- [ ] Test with 500+ transactions

## Resources

- [web.dev - Performance](https://web.dev/learn-web-vitals/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Nuxt Performance](https://nuxt.com/docs/guide/concepts/rendering#performance)
- [Vue Performance](https://vuejs.org/guide/best-practices/performance.html)
- [IndexedDB Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
