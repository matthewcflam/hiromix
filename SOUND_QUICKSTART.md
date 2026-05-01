# Quick Start: Adding Sound Effects

## 🎯 TL;DR

The sound system is fully implemented! Just add 5 audio files to get started.

## 📁 Step 1: Create Directory

Create this folder structure:
```
public/sounds/
```

## 🎵 Step 2: Add Sound Files

Place these 10 files in `public/sounds/`:

### Required Files:
1. `tick.mp3` + `tick.ogg` - Mechanical click (50-100ms)
2. `paper-pickup.mp3` + `paper-pickup.ogg` - Paper rustle (200-400ms)
3. `paper-place.mp3` + `paper-place.ogg` - Paper placement (200-400ms)
4. `paper-crumple.mp3` + `paper-crumple.ogg` - Crumpling sound (400-800ms)
5. `paper-fall.mp3` + `paper-fall.ogg` - Paper whoosh (400-600ms)

## 🔍 Step 3: Find Sounds

### Option A: Freesound.org (Recommended - Free)
1. Create account: https://freesound.org
2. Search terms:
   - "mechanical click" → `tick`
   - "paper rustle" → `paper-pickup`
   - "paper place" → `paper-place`
   - "paper crumple" → `paper-crumple`
   - "paper whoosh" → `paper-fall`
3. Filter by "Creative Commons 0" (no attribution needed)
4. Download WAV files

### Option B: Quick Test (Use Any Audio)
For quick testing, use any short audio files:
- Rename them to match the required names
- Convert to MP3/OGG formats
- Place in `public/sounds/`

The app works without sounds - it just shows warnings in console.

## 🔄 Step 4: Convert (If Needed)

If you have WAV files, convert to MP3/OGG:

### Online (Easy):
- https://online-audio-converter.com/
- Upload WAV → Choose MP3 (320kbps) → Download
- Upload WAV → Choose OGG (quality 8) → Download

### FFmpeg (Advanced):
```bash
# MP3
ffmpeg -i input.wav -codec:a libmp3lame -b:a 320k -ar 44100 -ac 1 output.mp3

# OGG
ffmpeg -i input.wav -codec:a libvorbis -q:a 8 -ar 44100 -ac 1 output.ogg
```

## ✅ Step 5: Test

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Test interactions:
   - Scroll timeline → Hear ticks
   - Click yellow/green notes → Hear pickup
   - Place note → Hear place sound
   - Click delete pad → Hear crumple
   - Delete note → Hear fall sound

4. Use sound controls (bottom-right) to adjust volume or mute

## 🎚️ Sound Controls

**Location:** Bottom-right corner (above music player)

**Features:**
- Toggle on/off: Click speaker icon
- Adjust volume: Hover and use slider
- Preferences save automatically

## 🐛 Troubleshooting

**No sounds playing?**
- Check browser console for 404 errors
- Verify files exist in `public/sounds/`
- Check exact file names match (case-sensitive)
- Ensure sounds are enabled (click speaker icon)

**Still not working?**
- Try clearing browser cache (Ctrl+Shift+R)
- Check browser console for errors
- Verify file formats (MP3 + OGG for each sound)

## 📚 More Info

- **Detailed setup guide:** See `SOUND_SETUP.md`
- **Implementation details:** See `SOUND_IMPLEMENTATION.md`
- **Code examples:** Check `src/lib/useSoundManager.ts`

## 💡 Pro Tips

1. **Start simple:** Use any audio files to test functionality first
2. **Optimize later:** Find high-quality sounds after testing
3. **Adjust volume:** Use sound controls to find comfortable levels
4. **Mobile-friendly:** Keep files small (< 50KB each)

## 🎉 That's It!

Your sound system is ready to go. Just add the audio files and enjoy the enhanced experience!

---

**Need help?** Check the detailed guides or inspect the browser console for specific error messages.
