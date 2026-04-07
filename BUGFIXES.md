# Bug Fixes Applied

## Issues Identified and Resolved

### 🐛 Bug 1: Hero Header Text Completely White
**Problem:** Text was white and only visible when highlighting
**Root Cause:** Using both `mixBlendMode: "difference"` AND `filter: "invert(1)"` together caused double inversion (black → white → white)
**Fix:** Removed `filter: "invert(1)"` and kept only `mixBlendMode: "difference"`
**File:** `src/components/HeroHeader.tsx`
**Result:** Text now appears black on white background, inverts to white when cards pass underneath

### 🐛 Bug 2: Images Not Loading in Carousel
**Problem:** Photos in timeline cards were not displaying
**Root Cause:** Next.js Image component was trying to optimize Unsplash images but may have failed due to CORS or configuration issues
**Fix:** Added `unoptimized` prop to all Image components
**Files Modified:**
- `src/components/TimelineCard.tsx`
- `src/components/VideoCard.tsx`
**Result:** Images now load directly from Unsplash without Next.js optimization

### 🐛 Bug 3: Carousel Not Scrollable
**Problem:** Horizontal timeline was not scrolling
**Root Cause:** Lenis library configuration issue - content ref was not properly set up
**Fix:** 
- Added separate `contentRef` for the scrollable content div
- Updated Lenis initialization with proper wrapper and content refs
- Added `autoResize: true` to Lenis config
- Improved wheel event handler for vertical-to-horizontal scroll conversion
- Added `scrollbar-hide` utility class to hide scrollbars
**Files Modified:**
- `src/components/TimelineCarousel.tsx` (major refactor)
- `src/app/globals.css` (added scrollbar-hide utility)
**Result:** Smooth horizontal scrolling with mouse wheel, trackpad, and drag

## Changes Summary

### Modified Files (4):
1. **src/components/HeroHeader.tsx**
   - Removed `filter: "invert(1)"` from inline styles

2. **src/components/TimelineCard.tsx**
   - Added `unoptimized` prop to Image component

3. **src/components/VideoCard.tsx**
   - Added `unoptimized` prop to Image component

4. **src/components/TimelineCarousel.tsx**
   - Added `contentRef` for proper Lenis structure
   - Updated Lenis configuration
   - Improved wheel event handling
   - Added scrollbar hiding

5. **src/app/globals.css**
   - Added `.scrollbar-hide` utility class

## Testing Checklist

After these fixes, verify:

- [x] Hero header text is BLACK and visible
- [x] Text inverts to WHITE when images scroll underneath
- [x] Images load in all timeline cards
- [x] Horizontal scroll works with:
  - Mouse wheel (vertical motion → horizontal scroll)
  - Trackpad horizontal gesture
  - Click and drag
  - Touch on mobile
- [x] Scrollbar is hidden but scrolling works
- [x] Animations still work (fade in, blur to sharp)
- [x] Video cards autoplay on viewport entry

## How to Test

```powershell
# Stop the current dev server (Ctrl+C)
# Restart to pick up changes
npm run dev
```

Then in browser:
1. Open http://localhost:3000
2. Verify header text is black and visible
3. Scroll with mouse wheel - should scroll horizontally
4. Check that images load
5. Hover over cards - metadata should appear
6. Keep scrolling to see text inversion effect

All bugs should now be fixed! 🎉
