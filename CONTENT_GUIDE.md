# Content Guide - Adding Your Images & Videos

This guide explains how to add your own images and videos to the timeline carousel. The timeline automatically positions content based on dates and adjusts spacing dynamically.

## Quick Start

1. Add your media files to the `public/media/` folder
2. Edit `src/data/timeline.ts` to add your content
3. The timeline will automatically position items by date

## File Structure

### Recommended Folder Organization

```
public/
└── media/
    ├── images/
    │   ├── 2024-01-summer-beach.jpg
    │   ├── 2024-03-city-lights.jpg
    │   └── 2024-06-mountain-view.jpg
    └── videos/
        ├── 2024-02-ocean-waves.mp4
        └── 2024-05-urban-night.mp4
```

**Naming Convention:** Use `YYYY-MM-description.ext` format for easy organization.

## Adding Content

### Step 1: Add Media Files

Place your images and videos in the `public/media/` folder:

- **Images:** JPG, PNG, WebP, AVIF
- **Videos:** MP4, WebM (MP4 recommended for best compatibility)

### Step 2: Edit timeline.ts

Open `src/data/timeline.ts` and replace the mock data with your content:

```typescript
import type { TimelineItem } from "@/types";

export const timelineData: TimelineItem[] = [
  {
    id: "1",
    title: "Summer Beach Day",
    date: "2024-06-15T00:00:00.000Z",
    type: "image",
    src: "/media/images/2024-06-summer-beach.jpg",
    width: "landscape",
    category: "Travel",
    description: "Beautiful day at the beach",
  },
  {
    id: "2",
    title: "City Nightlife",
    date: "2024-07-22T00:00:00.000Z",
    type: "video",
    src: "/media/images/video-thumbnail.jpg", // Thumbnail
    videoSrc: "/media/videos/2024-07-city-night.mp4",
    width: "portrait",
    category: "Urban",
    description: "Downtown at night",
  },
  // Add more items...
];
```

## Item Properties

### Required Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `id` | string | Unique identifier | `"1"`, `"beach-2024"` |
| `title` | string | Display name (shown on hover) | `"Summer Vacation"` |
| `date` | string | ISO 8601 date string | `"2024-06-15T00:00:00.000Z"` |
| `type` | string | Media type | `"image"` or `"video"` |
| `src` | string | Image path (or video thumbnail) | `"/media/images/photo.jpg"` |
| `width` | string | Aspect ratio category | `"portrait"`, `"square"`, or `"landscape"` |

### Optional Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| `category` | string | Content category/tag | `"Travel"`, `"Fashion"`, `"Art"` |
| `description` | string | Full description | `"Trip to Bali in summer 2024"` |
| `videoSrc` | string | Video file path (required for type: "video") | `"/media/videos/clip.mp4"` |

## Width Types & Dimensions

The timeline uses three aspect ratio categories:

| Width Type | Dimensions | Best For |
|------------|------------|----------|
| `portrait` | 300×400px | Vertical photos, portraits |
| `square` | 300×300px | Instagram-style square photos |
| `landscape` | 400×300px | Horizontal photos, scenery |

**Note:** These are display sizes. Your source images can be any size—they'll be scaled to fit.

## Date Formatting

Dates **must** be in ISO 8601 format with timezone:

### ✅ Correct Formats

```typescript
date: "2024-06-15T00:00:00.000Z"  // Recommended
date: "2024-06-15T12:30:00.000Z"  // With time (optional)
date: "2024-12-25T00:00:00.000Z"  // Any valid date
```

### ❌ Incorrect Formats

```typescript
date: "2024-06-15"           // Missing time and timezone
date: "June 15, 2024"        // Text format not allowed
date: "06/15/2024"           // Slash format not allowed
```

### Quick Date Converter

Use this helper in your browser console:

```javascript
new Date("2024-06-15").toISOString()
// Returns: "2024-06-15T00:00:00.000Z"
```

## Timeline Behavior

### Compressed Editorial Layout

The timeline uses a **compressed, editorial-style layout** where:

- **Images are always adjacent** - No large gaps regardless of date differences
- **Months with no photos are removed** - Timeline only shows periods with content
- **Variable spacing (80-120px)** - Creates organic, editorial feel
- **Chronological order maintained** - Photos appear in date order
- **Ruler ticks only for photos** - One tick per image at actual dates

### Examples

**Photos across different months:**
```
[Jan 1][Jan 15][June 1][June 5][Dec 20]
  |      |       |       |        |
JAN            JUNE              DEC
```
*Notice: Feb-May are removed (no photos), images stay together*

**Dense timeline (same month):**
```
[June 1][June 5][June 8][June 12]
   |       |        |        |
              JUNE
```

### Adjusting Spacing

To change the editorial spacing, edit `src/components/TimelineCarousel.tsx`:

```typescript
const MIN_GAP = 80;   // Minimum gap between images
const MAX_GAP = 120;  // Maximum gap for variety
```

The timeline randomly varies gaps between MIN_GAP and MAX_GAP for an organic feel.

