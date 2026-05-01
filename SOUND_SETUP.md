# Sound Effects Setup Guide

This guide explains how to add high-quality sound effects to the website.

## 📁 Directory Structure

Create a `sounds` folder in the `public` directory:

```
public/
  sounds/
    tick.mp3
    tick.ogg
    paper-pickup.mp3
    paper-pickup.ogg
    paper-place.mp3
    paper-place.ogg
    paper-crumple.mp3
    paper-crumple.ogg
    paper-fall.mp3
    paper-fall.ogg
```

## 🎵 Sound Files Needed

### 1. Tick Sound (`tick.mp3`, `tick.ogg`)
**Purpose:** Timeline ruler mechanical tick  
**Characteristics:**
- Duration: 50-100ms
- Sound: Mechanical click, clean and sharp
- Volume: Subtle (background texture)

**Free Sources:**
- Freesound.org: Search "mechanical click" or "ruler tick"
  - Example: [Mechanical Click](https://freesound.org/people/InspectorJ/sounds/403005/)
- Zapsplat.com: Search "mechanical tick"

### 2. Paper Pickup Sound (`paper-pickup.mp3`, `paper-pickup.ogg`)
**Purpose:** Selecting notes from palette  
**Characteristics:**
- Duration: 200-400ms
- Sound: Crisp paper rustle, light pickup
- Volume: Medium (user feedback)

**Free Sources:**
- Freesound.org: Search "paper rustle" or "paper pickup"
  - Example: [Paper Rustle](https://freesound.org/people/InspectorJ/sounds/410786/)

### 3. Paper Place Sound (`paper-place.mp3`, `paper-place.ogg`)
**Purpose:** Placing sticky notes on canvas  
**Characteristics:**
- Duration: 200-400ms
- Sound: Paper placement with slight stick/thud
- Volume: Medium (confirmation)

**Free Sources:**
- Freesound.org: Search "paper place" or "paper set down"

### 4. Paper Crumple Sound (`paper-crumple.mp3`, `paper-crumple.ogg`)
**Purpose:** Delete mode activation  
**Characteristics:**
- Duration: 400-800ms
- Sound: Satisfying crunch, textured
- Volume: Medium-high (satisfying feedback)

**Free Sources:**
- Freesound.org: Search "paper crumple"
  - Example: [Crumpling Paper](https://freesound.org/people/Benboncan/sounds/60026/)

### 5. Paper Fall Sound (`paper-fall.mp3`, `paper-fall.ogg`)
**Purpose:** Note deletion animation  
**Characteristics:**
- Duration: 400-600ms
- Sound: Gentle whoosh/flutter
- Volume: Medium (exit confirmation)

**Free Sources:**
- Freesound.org: Search "paper whoosh" or "paper fall"

## 🔧 How to Add Sounds
### Option 1: Download from Freesound.org (Recommended)

1. **Create Account**
   - Visit [Freesound.org](https://freesound.org)
   - Create a free account

2. **Search for Sounds**
   - Use the search terms listed above
   - Filter by "Creative Commons 0" for attribution-free use
   - Preview sounds to find the right feel

3. **Download**
   - Download WAV files (highest quality)
   - Save to a temporary folder

4. **Convert to MP3/OGG**
   - Use [FFmpeg](https://ffmpeg.org/) or [Audacity](https://www.audacityteam.org/)
   
   **FFmpeg Commands:**
   ```bash
   # Convert to MP3 (320kbps)
   ffmpeg -i input.wav -codec:a libmp3lame -b:a 320k -ar 44100 -ac 1 output.mp3
   
   # Convert to OGG (high quality)
   ffmpeg -i input.wav -codec:a libvorbis -q:a 8 -ar 44100 -ac 1 output.ogg
   ```

5. **Place Files**
   - Copy all MP3 and OGG files to `public/sounds/`
   - Ensure filenames match exactly as listed above

### Option 2: Use Placeholder Sounds (Development)

For quick testing, you can use any audio files temporarily:

1. Find any short audio clips (clicks, paper sounds, etc.)
2. Rename them to match the required filenames
3. Convert to MP3/OGG formats
4. Place in `public/sounds/`

The implementation will work with any audio - replace with high-quality sounds later.

### Option 3: Online Converters

If you don't have FFmpeg:

1. Download WAV files from Freesound
2. Use online converters:
   - [Online Audio Converter](https://online-audio-converter.com/)
   - [CloudConvert](https://cloudconvert.com/wav-to-mp3)
3. Convert to both MP3 (320kbps) and OGG (quality 8)
4. Place in `public/sounds/`

## ✅ Verification

After adding sound files:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open browser console to check for errors
3. Test each interaction:
   - Scroll timeline → Should hear ticks
   - Click yellow/green notes → Should hear pickup sound
   - Place note on canvas → Should hear place sound
   - Click delete pad → Should hear crumple
   - Delete a note → Should hear fall sound

## 🎚️ Sound Control

Users can control sounds via localStorage:
- Sounds enabled: `localStorage.getItem('sound-effects-enabled')`
- Volume level: `localStorage.getItem('sound-effects-volume')`

To disable sounds during development:
```javascript
localStorage.setItem('sound-effects-enabled', 'false');
```

## 📋 Audio Specifications

**Format Requirements:**
- MP3: 320kbps CBR, 44.1kHz, Mono
- OGG: Quality 8-10, 44.1kHz, Mono
- Both formats for browser compatibility

**Processing Tips:**
- Normalize to -3dB peak to prevent clipping
- Add 5-10ms fade in/out to prevent clicks
- Trim silence from beginning and end
- Convert to mono (smaller file size, sufficient for UI)

## 🎵 Sound Attribution

If using Creative Commons sounds, add attribution in your README:

```markdown
## Sound Credits
- Tick Sound: [Sound Name] by [Artist] (CC0 / CC-BY)
- Paper Sounds: [Sound Name] by [Artist] (CC0 / CC-BY)
```

## 🐛 Troubleshooting

**No sounds playing:**
- Check browser console for 404 errors
- Verify files exist in `public/sounds/`
- Check file names match exactly
- Ensure sounds are enabled in localStorage

**Sounds playing incorrectly:**
- Try clearing browser cache
- Check audio file formats (should be 44.1kHz)
- Verify file sizes (should be < 100KB each)

**Performance issues:**
- Ensure audio files are properly compressed
- Check total sound library size (target < 500KB)
- Monitor browser console for warnings

## 📚 Additional Resources

- [Howler.js Documentation](https://howlerjs.com/)
- [Freesound API](https://freesound.org/docs/api/)
- [FFmpeg Audio Guide](https://trac.ffmpeg.org/wiki/AudioChannelManipulation)
- [Web Audio Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)

---

**Note:** The sound system is fully functional without audio files - it will gracefully handle missing files with console warnings. Add sounds at your convenience for the complete experience!
