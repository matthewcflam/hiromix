# Timeline Ticker Debug

## Current Implementation (Lines 391-412)

All ticks should be 1px wide except the current (active) tick which is 2px.

### Logic:
```typescript
const baseHeight = 16;
const activeHeight = 40;
let tickHeight = baseHeight;
let tickWidth = 1; // ALL base ticks start at 1px

if (isActive) {
  tickHeight = activeHeight;
  tickWidth = 2; // ONLY active tick is 2px
  tickColor = '#000000';
} else if (wasRecentlyActive && timeSinceActive < 500) {
  // Wave animation
  tickWidth = 1; // Wave ticks explicitly stay 1px
  // ... height animation
}
// All other ticks remain: tickWidth = 1 (default)
```

### What Should Happen:
- Regular tick: 1px wide, 16px tall, light grey
- Active tick: 2px wide, 40px tall, black
- Wave ticks: 1px wide, animate from 40px → 16px, light grey

### No "Every 5th Tick" Logic
The code has NO condition checking for `i % 5` or any day-5 logic.

## Possible Causes of Thickness Issue:

1. **Browser cache** - Old JavaScript still loaded
2. **CSS interference** - Some global style affecting tick rendering
3. **Framer Motion state** - Motion component holding onto old animated values
4. **Pixel rendering** - Sub-pixel rendering making some ticks appear thicker

## Fix Applied:
- Moved `width` from `style` prop to `animate` prop for explicit animation control
- Added width transition with `duration: 0.1, ease: "linear"`
- Ensured all non-active paths set `tickWidth = 1`

## To Verify Fix:
1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Restart dev server: `npm run dev`
4. Check browser DevTools → Elements to inspect actual tick widths
