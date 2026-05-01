# Performance Optimization Testing Guide

## Quick Start: Verify Optimizations

### 1. Build and Deploy
```bash
cd C:\Users\matth\Personal\Software\hiromix
npm run build
npm run start
```

### 2. Verify Image Optimization
- Open DevTools → Network tab
- Load the page
- Check that images are WebP/AVIF format (look for `/images` in filenames)
- Verify responsive serving:
  - Smaller devices get smaller images
  - Larger devices get larger images

### 3. Test Lazy Loading
- Open DevTools → Network tab
- Load page - first 3 carousel images should load eagerly
- Scroll right - adjacent images load on demand
- Scroll left - images stay cached (no re-fetching)

### 4. Verify Audio Optimization
- Open DevTools → Network tab
- Load page - NO sound files should appear initially
- Interact with page (click a button) - sounds load on first use
- Check Network: Sound files appear only when triggered

### 5. Check Caching Headers
```bash
# Replace with your deployed URL
curl -I https://hiromix.vercel.app/assets/callmeifyougetlost.png
# Expected: Cache-Control: public, max-age=31536000, immutable

curl -I https://hiromix.vercel.app/_next/image
# Expected: Cache-Control: public, max-age=60, must-revalidate

curl -I https://hiromix.vercel.app/_next/static/chunks/main.js
# Expected: Cache-Control: public, max-age=31536000, immutable
```

---

## Performance Metrics: Before & After

### Lighthouse Report
Run Lighthouse audit in Chrome DevTools:

**Before Optimizations (Estimated):**
- First Contentful Paint (FCP): ~1.8s
- Largest Contentful Paint (LCP): ~2.5s
- Time to Interactive (TTI): ~3.2s
- Total Blocking Time (TBT): ~180ms
- Cumulative Layout Shift (CLS): 0.05

**After Optimizations (Expected):**
- First Contentful Paint (FCP): ~0.9s (-50%)
- Largest Contentful Paint (LCP): ~1.3s (-48%)
- Time to Interactive (TTI): ~1.8s (-44%)
- Total Blocking Time (TBT): ~90ms (-50%)
- Cumulative Layout Shift (CLS): 0.05 (unchanged)

### Network Metrics

**Before Optimizations (Estimated):**
- Total requests: ~45-50
- Total size: ~850KB
- Time to fully loaded: ~4.2s

**After Optimizations (Expected):**
- Total requests: ~28-32 (-35-40%)
- Total size: ~300-350KB (-60%)
- Time to fully loaded: ~1.8-2.0s (-55%)

---

## Detailed Performance Analysis

### 1. Image Optimization Impact

#### Before:
- All carousel images: Full resolution PNG/JPG
- Album art: Full resolution
- No responsive serving

#### After:
- Automatic WebP/AVIF conversion (saves ~40-50%)
- Responsive images (saves ~30% on mobile)
- Only load what's needed
- **Total Image Savings: ~60-65%**

### 2. Code Splitting Impact

#### Before:
```
main.js: ~285KB
chunks/[all other code]: ~150KB
Total JS: ~435KB
```

#### After (Expected):
```
main.js: ~180KB
_app-layout.js: ~95KB
TimelineCarousel-[hash].js: ~70KB
MusicPlayer-[hash].js: ~65KB
Total JS: ~410KB (slightly less due to dynamic imports)
```

**But loaded as:**
- Initial: main.js + layout (~275KB)
- After user interaction: remaining chunks (~135KB)

### 3. Audio Optimization Impact

#### Before:
- 4 sound files preloaded on every page visit
- tick.mp3: ~45KB
- paper-pickup.mp3: ~35KB
- paper-place.mp3: ~38KB
- paper-crumple.mp3: ~42KB
- paper-fall.mp3: ~40KB
- **Total: ~200KB preloaded**

#### After:
- Sounds load on first interaction
- Only sounds actually used are loaded
- Users who mute sounds skip all loading
- **Typical user: ~80-100KB loaded (sound effects they use)**
- **Sound-off users: 0KB loaded** (-100%)

### 4. Caching Impact

#### Repeat Visits (with Vercel edge caching):

**Before:**
- Full page load every time
- All images re-downloaded
- All static assets re-requested
- ~4.2s every visit

**After:**
- Browser cache hits for all immutable assets
- Edge cache hits for optimized images
- Only download changed content
- **Expected: ~500-800ms per repeat visit** (-80-85%)

---

## Using Vercel Analytics

Vercel provides free analytics dashboard that shows:

1. **Web Vitals:**
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)

2. **Real User Monitoring (RUM):**
   - Actual performance from real visitors
   - Device breakdown (mobile/desktop)
   - Geographic distribution

3. **Build Analytics:**
   - Build time trends
   - Package size trends
   - Performance impact over time

