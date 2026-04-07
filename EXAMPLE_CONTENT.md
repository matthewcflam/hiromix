# Example: Adding Your Own Content

This file shows how to replace the demo content with your own photos and videos.

## Step 1: Prepare Your Media

Create these folders in `public/`:
```
public/
└── media/
    ├── images/
    └── videos/
```

Add your files:
```
public/media/images/2024-06-beach.jpg
public/media/images/2024-07-city.jpg
public/media/videos/2024-08-sunset.mp4
```

## Step 2: Edit src/data/timeline.ts

Replace the existing data with:

```typescript
import type { TimelineItem } from "@/types";

export const timelineData: TimelineItem[] = [
  {
    id: "beach-trip",
    title: "Summer Beach Trip",
    date: "2024-06-15T00:00:00.000Z",
    type: "image",
    src: "/media/images/2024-06-beach.jpg",
    width: "landscape",
    category: "Travel",
  },
  {
    id: "city-night",
    title: "City Lights",
    date: "2024-07-22T00:00:00.000Z",
    type: "image",
    src: "/media/images/2024-07-city.jpg",
    width: "portrait",
    category: "Urban",
  },
  {
    id: "sunset-video",
    title: "Sunset Timelapse",
    date: "2024-08-10T00:00:00.000Z",
    type: "video",
    src: "/media/images/sunset-thumb.jpg",
    videoSrc: "/media/videos/2024-08-sunset.mp4",
    width: "landscape",
    category: "Nature",
  },
];
```

## Important: Date Format

Always use ISO 8601 format with timezone:
```typescript
date: "2024-06-15T00:00:00.000Z"  ✓ Correct
date: "2024-06-15"                 ✗ Wrong
date: "June 15, 2024"              ✗ Wrong
```

## Timeline Behavior

The timeline automatically:
- Sorts items chronologically
- Spaces items based on date differences (15px per day)
- Maintains minimum 80px gap between photos
- Expands when photos are spread out over time
- Contracts when photos are close together

See CONTENT_GUIDE.md for complete documentation!
