"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Lenis from "@studio-freight/lenis";
import type { TimelineItem } from "@/types";
import StickyNote from "./StickyNote";
import NotePalette from "./NotePalette";

interface TimelineCarouselProps {
  items: TimelineItem[];
}

interface Note {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
}

// Image size configurations based on width type
const IMAGE_SIZES = {
  portrait: { width: 300, height: 400 },
  square: { width: 300, height: 300 },
  landscape: { width: 400, height: 300 },
};

const FIXED_GAP = 300; // Equal whitespace between all photos
const TICKS_BETWEEN_PHOTOS = 30; // Fixed number of ticks between each photo

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

interface TickData {
  x: number; // Use integer X position for both deduplication AND rendering
  isMonthStart: boolean;
  monthLabel?: string;
}

// Calculate positions with equal spacing and generate editorial ticks
const calculateTimelinePositions = (items: TimelineItem[]) => {
  if (items.length === 0) return { 
    positions: [], 
    totalWidth: 1000, 
    ticks: [],
  };

  // Sort items by date
  const sortedItems = [...items].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const positions: Array<{ 
    x: number; 
    y: number; 
    width: number; 
    height: number;
    item: TimelineItem;
  }> = [];
  
  // Use Map to deduplicate ticks by X position (rounded to avoid floating point issues)
  const tickMap = new Map<number, TickData>();
  
  let currentX = 100; // Start padding
  
  // Alternate y positions for visual variety
  const yPositions = [120, 180, 100, 200, 140, 160, 130, 190, 110, 170];
  
  sortedItems.forEach((item, index) => {
    const size = IMAGE_SIZES[item.width];
    
    positions.push({
      x: currentX,
      y: yPositions[index % yPositions.length],
      width: size.width,
      height: size.height,
      item: item,
    });
    
    // Check if this is the first photo of a new month
    const currentMonth = new Date(item.date).getMonth();
    const isMonthStart = index === 0 || 
      new Date(sortedItems[index - 1].date).getMonth() !== currentMonth;
    
    // Generate ticks between this photo and the next
    if (index < sortedItems.length - 1) {
      const nextSize = IMAGE_SIZES[sortedItems[index + 1].width];
      const startX = currentX + (size.width / 2); // Center of current photo
      const endX = currentX + size.width + FIXED_GAP + (nextSize.width / 2); // Center of next photo
      const tickSpacing = (endX - startX) / TICKS_BETWEEN_PHOTOS;
      
      // Generate fixed number of ticks between photos
      for (let t = 0; t <= TICKS_BETWEEN_PHOTOS; t++) {
        const tickX = startX + (t * tickSpacing);
        const roundedX = Math.round(tickX); // Round to integer pixel
        const isFirstTick = t === 0;
        
        // Only add if not already present, but preserve month label if any tick at this position has it
        const existing = tickMap.get(roundedX);
        if (!existing) {
          tickMap.set(roundedX, {
            x: roundedX, // CRITICAL: Use rounded value for rendering too, not original float
            isMonthStart: isFirstTick && isMonthStart,
            monthLabel: (isFirstTick && isMonthStart) 
              ? `${MONTHS[currentMonth]} ${new Date(item.date).getFullYear()}`
              : undefined,
          });
        } else if (isFirstTick && isMonthStart && !existing.monthLabel) {
          // Preserve month label if this tick has one but existing doesn't
          existing.isMonthStart = true;
          existing.monthLabel = `${MONTHS[currentMonth]} ${new Date(item.date).getFullYear()}`;
        }
      }
    } else {
      // Last photo - just add one tick at its center
      const tickX = currentX + (size.width / 2);
      const roundedX = Math.round(tickX);
      
      const existing = tickMap.get(roundedX);
      if (!existing) {
        tickMap.set(roundedX, {
          x: roundedX, // CRITICAL: Use rounded value for rendering too
          isMonthStart: isMonthStart,
          monthLabel: isMonthStart 
            ? `${MONTHS[currentMonth]} ${new Date(item.date).getFullYear()}`
            : undefined,
        });
      } else if (isMonthStart && !existing.monthLabel) {
        // Preserve month label if this tick has one but existing doesn't
        existing.isMonthStart = true;
        existing.monthLabel = `${MONTHS[currentMonth]} ${new Date(item.date).getFullYear()}`;
      }
    }
    
    // Update position for next item
    currentX += size.width + FIXED_GAP;
  });
  
  // Convert map to array
  const allTicks = Array.from(tickMap.values());
  
  // Calculate total width needed
  const lastPos = positions[positions.length - 1];
  const totalWidth = lastPos.x + lastPos.width + 100; // End padding
  
  return { positions, totalWidth, ticks: allTicks };
};

