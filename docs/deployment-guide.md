# Deployment Guide

This guide covers deploying the Wallet PWA to various platforms.

---

## Table of Contents

1. [Build for Production](#build-for-production)
2. [GitHub Pages](#github-pages)
3. [Vercel](#vercel)
4. [Netlify](#netlify)
5. [Self-Hosting](#self-hosting)
6. [Firebase Hosting](#firebase-hosting)

---

## Build for Production

### Static Site Generation (Recommended)

```bash
# Generate static files
npm run generate

# Output will be in .output/public/
```

The generated site includes:
- Pre-rendered HTML pages
- Optimized JavaScript bundles (403 KB gzipped)
- Service worker for offline functionality
- PWA manifest for installability

### Node Server (Alternative)

```bash
# Build for Node.js server
npm run build

# Preview locally
npm run preview

# Run in production
node .output/server/index.mjs
```

---

## GitHub Pages

### Option 1: Manual Deployment

```bash
# Generate static site
npm run generate

# Deploy .output/public/ to gh-pages branch
npx gh-pages -d .output/public
```

### Option 2: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Prepare Nuxt
        run: npx nuxi prepare
      
      - name: Generate static site
        run: npm run generate
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: .output/public
      
      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

### Configuration

Update `nuxt.config.ts` for GitHub Pages:

```typescript
export default defineNuxtConfig({
  app: {
    baseURL: process.env.NODE_ENV === 'production' 
      ? '/wallet/'  // Repository name
      : '/',
  },
})
```

---

## Vercel

### Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Deploy via Git Integration

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `.output/public`
   - **Install Command**: `npm install`

Vercel will auto-deploy on every push to main branch.

---

## Netlify

### Deploy via CLI

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build site
npm run generate

# Deploy
netlify deploy --prod --dir=.output/public
```

### Deploy via Git Integration

1. Push code to GitHub
2. Create new site on [netlify.com](https://netlify.com)
3. Configure build settings:
   - **Build Command**: `npm run generate`
   - **Publish Directory**: `.output/public`

Create `netlify.toml` for configuration:

```toml
[build]
  command = "npm run generate"
  publish = ".output/public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Self-Hosting

### Using nginx

1. **Build the site:**
   ```bash
   npm run generate
   ```

2. **Copy files to web server:**
   ```bash
   scp -r .output/public/* user@server:/var/www/wallet
   ```

3. **Configure nginx:**
   ```nginx
   server {
       listen 80;
       server_name wallet.example.com;
       
       root /var/www/wallet;
       index index.html;
       
       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
       
       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       # PWA service worker
       location /sw.js {
           add_header Cache-Control "no-cache";
           proxy_cache_bypass $http_pragma;
           proxy_cache_revalidate on;
       }
       
       # SPA fallback
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

4. **Enable HTTPS (recommended):**
   ```bash
   sudo certbot --nginx -d wallet.example.com
   ```

### Using Apache

1. **Build and copy files** (same as nginx)

2. **Configure Apache** (`.htaccess`):
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       
       # Don't rewrite files or directories
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       
       # Rewrite everything else to index.html
       RewriteRule . /index.html [L]
   </IfModule>
   
   # Cache static assets
   <IfModule mod_expires.c>
       ExpiresActive On
       ExpiresByType image/x-icon "access plus 1 year"
       ExpiresByType image/svg+xml "access plus 1 year"
       ExpiresByType text/css "access plus 1 year"
       ExpiresByType application/javascript "access plus 1 year"
   </IfModule>
   
   # Gzip compression
   <IfModule mod_deflate.c>
       AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript text/xml application/xml
   </IfModule>
   ```

---

## Firebase Hosting

### Deploy Static Site

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase:**
   ```bash
   firebase init hosting
   ```
   
   Configuration:
   - Public directory: `.output/public`
   - Single-page app: Yes
   - GitHub actions: Optional

4. **Build and deploy:**
   ```bash
   npm run generate
   firebase deploy --only hosting
   ```

### `firebase.json` Configuration

```json
{
  "hosting": {
    "public": ".output/public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "sw.js",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      }
    ]
  }
}
```

---

## Post-Deployment Checklist

After deploying to any platform, verify:

- [ ] Site loads correctly at production URL
- [ ] PWA installable (check for install prompt)
- [ ] Service worker activates (check DevTools > Application > Service Workers)
- [ ] Offline mode works (disable network in DevTools)
- [ ] All pages navigate correctly
- [ ] IndexedDB operations work
- [ ] HTTPS enabled (required for PWA)
- [ ] Firebase sync works (if configured by user)

---

## Environment Variables

The app doesn't require server-side environment variables since it's:
- Local-first (data in IndexedDB)
- BYOB architecture (users configure their own Firebase)

However, you can set build-time variables:

```bash
# .env (for local development)
NODE_ENV=production
BASE_URL=/wallet/

# Vercel/Netlify (via dashboard)
NODE_ENV=production
```

---

## Performance Optimization

### Enable Compression

Most platforms enable gzip/brotli automatically:
- ✅ Vercel
- ✅ Netlify
- ✅ Firebase Hosting
- ⚠️ GitHub Pages (limited)
- ⚙️ Self-hosted (requires configuration)

### CDN Configuration

For self-hosted deployments, consider using a CDN:
- Cloudflare (free tier available)
- AWS CloudFront
- Google Cloud CDN

### Service Worker Updates

The PWA will auto-update when:
1. New version deployed
2. User visits site
3. Service worker detects changes
4. User sees update notification

---

## Troubleshooting

### Issue: PWA Not Installing

**Solution:**
- Ensure HTTPS enabled
- Check manifest.json loads correctly
- Verify service worker registers
- Check console for errors

### Issue: Routes Return 404

**Solution:**
- Configure SPA fallback routing (see platform sections above)
- Ensure all requests redirect to `index.html`

### Issue: Assets Not Loading

**Solution:**
- Check `baseURL` in `nuxt.config.ts`
- Verify asset paths are relative
- Check browser console for 404s

### Issue: Service Worker Not Updating

**Solution:**
- Clear browser cache
- Unregister old service worker
- Hard refresh (Ctrl+Shift+R)

---

## Monitoring

### Recommended Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance**: Google Lighthouse, WebPageTest
- **Error Tracking**: Sentry (optional)
- **Analytics**: Plausible, Umami (privacy-friendly)

### Lighthouse Audit

```bash
# Install Lighthouse CLI
npm i -g @lhci/cli

# Run audit
lhci autorun --collect.url=https://your-site.com
```

Target scores:
- Performance: > 90
- Accessibility: 100
- Best Practices: > 90
- SEO: > 90
- PWA: 100

---

## Security Considerations

### HTTPS

**Required** for PWA functionality:
- Service workers only work over HTTPS
- Installability requires HTTPS
- Some APIs require secure context

### Content Security Policy

Add CSP headers (recommended):

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://firebasestorage.googleapis.com https://firestore.googleapis.com;
```

### Firebase Security

If users enable sync:
- They configure their own Firebase project
- They manage their own Firestore security rules
- See `docs/firestore-security-rules.md` for guidelines

---

## Support

For deployment issues:
- Check [GitHub Issues](https://github.com/kehwar/wallet/issues)
- Review [DEVELOPMENT.md](DEVELOPMENT.md)
- Consult platform documentation

---

**Happy Deploying! 🚀**
