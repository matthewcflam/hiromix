# Timeline Ruler Fix - Thick Ticks Issue

## Problem
Some ticks in the timeline ruler were appearing 2px wide instead of 1px, despite all ticks except the active ticker being explicitly set to 1px width.

## Root Cause Analysis
After extensive debugging, the issue was identified as:

1. **Framer Motion width animation**: Animating the `width` property was causing rendering issues where ticks would appear thicker than intended. This likely occurred because:
   - Multiple animation states were overlapping
   - Browser sub-pixel rendering combined with animations
   - Animation transitions not completing cleanly between states

2. **Missing month labels**: The Map-based deduplication was working correctly but wasn't preserving month label metadata when multiple ticks landed at the same rounded position.

## Solution Implemented

### Fix 1: Static Width via className
**Removed width from animation** - Instead of animating width, now using static Tailwind classes:
- Active tick: `className='w-[2px]'` (2px wide, black, 40px tall)
- All other ticks: `className='w-[1px]'` (1px wide, grey)

This ensures the width is **never animated** and is purely controlled by CSS, eliminating the animation-related rendering issues.

### Fix 2: Preserve Month Labels in Deduplication
When multiple ticks round to the same X position, the Map deduplication now:
- Checks if the incoming tick has a month label
- If yes, it updates the existing tick to preserve the `isMonthStart` flag and `monthLabel`
- This ensures month labels are never lost during deduplication

## Code Changes

### TimelineCarousel.tsx - Tick Generation (Lines 99-108, 115-127)
```typescript
// OLD: Lost month labels on duplicate positions
if (!tickMap.has(roundedX)) {
  tickMap.set(roundedX, { ... });
}

// NEW: Preserve month labels
const existing = tickMap.get(roundedX);
if (!existing) {
  tickMap.set(roundedX, { ... });
} else if (isFirstTick && isMonthStart && !existing.monthLabel) {
  existing.isMonthStart = true;
  existing.monthLabel = `${MONTHS[currentMonth]} ${new Date(item.date).getFullYear()}`;
}
```

### TimelineCarousel.tsx - Tick Rendering (Lines 434-474)
```typescript
// OLD: Animated width property
animate={{
  width: tickWidth,
  height: tickHeight,
  backgroundColor: tickColor,
}}

// NEW: Static width via className
<motion.div
  className={isActive ? 'w-[2px]' : 'w-[1px]'}
  animate={{
    height: tickHeight,
    backgroundColor: tickColor,
  }}
/>
```

## Expected Results
- ✅ All ticks are exactly 1px wide (except active ticker at 2px)
- ✅ Month labels appear correctly on the first photo of each month
- ✅ Wave animation continues to work smoothly
- ✅ Active ticker is 40px tall, 2px wide, black
- ✅ No more random thick ticks appearing in the ruler

## Testing
1. Open the development server
2. Scroll through the timeline carousel
3. Verify all ticks are uniform 1px width except the active tick
4. Check that month labels appear below the ruler at appropriate intervals
5. Confirm wave animation still works as photos scroll

## Technical Notes
- This approach separates **static properties** (width via CSS) from **animated properties** (height, color via Framer Motion)
- Using Tailwind's arbitrary values `w-[1px]` and `w-[2px]` ensures pixel-perfect rendering
- Map deduplication remains in place to prevent overlapping ticks at the same position
- Month label logic preserves labels even when ticks collide at rounded positions
