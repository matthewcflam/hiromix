# 🎵 Music Player Setup Guide

## File Structure Created

```
hiromix/
├── public/
│   ├── music/          ← Place MP3/audio files here
│   │   ├── README.md
│   │   └── .gitkeep
│   └── covers/         ← Place album cover images here
│       ├── README.md
│       └── .gitkeep
└── src/
    └── data/
        └── music.ts    ← Edit this to update playlist
```

---

## 📁 Step 1: Add Your Music Files

Navigate to: **`public/music/`**

Place your MP3 files with these exact names:

1. `01-wrong-ones-post-malone.mp3`
2. `02-nights-frank-ocean.mp3`
3. `03-digital-love-daft-punk.mp3`
4. `04-the-less-i-know-tame-impala.mp3`
5. `05-shadow-chromatics.mp3`
6. `06-time-hans-zimmer.mp3`

**Or use your own songs and update `music.ts` (see Step 3)**

---

## 🖼️ Step 2: Add Album Cover Art

Navigate to: **`public/covers/`**

Place your album cover images (JPG or PNG) with these exact names:

1. `01-austin-post-malone.jpg`
2. `02-blonde-frank-ocean.jpg`
3. `03-discovery-daft-punk.jpg`
4. `04-currents-tame-impala.jpg`
5. `05-kill-for-love-chromatics.jpg`
6. `06-inception-hans-zimmer.jpg`

**Recommended specs:**
- Square (1:1 aspect ratio)
- 500x500px to 1000x1000px
- JPG or PNG
- < 500KB file size

**Where to get album art:**
- Right-click album on Spotify → "Copy Image Address" → Download
- Google Images: "[album name] cover art"
- Apple Music / Amazon Music

---

## ✏️ Step 3: Update Playlist (Optional)

To add/remove/change songs, edit: **`src/data/music.ts`**

### Adding a New Song:

```typescript
{
  id: "7",                                    // Increment number
  title: "Your Song Title",
  artist: "Artist Name",
  album: "Album Name",
  albumArt: "/covers/07-album-name.jpg",    // Your cover file
  audioSrc: "/music/07-song-name.mp3",      // Your audio file
  duration: 240,                             // Length in seconds (optional)
}
```

### Removing a Song:

Delete the entire object from the array.

### Changing a Song:

Update the `title`, `artist`, `albumArt`, and `audioSrc` fields.

---

## ⚡ Quick Start (Copy-Paste Ready)

If you want to use your own songs immediately:

1. **Place your files:**
   - Audio: `public/music/my-song.mp3`
   - Cover: `public/covers/my-album.jpg`

2. **Update music.ts:**
```typescript
export const musicTracks: MusicTrack[] = [
  {
    id: "1",
    title: "My Song",
    artist: "My Artist",
    album: "My Album",
    albumArt: "/covers/my-album.jpg",
    audioSrc: "/music/my-song.mp3",
    duration: 180,
  },
];
```

3. **Restart dev server:**
```bash
npm run dev
```

---

## 🔧 Troubleshooting

### Music not playing?
- Check browser console for errors
- Verify file paths match exactly (case-sensitive)
- Ensure MP3 files are valid (test in VLC/iTunes)
- Clear browser cache (Ctrl+Shift+R)

### Album art not showing?
- Verify image file exists in `/public/covers/`
- Check image format (JPG/PNG only)
- Ensure path starts with `/covers/` not `./covers/`

### How to get file duration?
- Use online tool: https://www.audiochecker.net/
- Or: Right-click MP3 → Properties → Details (Windows)
- Or: Get Info (Mac)

---

## 📝 Example Workflow

1. **Download your song** from Spotify/YouTube (use a legal downloader)
2. **Save as:** `public/music/song-name.mp3`
3. **Download album art** from Google Images
4. **Save as:** `public/covers/album-name.jpg`
5. **Edit** `src/data/music.ts` and add entry
6. **Refresh** browser

---

## 🎨 Advanced: Bulk Import Script

Want to auto-generate the music.ts file from your folder?

Run this in your terminal:

```bash
# List all MP3 files
ls public/music/*.mp3

# Then manually create entries in music.ts
```

Or create a Node script to auto-generate (let me know if you want this!)

---

## ✅ Checklist

- [ ] Music files placed in `public/music/`
- [ ] Cover images placed in `public/covers/`
- [ ] File names match paths in `music.ts`
- [ ] `music.ts` updated with correct metadata
- [ ] Dev server restarted
- [ ] Music player works in browser

---

Need help? Check the README files in each folder for detailed instructions!
