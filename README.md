# BETTER OFF® — THE LOOKBACK

A premium, production-ready portfolio website featuring a cinematic horizontal timeline archive. Built with Next.js, TypeScript, Tailwind CSS, and Framer Motion.

## 🎨 Features

- **Cinematic Horizontal Timeline** - Smooth scrolling archive of visual memories
- **Premium Typography** - Bold editorial design with mix-blend-mode color inversion
- **Physics-Based Scrolling** - Lenis smooth scroll with momentum and inertia
- **Video Support** - Autoplay/pause video cards with viewport detection
- **Music Player** - Fully functional audio playback with Howler.js
- **Timeline Ruler** - Synced date ruler with animated indicator
- **Responsive Design** - Optimized for desktop, tablet, and mobile
- **Accessibility** - WCAG AA compliant with keyboard navigation
- **Performance** - 60fps animations, lazy loading, optimized images

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone and navigate to the project:**
```bash
cd C:\Users\matth\Personal\Software\hiromix
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
hiromix/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts and metadata
│   │   ├── page.tsx             # Homepage with all components
│   │   └── globals.css          # Global styles and Tailwind
│   ├── components/
│   │   ├── Navigation.tsx       # Top navigation menu
│   │   ├── HeroHeader.tsx       # Fixed central header with inversion
│   │   ├── TimelineCarousel.tsx # Main horizontal carousel
│   │   ├── TimelineCard.tsx     # Image card component
│   │   ├── VideoCard.tsx        # Video card with autoplay
│   │   ├── TimelineRuler.tsx    # Bottom timeline ruler
│   │   ├── MusicPlayer.tsx      # Music widget with Howler.js
│   │   └── QueueDropdown.tsx    # Expandable music queue
│   ├── data/
│   │   ├── timeline.ts          # Timeline items mock data
│   │   └── music.ts             # Music tracks mock data
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   └── lib/
│       └── utils.ts             # Utility functions
├── public/                      # Static assets
├── next.config.mjs              # Next.js configuration
├── tailwind.config.ts           # Tailwind theme customization
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## 🎯 Key Technologies

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3+
- **Animation:** Framer Motion 12+
- **Smooth Scroll:** Lenis 1.0+
- **Audio:** Howler.js 2.2+
- **Images:** Unsplash API (via Next.js Image)
- **Icons:** Lucide React

## 🎨 Customization

### Adding Your Own Content

Replace the mock data in `src/data/timeline.ts` and `src/data/music.ts` with your actual projects and music.

**Timeline Items:**
```typescript
{
  id: "unique-id",
  title: "Project Title",
  date: "2026-03-15T00:00:00.000Z",
  type: "image" | "video" | "project",
  src: "image-url-or-path",
  width: "portrait" | "square" | "landscape",
  category: "Category Name",
  description: "Brief description",
  videoSrc: "video-url" // for video type
}
```

**Music Tracks:**
```typescript
{
  id: "unique-id",
  title: "Song Title",
  artist: "Artist Name",
  album: "Album Name",
  albumArt: "cover-art-url",
  audioSrc: "audio-file-url",
  duration: 263 // in seconds
}
```

### Customizing Theme

Edit `tailwind.config.ts` to modify:
- Colors (currently monochrome)
- Typography scale
- Animation timing
- Breakpoints

### Header Text

Edit the header text in `src/components/HeroHeader.tsx`:
```typescript
<span>YOUR BRAND®</span>
<span>YOUR TAGLINE</span>
<span>(YEAR)</span>
```

## ⌨️ Keyboard Navigation

- `Tab` - Navigate through interactive elements
- `Arrow Keys` - Scroll timeline (when focused)
- `Space/Enter` - Activate buttons
- `Esc` - Close dropdowns

## 🎭 Performance Features

- **Lazy Loading** - Images and videos load on demand
- **Code Splitting** - Dynamic imports for optimal bundles
- **GPU Acceleration** - Transform-based animations
- **Responsive Images** - WebP/AVIF with Next.js Image
- **Reduced Motion** - Respects user preferences

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Deploy automatically

### Other Platforms

Build the static export:
```bash
npm run build
```

Deploy the `.next` folder to your hosting provider.

## 📝 Environment Variables

Create a `.env.local` file for custom configuration:

```env
# Optional: Custom Unsplash API key for higher rate limits
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_key_here
```

## 🎬 Credits

- **Design Inspiration:** Museum archives, editorial design, luxury fashion websites
- **Images:** Unsplash API
- **Sample Audio:** SoundHelix (royalty-free)

## 📄 License

This project is for portfolio/educational use. Replace all placeholder content with your own before production deployment.

---

Built with ❤️ using Next.js, TypeScript, and Framer Motion
