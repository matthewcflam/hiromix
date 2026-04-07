# Quick Setup Guide

## Windows PowerShell Setup

1. **Navigate to project directory:**
```powershell
cd C:\Users\matth\Personal\Software\hiromix
```

2. **Verify npm is installed:**
```powershell
npm --version
```

3. **Install dependencies (if not already done):**
```powershell
npm install
```

4. **Start development server:**
```powershell
npm run dev
```

5. **Open in browser:**
- Navigate to: http://localhost:3000

## Common Commands

```powershell
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npx tsc --noEmit
```

## Troubleshooting

**Port 3000 already in use?**
```powershell
# Kill process on port 3000
npx kill-port 3000
# Or use different port
$env:PORT=3001; npm run dev
```

**Module not found errors?**
```powershell
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules, .next
npm install
```

**Build errors?**
```powershell
# Check TypeScript errors
npx tsc --noEmit

# Check Next.js config
npm run build
```

## Next Steps

1. Replace mock data with your actual content
2. Customize brand name in HeroHeader.tsx
3. Add your own images and videos
4. Configure music player with your tracks
5. Deploy to Vercel or your preferred platform

Enjoy your premium portfolio! 🎨