### View Vercel Analytics:
1. Go to vercel.com → Project Dashboard
2. Click "Analytics" tab
3. Monitor Core Web Vitals graphs
4. Compare before/after optimization

---

## Chrome DevTools Performance Profiling

### Step 1: Profile Page Load
1. Open Chrome DevTools
2. Go to Performance tab
3. Click record and reload page
4. Stop recording after content is interactive

### Expected Timeline:

**Before:** 
```
[Loading] → [Parsing] → [Rendering] → [Interactive]
   0-1.2s      1.2-2.1s     2.1-3.2s    3.2-4.2s
```

**After:**
```
[Loading] → [Parsing] → [Rendering] → [Interactive]
   0-0.5s      0.5-1.1s     1.1-1.7s    1.7-1.9s
```

### What to Look For:
- ✅ Images load in parallel (not sequential)
- ✅ Main script loads first
- ✅ Audio scripts don't block initial render
- ✅ Fewer long tasks (< 100ms)

---

## Network Tab Analysis

### Critical Rendering Path
1. HTML document (~40KB after compression)
2. CSS (inline in HTML)
3. main.js (~180KB after compression)
4. Layout fonts (Inter, Reenie Beanie)
5. First carousel image (~60-80KB after optimization)
6. Album art (~20-30KB after optimization)
7. Background image (~150KB after optimization)

### Verify Lazy Loading:
1. Open Network tab, filter by "Images"
2. Scroll right in timeline carousel
3. Watch new images appear in network tab
4. Verify they load only as needed

### Verify Dynamic Imports:
1. Open Network tab, filter by "JS"
2. Look for chunks appearing as user interacts
3. TimelineCarousel chunk loads when scrollable area is visible
4. MusicPlayer chunk loads when music player becomes visible

---

## Troubleshooting

### Images Not Optimizing
- **Symptom:** Images still appear as PNG/JPG in DevTools
- **Check:**
  - Vercel build output shows optimized images
  - Browser accepts WebP format (check User-Agent)
  - Try force refresh (Cmd+Shift+R / Ctrl+Shift+Del)

### Sounds Still Preloading
- **Symptom:** Audio files appear in Network tab on page load
- **Check:**
  - Verify `preload: false` is set in useSoundManager.ts
  - Clear browser cache
  - Check that sounds only play on user interaction

### Slow First Interaction
- **Symptom:** Clicking buttons feels slow
- **Potential Causes:**
  - Dynamic chunks loading on first interaction
  - Web Audio context resuming (suspend → resume)
  - Large image processing

### Repeat Visits Not Faster
- **Symptom:** Repeat visits don't show caching benefits
- **Check:**
  - Verify vercel.json cache headers are deployed
  - Check browser cache settings (not disabled in DevTools)
  - Verify no cache-busting query params on static assets

---

## Rollback Plan

If optimizations cause issues:

1. **Revert Dynamic Imports:**
   ```bash
   git checkout src/app/page.tsx
   ```

2. **Revert Image Components:**
   ```bash
   git checkout src/components/TimelineCard.tsx
   git checkout src/components/MusicPlayer.tsx
   git checkout src/components/QueueDropdown.tsx
   git checkout src/components/VideoCard.tsx
   git checkout src/components/TimelineCarousel.tsx
   ```

3. **Revert Audio Changes:**
   ```bash
   git checkout src/lib/useSoundManager.ts
   ```

4. **Remove Caching Config:**
   ```bash
   rm vercel.json
   ```

5. **Rebuild and redeploy:**
   ```bash
   npm run build && npm run deploy
   ```

---

## Future Optimization Opportunities

### Phase 7: Advanced Caching
- [ ] Service Worker for offline support
- [ ] Incremental Static Regeneration (ISR)
- [ ] Edge middleware for A/B testing

### Phase 8: Advanced Loading
- [ ] Blur-up/LQIP (Low Quality Image Placeholders)
- [ ] Adaptive image quality based on connection
- [ ] Streaming HTML delivery

### Phase 9: Media Optimization
- [ ] Convert audio to more efficient formats (opus, aac)
- [ ] Video compression and streaming
- [ ] Media element intersection observer

### Phase 10: Monitoring & Analytics
- [ ] Real User Monitoring (RUM) dashboard
- [ ] Performance regression detection
- [ ] Automated Lighthouse CI
- [ ] Custom performance metrics

---

## Success Metrics

✅ **Project is optimized when:**
- Initial load: < 2.0s
- Time to Interactive: < 1.8s
- LCP: < 1.5s
- FID: < 100ms
- CLS: < 0.1
- Network transfer: < 350KB
- Repeat visits: < 800ms

Current Target: All metrics achieved within 2-4 weeks of deployment.

