# Browser Compatibility Guide

## Supported Browsers

The Wallet PWA is designed to work on modern browsers that support:
- IndexedDB
- Service Workers
- ES2020+ JavaScript features
- CSS Grid and Flexbox

### Desktop Browsers

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| **Chrome** | 90+ | ✅ Fully Supported | Primary development browser |
| **Edge** | 90+ | ✅ Fully Supported | Chromium-based, same as Chrome |
| **Firefox** | 88+ | ✅ Supported | Tested regularly |
| **Safari** | 14+ | ⚠️ Mostly Supported | Some PWA features limited |
| **Opera** | 76+ | ✅ Supported | Chromium-based |

### Mobile Browsers

| Browser | Platform | Version | Status | Notes |
|---------|----------|---------|--------|-------|
| **Chrome** | Android | 90+ | ✅ Fully Supported | Best experience |
| **Safari** | iOS | 14+ | ⚠️ Mostly Supported | Install limited, sync works |
| **Samsung Internet** | Android | 14+ | ✅ Supported | Chromium-based |
| **Firefox** | Android | 88+ | ✅ Supported | Good compatibility |

## Known Issues and Limitations

### Safari (iOS/macOS)

**PWA Installation:**
- iOS: Can add to home screen but limited standalone features
- macOS: No native install prompt (must use Share → Add to Dock)

**IndexedDB:**
- Storage limits more restrictive than Chrome
- May prompt for storage permission

**Service Worker:**
- Caching works but updates may be slower
- Background sync not fully supported

### Firefox

**PWA Installation:**
- Desktop: No native install prompt
- Android: Full PWA support

**IndexedDB:**
- Fully supported
- Performance comparable to Chrome

### Workarounds

**Safari iOS Standalone Mode:**
```javascript
// Detect standalone mode
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
```

**Storage Persistence:**
```javascript
// Request persistent storage (Chrome/Edge)
if (navigator.storage && navigator.storage.persist) {
  const isPersisted = await navigator.storage.persist()
  console.log(`Persistent storage: ${isPersisted}`)
}
```

## Testing Strategy

### Automated Testing
- **Unit Tests**: Run on Node.js environment (browser-agnostic)
- **E2E Tests**: Playwright tests Chrome, Firefox, WebKit (Safari engine)
- **Lighthouse CI**: Tests performance on Chromium

### Manual Testing Checklist

#### Core Functionality (All Browsers)
- [ ] Create/edit/delete accounts
- [ ] Create transactions (Expense, Income, Transfer)
- [ ] View reports
- [ ] Calculate balances correctly
- [ ] Multi-currency conversion

#### PWA Features
- [ ] Install prompt appears (Chrome/Edge)
- [ ] Add to home screen works (Mobile)
- [ ] Offline functionality
- [ ] Service worker caches assets
- [ ] Update notification appears

#### Performance
- [ ] Page load < 3 seconds
- [ ] Smooth scrolling with 100+ transactions
- [ ] No visible layout shifts
- [ ] Forms respond quickly

### Testing Tools

**BrowserStack / Sauce Labs:**
- Test on real devices
- Multiple OS versions
- Network throttling

**Local Testing:**
```bash
# Chrome DevTools Device Mode
# Test responsive layouts and mobile features

# Firefox Responsive Design Mode
# Test on different screen sizes

# Safari Web Inspector
# Test on macOS/iOS
```

## Feature Detection

The app uses feature detection to gracefully handle missing browser features:

```javascript
// Check for Service Worker support
if ('serviceWorker' in navigator) {
  // Register service worker
} else {
  console.warn('Service Worker not supported')
}

// Check for IndexedDB
if ('indexedDB' in window) {
  // Use IndexedDB
} else {
  throw new Error('IndexedDB required')
}

// Check for Firebase support (optional)
try {
  await import('firebase/app')
} catch (error) {
  console.warn('Firebase not available, sync disabled')
}
```

## Progressive Enhancement

The app follows progressive enhancement principles:

1. **Core Functionality**: Works without JavaScript (static HTML)
2. **Enhanced Experience**: Full app with JavaScript enabled
3. **PWA Features**: Install, offline, background sync (when supported)
4. **Sync**: Firebase sync (optional, user-configured)

## Browser-Specific CSS

```css
/* Safari-specific fixes */
@supports (-webkit-touch-callout: none) {
  .ios-only {
    /* iOS Safari specific styles */
  }
}

/* Firefox-specific fixes */
@-moz-document url-prefix() {
  .firefox-only {
    /* Firefox specific styles */
  }
}
```

## Polyfills

The app uses minimal polyfills:

**Not Needed:**
- ES6+ features (modern browsers only)
- Fetch API (widely supported)
- Promises (native support)

**Optional:**
- Decimal.js (for precise math, always loaded)
- Firebase SDK (lazy loaded, optional)

## Minimum Requirements

**Must Have:**
- IndexedDB support
- ES2020 JavaScript
- CSS Grid
- Service Worker (for PWA features)

**Nice to Have:**
- Push Notifications (not used currently)
- Background Sync (not used currently)
- Web Share API (for sharing reports)

## Deprecation Policy

**Browser Support Timeline:**
- Drop support 2 years after browser EOL
- Maintain support for current - 2 major versions
- Security updates for current - 1 major version

## Reporting Compatibility Issues

When reporting browser compatibility issues, please include:

1. Browser name and version
2. Operating system and version
3. Device type (desktop/mobile/tablet)
4. Steps to reproduce
5. Expected vs actual behavior
6. Console errors (if any)
7. Screenshot or video (if relevant)

## Performance Targets by Browser

| Browser | LCP | FID | CLS | FCP |
|---------|-----|-----|-----|-----|
| Chrome/Edge | < 2.5s | < 100ms | < 0.1 | < 1.8s |
| Firefox | < 3.0s | < 100ms | < 0.1 | < 2.0s |
| Safari | < 3.5s | < 150ms | < 0.15 | < 2.5s |

*LCP = Largest Contentful Paint, FID = First Input Delay, CLS = Cumulative Layout Shift, FCP = First Contentful Paint*

## Resources

- [Can I Use](https://caniuse.com/) - Browser feature support tables
- [MDN Web Docs](https://developer.mozilla.org/) - Browser compatibility data
- [web.dev](https://web.dev/) - Performance and best practices
- [PWA Builder](https://www.pwabuilder.com/) - PWA testing and validation