export default function TimelineCarousel({ items }: TimelineCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeTickIndex, setActiveTickIndex] = useState(0);
  const [recentTicks, setRecentTicks] = useState<Map<number, number>>(new Map()); // Map<tickIndex, timestamp>
  const previousScrollRef = useRef(0);
  const previousTickRef = useRef(0); // Track previous tick for interpolation
  const [notes, setNotes] = useState<Note[]>([]);
  const [placementColor, setPlacementColor] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number>();
  const [scale, setScale] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Set to false to disable debug logging
  const DEBUG_PERSISTENCE = false;

  // Calculate positions and ticks
  const { positions, totalWidth, ticks } = calculateTimelinePositions(items);

  // Calculate scale based on viewport height
  useEffect(() => {
    const updateScale = () => {
      const vh = window.innerHeight;
      const availableHeight = vh - 80;
      const maxImageHeight = 400; // Max from IMAGE_SIZES
      const desiredMaxHeight = availableHeight * 0.75;
      const newScale = Math.min(1, desiredMaxHeight / maxImageHeight);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Load notes from localStorage on mount
  useEffect(() => {
    if (DEBUG_PERSISTENCE) console.log('🔍 Loading notes from localStorage...');
    
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      console.error('❌ localStorage is not available');
      setIsInitialized(true);
      return;
    }

    try {
      const saved = localStorage.getItem('timeline-notes');
      if (DEBUG_PERSISTENCE) console.log('📦 Raw localStorage data:', saved);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        if (DEBUG_PERSISTENCE) console.log(`✅ Loaded ${parsed.length} notes from localStorage:`, parsed);
        setNotes(parsed);
      } else {
        if (DEBUG_PERSISTENCE) console.log('ℹ️ No saved notes found in localStorage');
      }
    } catch (e) {
      console.error('❌ Failed to load notes:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save notes to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    if (!isInitialized) {
      if (DEBUG_PERSISTENCE) console.log('⏸️ Skipping save - not initialized yet');
      return;
    }

    if (DEBUG_PERSISTENCE) console.log(`💾 Saving ${notes.length} notes to localStorage:`, notes);
    
    try {
      localStorage.setItem('timeline-notes', JSON.stringify(notes));
      if (DEBUG_PERSISTENCE) console.log('✅ Notes saved successfully');
    } catch (e) {
      console.error('❌ Failed to save notes:', e);
    }
  }, [notes, isInitialized]);

  // Format date as "Month Day, Year"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Handle color selection from palette
  const handleColorSelect = (color: string) => {
    // If selecting a new color, disable delete mode
    if (color) {
      setIsDeleteMode(false);
      setPlacementColor(color);
    } else {
      // If deselecting (clicking same color again), just turn off placement
      setPlacementColor(null);
    }
  };

  // Toggle delete mode
  const handleToggleDeleteMode = () => {
    const newDeleteMode = !isDeleteMode;
    
    // If enabling delete mode, disable placement mode
    if (newDeleteMode) {
      setPlacementColor(null);
    }
    
    setIsDeleteMode(newDeleteMode);
  };

  // Handle click on canvas to place note
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't place notes if in delete mode
    if (isDeleteMode) return;
    
    if (!placementColor || !canvasRef.current) return;

    // Get the bounding rectangle of the canvas
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate position relative to the canvas
    // e.clientX is relative to viewport, rect.left is canvas left edge relative to viewport
    // This gives us the correct position on the canvas regardless of scroll
    const noteSize = 192; // w-48 h-48 = 192px
    const x = e.clientX - rect.left - (noteSize / 2);
    const y = e.clientY - rect.top - (noteSize / 2);

    const newNote: Note = {
      id: Date.now().toString(),
      text: '',
      color: placementColor,
      x,
      y,
      rotation: 0, // No rotation - perfectly aligned
    };

    setNotes(prevNotes => [...prevNotes, newNote]);
    // Automatically deselect color after placing one note
    setPlacementColor(null);
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    // Keep delete mode active - user must manually click delete button to exit
  };

  // Update note text
  const handleNoteTextChange = (noteId: string, text: string) => {
    setNotes(prevNotes => prevNotes.map(note => 
      note.id === noteId ? { ...note, text } : note
    ));
  };

  // Update note position
  const handleNotePositionChange = (noteId: string, x: number, y: number) => {
    setNotes(prevNotes => prevNotes.map(note => 
      note.id === noteId ? { ...note, x, y } : note
    ));
  };

  // Initialize Lenis smooth scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Create Lenis instance for horizontal scrolling
    const lenis = new Lenis({
      wrapper: container,
      content: container.firstElementChild as HTMLElement,
      orientation: 'horizontal',
      gestureOrientation: 'both',
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 1.8,
      infinite: false,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenisRef.current = lenis;

    // Track scroll position and update active tick
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      const viewportCenter = scroll + (typeof window !== 'undefined' ? window.innerWidth / 2 : 800);
      
      // Find which tick is closest to viewport center
      let closestTickIndex = 0;
      let minDistance = Infinity;
      
      ticks.forEach((tick, index) => {
        const tickX = tick.x + 100; // Account for padding
        const distance = Math.abs(tickX - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestTickIndex = index;
        }
      });
      
      const centerTickIndex = closestTickIndex;
      
      // When active tick changes, add ALL ticks between previous and current to recent history
      if (centerTickIndex !== activeTickIndex) {
        const previousTick = previousTickRef.current;
        const currentTick = centerTickIndex;
        
        setRecentTicks(prev => {
          const newMap = new Map(prev);
          const now = Date.now();
          
          // Determine direction and range
          const start = Math.min(previousTick, currentTick);
          const end = Math.max(previousTick, currentTick);
          
          // Add ALL ticks that were passed over (including the previous active tick)
          // This creates the wave effect by triggering all intermediate ticks
          for (let i = start; i <= end; i++) {
            if (i !== currentTick) { // Don't add the current tick yet
              // Stagger the timestamps slightly based on distance from current
              // This creates a more natural wave propagation
              const distanceFromCurrent = Math.abs(i - currentTick);
              const staggerDelay = distanceFromCurrent * 2; // 2ms per tick distance
              newMap.set(i, now - staggerDelay);
            }
          }
          
          return newMap;
        });
        
        previousTickRef.current = centerTickIndex;
        setActiveTickIndex(centerTickIndex);
      }
    });

    // Animation loop
    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      lenis.destroy();
    };
  }, []);

  // Clean up old ticks from recent history
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRecentTicks(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;
        
        // Remove ticks older than 500ms
        for (const [tickIndex, timestamp] of newMap.entries()) {
          if (now - timestamp > 500) {
            newMap.delete(tickIndex);
            hasChanges = true;
          }
        }
        
        return hasChanges ? newMap : prev;
      });
    }, 100); // Check every 100ms
    
    return () => clearInterval(interval);
  }, []);

  // Generate editorial timeline ruler
  const generateRuler = (): JSX.Element[] => {
    if (ticks.length === 0) return [];
    
    const renderedTicks: JSX.Element[] = [];
    const now = Date.now();

    ticks.forEach((tick, i) => {
      const isActive = i === activeTickIndex;
      const wasRecentlyActive = recentTicks.has(i);
      const timeSinceActive = wasRecentlyActive ? now - (recentTicks.get(i) || 0) : 0;
      
      // Calculate tick properties
      const baseHeight = 16; // All regular ticks
      const monthHeight = 24; // Month start ticks slightly taller
      const activeHeight = 40; // Current active tick
      
      let tickHeight = baseHeight;
      let tickColor = '#d1d5db'; // All same color (light grey)
      
      // ONLY the active tick is thicker
      if (isActive) {
        tickHeight = activeHeight;
        tickColor = '#000000'; // Black
      } else if (wasRecentlyActive && timeSinceActive < 500) {
        // Wave effect - stays 1px wide
        const progress = timeSinceActive / 500;
        const waveHeight = baseHeight + ((activeHeight - baseHeight) * (1 - progress));
        tickHeight = waveHeight;
        tickColor = '#d1d5db';
      } else if (tick.isMonthStart) {
        // Month start - slightly taller, but SAME thickness
        tickHeight = monthHeight;
        tickColor = '#d1d5db';
      }
      // All other ticks: tickHeight = baseHeight

      // Use X position in key to ensure uniqueness
      const uniqueKey = `tick-${Math.round(tick.x)}`;

      renderedTicks.push(
        <div
          key={uniqueKey}
          className="absolute flex flex-col items-center"
          style={{ left: `${tick.x + 100}px`, bottom: 0 }}
        >
          {/* Tick line - static width via className, animate only height and color */}
          <motion.div
            key={`line-${uniqueKey}-${isActive ? 'active' : 'inactive'}`}
            className={isActive ? 'w-[2px]' : 'w-[1px]'}
            initial={{ height: baseHeight }}
            animate={{
              height: tickHeight,
              backgroundColor: tickColor,
            }}
            transition={{
              height: { duration: 0.2, ease: "easeOut" },
              backgroundColor: { duration: 0.15, ease: "easeOut" }
            }}
          />
          
          {/* Month label (only for months with media) */}
          {tick.monthLabel && (
            <div className="absolute -bottom-7 text-[10px] font-bold text-gray-500 tracking-wider whitespace-nowrap">
              {tick.monthLabel}
            </div>
          )}
        </div>
      );
    });

    return renderedTicks;
  };

  return (
    <div className="fixed inset-0 bg-white">
      {/* Note Palette */}
      <NotePalette 
        onColorSelect={handleColorSelect}
        activeColor={placementColor}
        isDeleteMode={isDeleteMode}
        onToggleDeleteMode={handleToggleDeleteMode}
      />

      <div
        ref={scrollContainerRef}
        className="h-full w-full overflow-x-auto overflow-y-hidden scrollbar-hide"
        style={{
          cursor: placementColor ? 'crosshair' : 'default',
        }}
      >
        {/* Scrollable canvas */}
        <div 
          ref={canvasRef}
          className="relative h-full" 
          style={{ width: `${totalWidth}px` }}
          onClick={handleCanvasClick}
        >
          
          {/* Floating images - equal spacing */}
          {positions.map((pos, index) => {
            const item = pos.item;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="absolute z-30"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  width: `${pos.width}px`,
                  height: `${pos.height}px`,
                  pointerEvents: placementColor ? 'none' : 'auto',
                }}
                onMouseEnter={() => !placementColor && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image or Video */}
                {item.type === 'video' && item.videoSrc ? (
                  <video
                    src={item.videoSrc}
                    className="h-full w-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.src}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    style={{
                      borderRadius: 0,
                      boxShadow: 'none',
                    }}
                  />
                )}

                {/* Hover labels */}
                {hoveredIndex === index && !placementColor && (
                  <>
                    {/* Title above image */}
                    <motion.div
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.45,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="absolute -top-10 left-0 text-left"
                      style={{
                        fontSize: '14px',
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="font-bold tracking-tight text-black">
                        {item.title}
                      </div>
                    </motion.div>

                    {/* Date below image */}
                    <motion.div
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.45,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: 0.05,
                      }}
                      className="absolute -bottom-7 left-0 text-left"
                      style={{
                        fontSize: '11px',
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="text-gray-500">{formatDate(item.date)}</div>
                    </motion.div>
                  </>
                )}
              </motion.div>
            );
          })}

          {/* Sticky Notes - rendered on top of all images */}
          {notes.map(note => (
            <StickyNote
              key={note.id}
              id={note.id}
              initialText={note.text}
              color={note.color}
              rotation={note.rotation}
              x={note.x}
              y={note.y}
              isDeleteMode={isDeleteMode}
              onDelete={handleDeleteNote}
              onTextChange={handleNoteTextChange}
              onPositionChange={handleNotePositionChange}
            />
          ))}

          {/* Bottom timeline ruler */}
          <div className="absolute bottom-12 left-0 h-24 z-10" style={{ width: `${totalWidth}px` }}>
            <div className="relative h-full">
              {generateRuler()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