## Adding Videos

Videos autoplay on loop (muted) when visible:

```typescript
{
  id: "video-1",
  title: "Ocean Waves",
  date: "2024-08-10T00:00:00.000Z",
  type: "video",
  src: "/media/images/ocean-thumbnail.jpg",  // Thumbnail image
  videoSrc: "/media/videos/ocean-waves.mp4", // Video file
  width: "landscape",
  category: "Nature",
}
```

### Video Best Practices

1. **Keep videos short** (5-15 seconds) for best performance
2. **Use MP4 format** with H.264 codec for compatibility
3. **Optimize file size** (recommended: < 5MB per video)
4. **Provide a thumbnail** in the `src` property
5. **Test on mobile** to ensure smooth playback

### Video Encoding (ffmpeg)

Optimize videos for web:

```bash
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 23 -vf scale=1280:-1 -an output.mp4
```

## Example Timeline

Here's a complete example with mixed content:

```typescript
export const timelineData: TimelineItem[] = [
  {
    id: "1",
    title: "New Year's Eve",
    date: "2024-01-01T00:00:00.000Z",
    type: "image",
    src: "/media/images/nye-2024.jpg",
    width: "landscape",
    category: "Celebration",
  },
  {
    id: "2",
    title: "Winter Portrait",
    date: "2024-02-14T00:00:00.000Z",
    type: "image",
    src: "/media/images/winter-portrait.jpg",
    width: "portrait",
    category: "Portrait",
  },
  {
    id: "3",
    title: "Spring Flowers",
    date: "2024-03-20T00:00:00.000Z",
    type: "video",
    src: "/media/images/flowers-thumb.jpg",
    videoSrc: "/media/videos/spring-flowers.mp4",
    width: "square",
    category: "Nature",
  },
  {
    id: "4",
    title: "Summer Road Trip",
    date: "2024-06-15T00:00:00.000Z",
    type: "image",
    src: "/media/images/road-trip.jpg",
    width: "landscape",
    category: "Travel",
    description: "Cross-country adventure",
  },
  // Add more items chronologically...
];
```

## Tips & Best Practices

### Content Organization

1. **Sort chronologically** - The timeline auto-sorts by date, but keeping your data organized helps
2. **Use consistent naming** - Use descriptive IDs like `"beach-2024-06"` instead of just numbers
3. **Add categories** - Helps organize content (optional but recommended)
4. **Write descriptions** - Future feature expansion may use these

### Image Quality

- **Resolution:** 1200-2000px on longest side is plenty
- **Format:** JPG for photos, PNG for graphics with transparency
- **File size:** Aim for < 500KB per image (compress with tools like TinyPNG)
- **Optimization:** Use modern formats (WebP, AVIF) for better performance

### Date Spread

For best visual results:
- **Minimum:** Space photos at least a few days apart
- **Maximum:** No limit, but very long gaps will create empty space
- **Sweet spot:** 3-30 days between photos creates nice rhythm

### Testing Your Changes

After editing `timeline.ts`:

1. Save the file
2. The dev server will auto-reload
3. Check that photos appear in chronological order
4. Verify spacing looks good
5. Test hovering to see titles and dates
6. Scroll through the entire timeline

## Troubleshooting

### Images not showing?

- ✅ Check file path starts with `/media/` (not `./media/`)
- ✅ Verify files are in `public/media/` folder
- ✅ Check filename spelling matches exactly (case-sensitive)
- ✅ Ensure image files aren't corrupted

### Wrong date order?

- ✅ Verify all dates are in ISO format
- ✅ Check year/month/day are correct
- ✅ Make sure timezone is included (`.000Z`)

### Videos not playing?

- ✅ Use MP4 format with H.264 codec
- ✅ Check `videoSrc` path is correct
- ✅ Verify `type: "video"` is set
- ✅ Test video plays in browser directly (`http://localhost:3000/media/videos/yourfile.mp4`)

### Timeline too wide/narrow?

Adjust spacing constants in `TimelineCarousel.tsx`:

```typescript
const MIN_GAP = 80;        // Lower = more compact
const PIXELS_PER_DAY = 15; // Lower = more compact
```

## Advanced Customization

### Changing Image Sizes

Edit `IMAGE_SIZES` in `TimelineCarousel.tsx`:

```typescript
const IMAGE_SIZES = {
  portrait: { width: 300, height: 400 },   // Make taller/wider
  square: { width: 300, height: 300 },     // Adjust square size
  landscape: { width: 400, height: 300 },  // Adjust landscape
};
```

### Adding More Width Types

1. Add new type to `IMAGE_SIZES`
2. Update TypeScript type in `src/types/index.ts`:

```typescript
width: "portrait" | "square" | "landscape" | "ultrawide";
```

3. Define new size in `IMAGE_SIZES`

---

## Need Help?

- Check the browser console for error messages
- Verify JSON syntax in `timeline.ts` (use a JSON validator)
- Test with just one or two items first
- Review example data in `timeline.ts` for reference format

Happy timeline building! 🎨
