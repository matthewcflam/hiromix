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

// Specific positions with consistent 32px gaps (edge-to-edge spacing) - larger sizes
// These are base values that will be scaled based on viewport height
const GAP = 32;
const BASE_HEIGHT = 900; // Base viewport height for calculations
const imagePositions = [
  { x: 0, y: 160, width: 235, height: 580 },         // Image 1 (40% larger)
  { x: 0 + 235 + GAP, y: 240, width: 370, height: 336 },       // 267
  { x: 267 + 370 + GAP, y: 180, width: 380, height: 504 },     // 669
  { x: 669 + 380 + GAP, y: 100, width: 375, height: 694 },      // 1081
  { x: 1081 + 375 + GAP, y: 200, width: 370, height: 482 },     // 1488
  { x: 1488 + 370 + GAP, y: 260, width: 280, height: 280 },    // 1890
  { x: 1890 + 280 + GAP, y: 150, width: 403, height: 538 },    // 2202
  { x: 2202 + 403 + GAP, y: 220, width: 347, height: 381 },    // 2637
  { x: 2637 + 347 + GAP, y: 130, width: 314, height: 616 },     // 3016
  { x: 3016 + 314 + GAP, y: 190, width: 414, height: 515 },    // 3362
];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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

  // Calculate scale based on viewport height to ensure timeline is always visible
  useEffect(() => {
    const updateScale = () => {
      const vh = window.innerHeight;
      // Reserve 80px for timeline ruler at bottom
      const availableHeight = vh - 80;
      // Calculate scale based on tallest image (694px) plus some margin
      const maxImageHeight = 694;
      const desiredMaxHeight = availableHeight * 0.85; // Use 85% of available height
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
      const tickSpacing = 16; // px per tick
      const centerTickIndex = Math.round(viewportCenter / tickSpacing);
      
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

  // Generate timeline ruler ticks with individual fall-back animation
  const generateRuler = () => {
    const totalTicks = 360; // 30 days × 12 months = 360 ticks
    const tickSpacing = 16; // px per tick
    const ticks = [];
    const now = Date.now();

    for (let i = 0; i < totalTicks; i++) {
      const isMonthStart = i % 30 === 0;
      const monthIndex = Math.floor(i / 30);
      
      const isActive = i === activeTickIndex;
      const wasRecentlyActive = recentTicks.has(i);
      const timeSinceActive = wasRecentlyActive ? now - (recentTicks.get(i) || 0) : 0;
      
      // Calculate tick properties
      let tickHeight = 16; // base height
      let tickColor = '#d1d5db'; // gray-300
      
      if (isActive) {
        // Current tick - black and tall
        tickHeight = 48;
        tickColor = '#000000';
      } else if (wasRecentlyActive && timeSinceActive < 500) {
        // Recently active tick - falling back down
        // Height decreases over time
        const progress = timeSinceActive / 500; // 0 to 1 over 500ms
        const fallingHeight = 48 - (32 * progress); // 48px -> 16px
        tickHeight = Math.max(16, fallingHeight);
        
        // Color transitions from black to gray
        if (progress < 0.3) {
          tickColor = '#000000'; // black
        } else if (progress < 0.6) {
          tickColor = '#6b7280'; // gray-500
        } else {
          tickColor = '#9ca3af'; // gray-400
        }
      }

      ticks.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: `${i * tickSpacing}px`, bottom: 0 }}
        >
          {/* Tick line with smooth animation */}
          <motion.div
            className="w-px"
            animate={{
              height: tickHeight,
              backgroundColor: tickColor,
            }}
            transition={{
              height: {
                duration: isActive ? 0.3 : 0.2,
                ease: isActive ? [0.34, 1.56, 0.64, 1] : "easeOut",
              },
              backgroundColor: {
                duration: 0.15,
                ease: "easeOut",
              }
            }}
          />
          
          {/* Month label */}
          {isMonthStart && monthIndex < MONTHS.length && (
            <div className="absolute -bottom-6 text-xs font-bold text-gray-400 tracking-wider">
              {MONTHS[monthIndex]}
            </div>
          )}
        </div>
      );
    }

    return ticks;
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
          style={{ width: `${6000 * scale}px` }}
          onClick={handleCanvasClick}
        >
          
          {/* Floating images - absolutely positioned */}
          {items.slice(0, 10).map((item, index) => {
            const pos = imagePositions[index];
            if (!pos) return null;

            const scaledPos = {
              x: pos.x * scale,
              y: pos.y * scale,
              width: pos.width * scale,
              height: pos.height * scale,
            };

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="absolute z-30"
                style={{
                  left: `${scaledPos.x}px`,
                  top: `${scaledPos.y}px`,
                  width: `${scaledPos.width}px`,
                  height: `${scaledPos.height}px`,
                  pointerEvents: placementColor ? 'none' : 'auto',
                }}
                onMouseEnter={() => !placementColor && setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-full w-full object-cover"
                  style={{
                    borderRadius: 0,
                    boxShadow: 'none',
                  }}
                />

                {/* Hover labels */}
                {hoveredIndex === index && !placementColor && (
                  <>
                    {/* Title above image - slides down */}
                    <motion.div
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.45,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="absolute -top-12 left-0 text-left"
                      style={{
                        fontSize: `${14 * (scaledPos.width / 280)}px`,
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="font-bold tracking-tight text-black">
                        {item.title}
                      </div>
                    </motion.div>

                    {/* Date below image - slides up */}
                    <motion.div
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        duration: 0.45,
                        ease: [0.25, 0.46, 0.45, 0.94],
                        delay: 0.05,
                      }}
                      className="absolute -bottom-8 left-0 text-left"
                      style={{
                        fontSize: `${11 * (scaledPos.width / 280)}px`,
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="text-gray-500">{item.date}</div>
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
          <div className="absolute bottom-12 left-0 h-24 z-10" style={{ width: '6000px' }}>
            <div className="relative h-full">
              {generateRuler()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

