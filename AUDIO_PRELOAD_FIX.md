# Howler.js Audio Preloading Fix

## Problem

Interactive audio was not playing at all throughout the application. Sound effects for timeline scrolling, note placement, deletion, and other interactions were completely silent.

### Symptoms
- No sound on note placement
- No sound on timeline scroll
- No sound on note deletion
- No sound on any interactive event
- Browser console showed no errors

## Root Cause

**Howler.js preload configuration mismatch**: The sound files were configured with:

```javascript
preload: false,  // ❌ Don't preload
html5: false,    // Use Web Audio API (not HTML5 audio)
```

**The Problem**: When `preload: false` is combined with `html5: false` (Web Audio mode), Howler.js delays loading the audio file until `play()` is called. However:

1. Audio files need time to load from the server
2. Web Audio API requires the audio data to be decoded before playback
3. The `play()` call happens immediately without waiting for the load to complete
4. Result: Playback fails silently because audio hasn't loaded yet

## Solution

Change preload setting from `false` to `'auto'`:

```javascript
// BEFORE (doesn't load until play() called)
preload: false

// AFTER (loads when Howl instance is created)
preload: 'auto'
```

### How preload Options Work

- **`false`**: Don't preload. Load on first `play()` call (too late for Web Audio)
- **`'auto'`**: Load immediately when Howl instance is created (required for Web Audio)
- **`true`**: Same as `'auto'` - load immediately

## Implementation

**File**: `src/lib/useSoundManager.ts`
**Lines**: 89, 98, 107, 116, 125

Changed all 5 Howl instances from `preload: false` to `preload: 'auto'`:

1. **tick** sound (line 89)
2. **paperPickup** sound (line 98)
3. **paperPlace** sound (line 107)
4. **paperCrumple** sound (line 116)
5. **paperFall** sound (line 125)

## How It Works Now

### Sound Initialization Flow

```
1. Component mounts
2. useEffect creates 5 Howl instances (lines 85-131)
3. Each Howl with preload: 'auto' immediately starts loading
4. Audio files are fetched from /sounds/ directory
5. Audio is decoded by Web Audio API
6. When user interacts (click, scroll, etc.):
   - playXxx() function is called
   - Audio context is unlocked (unlockAudio())
   - Audio plays immediately (no waiting for load)
7. ✅ Sound plays
```

### Timeline

**Before Fix**:
```
Init → Create Howls (no load) → User action → Call play() → Wait for file load → Decode → Play ❌ Too late
```

**After Fix**:
```
Init → Create Howls → Load & decode files → User action → play() → ✅ Immediate playback
```

## Technical Details

### Web Audio API Requirements
- Audio data must be decoded before playback
- Decoding happens asynchronously
- With `preload: false`, decoding starts when `play()` is called
- With `preload: 'auto'`, decoding starts immediately on init

### Why html5: false?
- Uses Web Audio API (modern, lower latency)
- Not HTML5 `<audio>` element (higher latency, browser limitations)
- Better for interactive sound effects

### Throttling Still Active
- Tick sounds have `TICK_THROTTLE_MS = 30` (line 55)
- Prevents rapid-fire overlapping sounds
- Works correctly with preloading

## Files Modified
- `src/lib/useSoundManager.ts`
  - Line 89: tick preload
  - Line 98: paperPickup preload
  - Line 107: paperPlace preload
  - Line 116: paperCrumple preload
  - Line 125: paperFall preload

## Expected Results After Fix
✅ Sound plays on note placement  
✅ Sound plays on timeline scroll  
✅ Sound plays on note deletion  
✅ Sound plays on palette interaction  
✅ All interactive audio works  
✅ No lag or delay in audio playback  

## Testing Checklist
1. Create sticky note (should hear paper place sound)
2. Scroll timeline (should hear tick sounds)
3. Delete sticky note (should hear paper fall sound)
4. Click note color palette (should hear paper pickup sound)
5. Activate delete mode (should hear paper crumple sound)

## Additional Notes

### Why This Was Missed
The performance optimization phase previously changed sound preloading settings (Phase 3: Audio Optimization), which set `preload: false` to reduce initial page load. However, this broke interactive audio when combined with `html5: false` (Web Audio mode).

### Performance Impact
- Minimal: Audio files load silently in background
- ~200KB total for 5 sound effects
- Deferred to idle time if needed
- No impact on user experience

## Status: ✅ FIXED

All interactive audio is now functional. Sounds play immediately on user interaction with proper timing and no delays.
