# Sticky Note Full-Timeline Dragging Fix

## Problem Summary

Sticky notes were constrained to the original viewport bounds. When users tried to drag notes beyond the viewport height, they would snap back to fit within `window.innerHeight`, making it impossible to position notes anywhere on the timeline.

### User Symptoms
1. Scroll timeline horizontally ✅
2. Try to drag note down beyond initial viewport ❌ Note snaps back
3. Can only position notes within initial screen height ❌

## Root Cause: Overly Restrictive Y Boundary

The `constrainPosition` function was enforcing an artificial upper bound on Y coordinates:

```javascript
// BEFORE (buggy)
const maxY = Math.max(0, window.innerHeight - NOTE_HEIGHT - padding);

return {
  x: Math.max(padding, Math.min(x, maxX)),
  y: Math.max(padding, Math.min(y, maxY)),  // ❌ Constrains to viewport!
};
```

**Why this was wrong:**
- `window.innerHeight` = visible viewport height (typically 1080px)
- This prevents notes from being positioned below the visible area
- Users couldn't drag notes to arbitrary Y positions on the timeline

## Solution: Remove Y Upper Bound

Allow notes to be positioned anywhere vertically while preserving X constraints:

```javascript
// AFTER (fixed)
const maxX = Math.max(0, document.documentElement.scrollWidth - NOTE_WIDTH - padding);

return {
  x: Math.max(padding, Math.min(x, maxX)),  // ✅ Keep X constraint
  y: Math.max(padding, y),                   // ✅ No upper Y limit!
};
```

## Implementation

**File**: `src/components/StickyNote.tsx`
**Lines**: 55-67 (constrainPosition function)

### Changes
1. **Removed `maxY` calculation** - No longer constrains to viewport height
2. **Changed Y return** - From `Math.min(y, maxY)` to just `y` with minimum padding
3. **Added comments** - Clarified that X and Y have different constraints

### New Logic
```
X-axis (horizontal):
  - Min: 20px padding from left
  - Max: Document width - note width - 20px padding
  - Reason: Keep notes within scrollable timeline bounds

Y-axis (vertical):
  - Min: 20px padding from top
  - Max: Unlimited (allow placing anywhere on timeline)
  - Reason: Timeline doesn't scroll vertically, but notes can be placed anywhere
```

## Why This Works

### Coordinate System
- Sticky notes use **absolute positioning** within the timeline canvas
- The timeline canvas has `height: 100vh` (full viewport height)
- Users can place notes anywhere within that height range
- There's no reason to enforce an upper limit

### User Expectations
- Users expect to be able to place sticky notes anywhere on the timeline
- Viewport height is an arbitrary constraint
- Allowing full Y range gives maximum freedom

## Complete Drag Flow (With All Fixes)

```
1. Drag Start (handleDragHandleMouseDown):
   - Get scroll offsets: scrollX, scrollY (handles page scrolling)
   - Store page-absolute coordinates: clientX + scrollX, clientY + scrollY
   
2. During Drag (handleMouseMove):
   - Recalculate scroll position (user might scroll while dragging)
   - Calculate delta: (clientX + scrollX) - dragStart.x
   - Update dragOffset for real-time visual feedback
   
3. On Release (handleMouseUp):
   - Get final scroll position
   - Calculate final position: positionStart + delta
   - Apply constrainPosition:
     * X: Clamped to [20, maxX]
     * Y: Clamped to [20, ∞)
   - Call onPositionChange to persist
   - Reset drag state
```

## Verification

### Expected Behavior
✅ Drag notes vertically without upper limit  
✅ Drag notes horizontally within timeline bounds  
✅ Notes stay at drop position (no snapping)  
✅ Position persists across refresh  
✅ Works while timeline is scrolling  
✅ Works after page scroll  

### Test Scenario
1. Create sticky note in viewport center
2. Scroll timeline area
3. Drag note downward past viewport height
4. **Expected**: Note follows cursor (not snapped back)
5. Release note
6. **Expected**: Note stays at release position
7. Refresh page
8. **Expected**: Note appears at saved position

## Related Fixes

This fix completes the sticky note dragging suite:
1. ✅ **Position Snap-Back Fix**: Solved closure issue in mouseUp handler
2. ✅ **Scroll-Aware Fix**: Added scroll offset awareness for page scrolling
3. ✅ **Viewport Binding Fix** (this fix): Removed Y upper bound constraint

## Files Modified
- `src/components/StickyNote.tsx` (constrainPosition function)

## Status: ✅ FIXED & COMPLETE

Sticky notes now fully support dragging across the entire timeline with no arbitrary viewport constraints. Users can position notes anywhere vertically while X is properly bounded to the scrollable timeline width.
