"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { StickyNoteRecord, TimelineItem } from "@/types";
import StickyNote from "./StickyNote";
import NotePalette from "./NotePalette";
import { useSoundManager } from "@/lib/useSoundManager";
import {
  createStickyNote,
  DEFAULT_STICKY_NOTES_BOARD_ID,
  deleteStickyNote,
  listStickyNotes,
  subscribeToStickyNotes,
  unsubscribeFromStickyNotes,
  updateStickyNote,
} from "@/lib/stickyNotesApi";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";

interface TimelineCarouselProps {
  items: TimelineItem[];
}

type Note = StickyNoteRecord;

type NotesSyncStatus = "connecting" | "live" | "local-fallback" | "sync-error";

interface RenderWindow {
  startIndex: number;
  endIndex: number;
  startX: number;
  endX: number;
}

const STICKY_NOTES_LOCAL_STORAGE_KEY = "timeline-notes";
const STICKY_NOTE_TEXT_DEBOUNCE_MS = 400;

const removeListenerSafely = (
  target: EventTarget,
  eventName: string,
  listener: EventListenerOrEventListenerObject | null | undefined
) => {
  if (listener && (typeof listener === "function" || typeof listener === "object")) {
    target.removeEventListener(eventName, listener);
  }
};

// Image size configurations based on width type
const IMAGE_SIZES = {
  portrait: { width: 300, height: 400 },
  square: { width: 300, height: 300 },
  landscape: { width: 400, height: 300 },
};

const ITEM_OVERSCAN_COUNT = 4;
const ITEM_OVERSCAN_PX = 1600;
const TICK_OVERSCAN_PX = 900;

const FIXED_GAP = 20; // Equal whitespace between all photos
const TICK_SPACING = 11; // Uniform pixel pitch between ticks (matches tlb.betteroff.studio)

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

interface TickData {
  x: number; // Use integer X position for both deduplication AND rendering
  isMonthStart: boolean;
  monthLabel?: string;
  index: number;
}

// Calculate positions with equal spacing and generate editorial ticks
const calculateTimelinePositions = (items: TimelineItem[], viewportWidth: number) => {
  if (items.length === 0) return {
    positions: [],
    totalWidth: Math.max(1000, viewportWidth),
    ticks: [],
    firstMonthTickIndex: 0,
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
    index: number;
    item: TimelineItem;
  }> = [];
  
  // Collect month-marker positions (photo center x + label) for new-month photos.
  // Ticks themselves are generated uniformly after totalWidth is known.
  const monthMarkers: Array<{ centerX: number; label: string }> = [];
  const safeViewportWidth = Math.max(0, viewportWidth);
  const firstSize = IMAGE_SIZES[sortedItems[0].width];
  const lastSize = IMAGE_SIZES[sortedItems[sortedItems.length - 1].width];
  const startPadding = Math.max(0, (safeViewportWidth / 2) - (firstSize.width / 2));
  const endPadding = Math.max(0, (safeViewportWidth / 2) - (lastSize.width / 2));
  
  let currentX = startPadding;
  
  sortedItems.forEach((item, index) => {
    const baseSize = IMAGE_SIZES[item.width];
    const scale = (item.scale ?? 100) / 100;
    const size = {
      width: baseSize.width * scale,
      height: baseSize.height * scale,
    };
    
    // Center each image vertically
    // Assuming viewport height, we'll use a reasonable center point
    // This will be further adjusted by CSS, but we set a base center position
    const viewportCenter = 300; // Approximate vertical center
    const y = viewportCenter - (size.height / 2);
    
    positions.push({
      x: currentX,
      y: y,
      width: size.width,
      height: size.height,
      index,
      item: item,
    });
    
    // Check if this is the first photo of a new month — record a month marker
    const currentMonth = new Date(item.date).getMonth();
    const isMonthStart = index === 0 ||
      new Date(sortedItems[index - 1].date).getMonth() !== currentMonth;
    if (isMonthStart) {
      monthMarkers.push({
        centerX: currentX + size.width / 2,
        label: `${MONTHS[currentMonth]} ${new Date(item.date).getFullYear()}`,
      });
    }

    // Update position for next item
    currentX += size.width + FIXED_GAP;
  });

  // Calculate total width needed
  const lastPos = positions[positions.length - 1];
  const totalWidth = lastPos.x + lastPos.width + endPadding;

  // Generate uniform ticks at a fixed pixel pitch — only across the content span
  // (first photo center → last photo center). No ticks in the leading/trailing padding.
  const firstCenter = positions[0].x + positions[0].width / 2;
  const lastCenter = lastPos.x + lastPos.width / 2;
  const allTicks: TickData[] = [];
  for (let x = firstCenter, index = 0; x <= lastCenter; x += TICK_SPACING, index++) {
    allTicks.push({
      x: Math.round(x),
      isMonthStart: false,
      monthLabel: undefined,
      index,
    });
  }

  // Snap each month marker to its nearest uniform tick (indices are relative to firstCenter)
  let firstMonthTickIndex = 0;
  monthMarkers.forEach((marker, markerIdx) => {
    const tickIndex = Math.min(
      allTicks.length - 1,
      Math.max(0, Math.round((marker.centerX - firstCenter) / TICK_SPACING))
    );
    const tick = allTicks[tickIndex];
    if (tick && !tick.monthLabel) {
      tick.isMonthStart = true;
      tick.monthLabel = marker.label;
      if (markerIdx === 0) firstMonthTickIndex = tickIndex;
    }
  });

  return { positions, totalWidth, ticks: allTicks, firstMonthTickIndex };
};

export default function TimelineCarousel({ items }: TimelineCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeTickIndexRef = useRef(0);
  const activeTickSinceRef = useRef(0); // Timestamp when the active tick last changed (for grow-in animation)
  const recentTicksRef = useRef<Map<number, { ts: number; vel: number }>>(new Map()); // Map<tickIndex, { passed-at timestamp, scroll velocity at pass time }>
  const previousScrollRef = useRef(0);
  const previousTickRef = useRef(0); // Track previous tick for interpolation
  const [notes, setNotes] = useState<Note[]>([]);
  const notesRef = useRef<Note[]>([]);
  const [placementColor, setPlacementColor] = useState<string | null>(null);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [failedVideoIds, setFailedVideoIds] = useState<Set<string>>(new Set());
  const [notesSyncStatus, setNotesSyncStatus] = useState<NotesSyncStatus>("connecting");
  const [notesSyncMessage, setNotesSyncMessage] = useState<string | null>(null);
  const [renderWindow, setRenderWindow] = useState<RenderWindow>({
    startIndex: 0,
    endIndex: 0,
    startX: 0,
    endX: 0,
  });
  const scrollStateRef = useRef({ current: 0, target: 0 });
  const rulerCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTimelineVisible, setIsTimelineVisible] = useState(false);
  const hasPlayedInitialScrollTickRef = useRef(false);
  const hasUserInteractedForAudioRef = useRef(false);
  const hasShownCenteredStateRef = useRef(false);
  const textSyncTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const stickyBoardIdRef = useRef(DEFAULT_STICKY_NOTES_BOARD_ID);
  const isRealtimeEnabledRef = useRef(
    process.env.NEXT_PUBLIC_STICKY_NOTES_REALTIME !== "false" && getSupabaseBrowserClient() !== null
  );
  
  // Sound manager for tick sounds
  const soundManager = useSoundManager({ enabled: true, volume: 0.5 });
  const {
    unlockAudio,
    playTick,
    playPaperPlace,
    playPaperCrumple,
    playPaperFall,
  } = soundManager;
  const scrollVelocityRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());

  // Cached viewport width — avoids reading container.clientWidth (forced layout) every RAF frame
  const viewportWidthRef = useRef(viewportWidth);
  // Single-active-video playback: only the centered video decodes; the rest show their poster
  const videoElsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const activeVideoIdRef = useRef<string | null>(null);
  
  // Set to false to disable debug logging
  const DEBUG_PERSISTENCE = false;

  // Calculate positions and ticks
  const { positions, totalWidth, ticks, firstMonthTickIndex } = useMemo(
    () => calculateTimelinePositions(items, viewportWidth),
    [items, viewportWidth]
  );

  const visiblePositions = useMemo(() => {
    if (positions.length === 0) {
      return [];
    }

    const startIndex = Math.max(0, Math.min(renderWindow.startIndex, positions.length - 1));
    const endIndex = Math.max(startIndex, Math.min(renderWindow.endIndex, positions.length - 1));
    return positions.slice(startIndex, endIndex + 1);
  }, [positions, renderWindow.endIndex, renderWindow.startIndex]);

  // Only mount sticky notes whose x falls within the current render window (plus a
  // buffer for note width). Keeps note count off the main thread regardless of how
  // many are placed across the timeline. A note being edited is, by definition, on
  // screen, so it stays within this range and won't lose focus.
  const NOTE_VIRTUALIZE_BUFFER = 240;
  const visibleNotes = useMemo(() => {
    if (notes.length === 0) return notes;
    const minX = renderWindow.startX - NOTE_VIRTUALIZE_BUFFER;
    const maxX = renderWindow.endX + NOTE_VIRTUALIZE_BUFFER;
    return notes.filter((note) => note.x >= minX && note.x <= maxX);
  }, [notes, renderWindow.startX, renderWindow.endX]);

  // Calculate scale based on viewport height
  useLayoutEffect(() => {
    const updateScale = () => {
      const vw = scrollContainerRef.current?.clientWidth ?? window.innerWidth;
      const vh = window.innerHeight;
      viewportWidthRef.current = vw;
      setViewportWidth(vw);
      setViewportHeight(vh);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const loadNotesFromLocalStorage = (): Note[] => {
    if (typeof window === "undefined" || !window.localStorage) {
      return [];
    }

    const saved = localStorage.getItem(STICKY_NOTES_LOCAL_STORAGE_KEY);
    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as Array<Partial<Note>>;
    const nowIso = new Date().toISOString();

    return parsed
      .filter((note) => typeof note.id === "string" && note.id.length > 0)
      .map((note) => ({
        id: note.id as string,
        boardId: typeof note.boardId === "string" ? note.boardId : stickyBoardIdRef.current,
        text: typeof note.text === "string" ? note.text : "",
        color: typeof note.color === "string" ? note.color : "yellow",
        x: typeof note.x === "number" ? note.x : 0,
        y: typeof note.y === "number" ? note.y : 0,
        rotation: typeof note.rotation === "number" ? note.rotation : 0,
        createdAt: typeof note.createdAt === "string" ? note.createdAt : nowIso,
        updatedAt: typeof note.updatedAt === "string" ? note.updatedAt : nowIso,
        createdBy: typeof note.createdBy === "string" ? note.createdBy : null,
      }));
  };

  const setNoteWithConflictResolution = (incomingNote: Note) => {
    setNotes((prevNotes) => {
      const existing = prevNotes.find((note) => note.id === incomingNote.id);
      if (!existing) {
        return [...prevNotes, incomingNote];
      }

      const incomingTs = Date.parse(incomingNote.updatedAt);
      const existingTs = Date.parse(existing.updatedAt);
      const shouldReplace = Number.isNaN(existingTs) || incomingTs >= existingTs;

      if (!shouldReplace) {
        return prevNotes;
      }

      return prevNotes.map((note) => (note.id === incomingNote.id ? incomingNote : note));
    });
  };

  useEffect(() => {
    let isMounted = true;
    let realtimeChannel: ReturnType<typeof subscribeToStickyNotes> | null = null;
    const isRealtimeEnabled = isRealtimeEnabledRef.current;
    const stickyBoardId = stickyBoardIdRef.current;
    const textSyncTimeouts = textSyncTimeoutsRef.current;

    const loadLocalFallback = (reason: "disabled" | "error") => {
      try {
        const localNotes = loadNotesFromLocalStorage();
        if (isMounted) {
          setNotes(localNotes);
          setNotesSyncStatus(reason === "disabled" ? "local-fallback" : "sync-error");
          setNotesSyncMessage(
            reason === "disabled"
              ? "Realtime is disabled. Notes are stored per browser."
              : "Realtime unavailable. Showing local cached notes."
          );
        }
      } catch (error) {
        console.error("❌ Failed to load local sticky notes fallback:", error);
        if (isMounted) {
          setNotes([]);
          setNotesSyncStatus("sync-error");
          setNotesSyncMessage("Failed to load sticky notes.");
        }
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    const initializeRealtime = async () => {
      if (!isRealtimeEnabled) {
        loadLocalFallback("disabled");
        return;
      }

      try {
        setNotesSyncStatus("connecting");
        setNotesSyncMessage("Connecting sticky notes...");

        const initialNotes = await listStickyNotes(stickyBoardId);
        if (!isMounted) return;

        setNotes(initialNotes);
        setNotesSyncStatus("live");
        setNotesSyncMessage("Live sync connected");

        realtimeChannel = subscribeToStickyNotes(stickyBoardId, {
          onInsert: (note) => setNoteWithConflictResolution(note),
          onUpdate: (note) => setNoteWithConflictResolution(note),
          onDelete: (noteId) => {
            setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
          },
          onStatusChange: (status) => {
            if (!isMounted) return;

            if (status === "SUBSCRIBED") {
              setNotesSyncStatus("live");
              setNotesSyncMessage("Live sync connected");
              return;
            }

            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              setNotesSyncStatus("sync-error");
              setNotesSyncMessage("Realtime connection dropped. Trying to reconnect...");
              return;
            }

            if (status === "CLOSED") {
              setNotesSyncStatus("sync-error");
              setNotesSyncMessage("Realtime connection closed.");
            }
          },
        });
      } catch (error) {
        console.error("❌ Failed to initialize realtime sticky notes:", error);
        loadLocalFallback("error");
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    void initializeRealtime();

    return () => {
      isMounted = false;
      textSyncTimeouts.forEach((timeoutId, noteId) => {
        clearTimeout(timeoutId);

        if (!isRealtimeEnabled) {
          return;
        }

        const latestNote = notesRef.current.find((note) => note.id === noteId);
        if (!latestNote) {
          return;
        }

        void updateStickyNote(noteId, stickyBoardId, { text: latestNote.text }).catch((error) => {
          console.error(`❌ Failed to flush pending note text sync for ${noteId}:`, error);
        });
      });
      textSyncTimeouts.clear();

      if (realtimeChannel) {
        void unsubscribeFromStickyNotes(realtimeChannel).catch((error) => {
          console.error("❌ Failed to unsubscribe sticky notes channel:", error);
        });
      }
    };
  }, []);

  // Cache latest notes in localStorage for fast reloads and offline fallback.
  useEffect(() => {
    if (!isInitialized || typeof window === "undefined" || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem(STICKY_NOTES_LOCAL_STORAGE_KEY, JSON.stringify(notes));
      if (DEBUG_PERSISTENCE) console.log(`💾 Cached ${notes.length} sticky notes locally`);
    } catch (error) {
      console.error("❌ Failed to cache sticky notes locally:", error);
    }
  }, [notes, isInitialized, DEBUG_PERSISTENCE]);

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

  const createNoteId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const syncNoteText = (noteId: string, text: string) => {
    if (!isRealtimeEnabledRef.current) return;

    void updateStickyNote(noteId, stickyBoardIdRef.current, { text })
      .then((serverNote) => {
        setNoteWithConflictResolution(serverNote);
      })
      .catch((error) => {
        console.error(`❌ Failed to sync note text for ${noteId}:`, error);
        setNotesSyncStatus("sync-error");
        setNotesSyncMessage("Failed to sync note text.");
      });
  };

  const scheduleNoteTextSync = (noteId: string, text: string) => {
    if (!isRealtimeEnabledRef.current) return;

    const existingTimeout = textSyncTimeoutsRef.current.get(noteId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeoutId = setTimeout(() => {
      textSyncTimeoutsRef.current.delete(noteId);
      syncNoteText(noteId, text);
    }, STICKY_NOTE_TEXT_DEBOUNCE_MS);

    textSyncTimeoutsRef.current.set(noteId, timeoutId);
  };

  // Handle click on canvas to place note
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't place notes if in delete mode
    if (isDeleteMode) return;
    
    if (!placementColor || !canvasRef.current) return;

    // Play paper place sound
    playPaperPlace();

    // Get the bounding rectangle of the canvas
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Calculate position relative to the canvas
    // e.clientX is relative to viewport, rect.left is canvas left edge relative to viewport
    // This gives us the correct position on the canvas regardless of scroll
    const noteSize = 192; // w-48 h-48 = 192px
    const x = e.clientX - rect.left - (noteSize / 2);
    const y = e.clientY - rect.top - (noteSize / 2);

    const nowIso = new Date().toISOString();
    const newNote: Note = {
      id: createNoteId(),
      boardId: stickyBoardIdRef.current,
      text: '',
      color: placementColor,
      x,
      y,
      rotation: 0, // No rotation - perfectly aligned
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: null,
    };

    setNotes(prevNotes => [...prevNotes, newNote]);

    if (isRealtimeEnabledRef.current) {
      void createStickyNote({
        id: newNote.id,
        boardId: newNote.boardId,
        text: newNote.text,
        color: newNote.color,
        x: newNote.x,
        y: newNote.y,
        rotation: newNote.rotation,
        createdBy: newNote.createdBy,
      })
        .then((serverNote) => {
          setNoteWithConflictResolution(serverNote);
        })
        .catch((error) => {
          console.error(`❌ Failed to create sticky note ${newNote.id}:`, error);
          setNotesSyncStatus("sync-error");
          setNotesSyncMessage("Failed to create sticky note.");
        });
    }

    // Automatically deselect color after placing one note
    setPlacementColor(null);
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notesRef.current.find((note) => note.id === noteId) ?? null;
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    const pendingTimeout = textSyncTimeoutsRef.current.get(noteId);
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      textSyncTimeoutsRef.current.delete(noteId);
    }

    if (isRealtimeEnabledRef.current) {
      void deleteStickyNote(noteId, stickyBoardIdRef.current).catch((error) => {
        console.error(`❌ Failed to delete sticky note ${noteId}:`, error);
        setNotesSyncStatus("sync-error");
        setNotesSyncMessage("Failed to delete sticky note.");
        if (noteToDelete) {
          setNoteWithConflictResolution(noteToDelete);
        }
      });
    }

    // Keep delete mode active - user must manually click delete button to exit
  };

  // Update note text
  const handleNoteTextChange = (noteId: string, text: string) => {
    const nowIso = new Date().toISOString();
    setNotes(prevNotes => prevNotes.map(note => 
      note.id === noteId ? { ...note, text, updatedAt: nowIso } : note
    ));
    scheduleNoteTextSync(noteId, text);
  };

  // Update note position
  const handleNotePositionChange = (noteId: string, x: number, y: number) => {
    let previousPosition: { x: number; y: number } | null = null;
    const nowIso = new Date().toISOString();

    setNotes(prevNotes => prevNotes.map(note => {
      if (note.id !== noteId) return note;
      previousPosition = { x: note.x, y: note.y };
      return { ...note, x, y, updatedAt: nowIso };
    }));

    if (isRealtimeEnabledRef.current) {
      void updateStickyNote(noteId, stickyBoardIdRef.current, { x, y })
        .then((serverNote) => {
          setNoteWithConflictResolution(serverNote);
        })
        .catch((error) => {
          console.error(`❌ Failed to sync sticky note position for ${noteId}:`, error);
          setNotesSyncStatus("sync-error");
          setNotesSyncMessage("Failed to sync note movement.");
          if (previousPosition) {
            const { x: previousX, y: previousY } = previousPosition;
            setNotes((prevNotes) =>
              prevNotes.map((note) =>
                note.id === noteId
                  ? {
                      ...note,
                      x: previousX,
                      y: previousY,
                    }
                  : note
              )
            );
          }
        });
    }
  };

  const handleVideoLoaded = (itemId: string) => {
    setFailedVideoIds((prev) => {
      if (!prev.has(itemId)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleVideoError = (item: TimelineItem) => {
    console.error(`❌ Failed to load timeline video. id=${item.id}, videoSrc=${item.videoSrc}`);
    setFailedVideoIds((prev) => {
      if (prev.has(item.id)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  // Play only the centered video; pause everything else so at most one video decodes
  // at a time. Driven imperatively from the RAF loop to avoid re-renders.
  const activateVideo = (id: string | null) => {
    if (activeVideoIdRef.current === id) return;
    const prevId = activeVideoIdRef.current;
    activeVideoIdRef.current = id;

    if (prevId) {
      const prevEl = videoElsRef.current.get(prevId);
      if (prevEl) {
        try { prevEl.pause(); } catch { /* ignore */ }
      }
    }
    if (id) {
      const el = videoElsRef.current.get(id);
      if (el) {
        const playback = el.play();
        if (playback && typeof playback.catch === "function") {
          playback.catch(() => { /* autoplay/decoding rejection is non-fatal */ });
        }
      }
    }
  };

  // Scroll system: fixed container + single translateX track + canvas ruler
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const markAudioInteraction = () => {
      hasUserInteractedForAudioRef.current = true;
      unlockAudio();
    };

    const handleScrollGestureAudio = () => {
      markAudioInteraction();
      if (!hasPlayedInitialScrollTickRef.current) {
        const played = playTick(0.15);
        if (played) hasPlayedInitialScrollTickRef.current = true;
      }
    };

    window.addEventListener('touchstart', markAudioInteraction, { passive: true });
    window.addEventListener('pointerdown', markAudioInteraction, { passive: true });
    window.addEventListener('mousedown', markAudioInteraction, { passive: true });

    // Canvas ruler: initialize at device pixel ratio for crisp rendering
    const initRulerCanvas = () => {
      const canvas = rulerCanvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = 96 * dpr;
    };
    initRulerCanvas();
    window.addEventListener('resize', initRulerCanvas);

    // Measure once when this effect (re)runs; thereafter read the cached ref so the
    // RAF loop never triggers a forced synchronous layout via clientWidth.
    viewportWidthRef.current = container.clientWidth || window.innerWidth || 800;
    const getViewportWidth = () => viewportWidthRef.current || window.innerWidth || 800;
    const getMaxScroll = () => Math.max(0, totalWidth - getViewportWidth());

    const updateRenderWindow = (scroll: number) => {
      if (positions.length === 0 || ticks.length === 0) return;
      const viewportWidthNow = getViewportWidth();
      const startX = Math.max(0, scroll - ITEM_OVERSCAN_PX);
      const endX = scroll + viewportWidthNow + ITEM_OVERSCAN_PX;

      let firstVisibleIndex = 0;
      while (
        firstVisibleIndex < positions.length &&
        positions[firstVisibleIndex].x + positions[firstVisibleIndex].width < startX
      ) firstVisibleIndex++;

      let lastVisibleIndex = firstVisibleIndex;
      while (
        lastVisibleIndex < positions.length &&
        positions[lastVisibleIndex].x <= endX
      ) lastVisibleIndex++;

      const nextWindow: RenderWindow = {
        startIndex: Math.max(0, firstVisibleIndex - ITEM_OVERSCAN_COUNT),
        endIndex: Math.min(
          positions.length - 1,
          Math.max(firstVisibleIndex, lastVisibleIndex - 1) + ITEM_OVERSCAN_COUNT
        ),
        startX: Math.max(0, startX - TICK_OVERSCAN_PX),
        endX: endX + TICK_OVERSCAN_PX,
      };

      setRenderWindow((prev) => {
        if (
          prev.startIndex === nextWindow.startIndex &&
          prev.endIndex === nextWindow.endIndex &&
          prev.startX === nextWindow.startX &&
          prev.endX === nextWindow.endX
        ) return prev;
        return nextWindow;
      });
    };

    // Draw ruler ticks directly on canvas — zero React/DOM overhead.
    // Geometry/colors mirror tlb.betteroff.studio: 1px ticks, fixed baseline,
    // 12px @ rgba(0,0,0,0.25) resting, 22px month markers, 50px solid-black active.
    const TICK_BASE = 60; // px from canvas top — active 50px tick grows up to y=10
    const drawRuler = (scrollX: number) => {
      const canvas = rulerCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr;
      const now = Date.now();
      const activeIdx = activeTickIndexRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Only iterate the on-screen tick slice. Ticks are sorted by x, so binary-search
      // the first visible tick; this keeps per-frame work O(visible) no matter how long
      // the timeline grows.
      const minX = scrollX - 4;
      const maxX = scrollX + W + 4;
      let visLo = 0;
      let visHi = ticks.length - 1;
      while (visLo < visHi) {
        const mid = (visLo + visHi) >> 1;
        if (ticks[mid].x < minX) visLo = mid + 1;
        else visHi = mid;
      }

      for (let ti = visLo; ti < ticks.length; ti++) {
        const tick = ticks[ti];
        if (tick.x > maxX) break;
        const sx = tick.x - scrollX;

        const isActive = tick.index === activeIdx;
        const recentTs = recentTicksRef.current.get(tick.index);

        // Velocity- and distance-dependent decay window for the trail: faster
        // scrolling shortens the whole trail, and amplifies how much each tick of
        // distance from the active ticker shaves off — so on a fast flick the far
        // end of the trail collapses to rest almost immediately while the ticks
        // right behind the cursor still linger. At rest (vel 0) it stays ~600ms.
        const decayMs = recentTs
          ? Math.max(120, 600 - recentTs.vel * 200 - Math.abs(tick.index - activeIdx) * recentTs.vel * 30)
          : 600;

        let height = 12;
        let color = 'rgba(0,0,0,0.25)';

        if (isActive) {
          // Grow quickly to full height each time a new tick becomes active,
          // rather than snapping straight to 50. Ease-out over a short window.
          const ACTIVE_GROW_MS = 180;
          const restHeight = tick.isMonthStart ? 22 : 12;
          const age = now - activeTickSinceRef.current;
          const t = Math.min(1, age / ACTIVE_GROW_MS);
          const eased = 1 - Math.pow(1 - t, 4); // ease-out-quart
          height = restHeight + (50 - restHeight) * eased;
          const alpha = 0.25 + (1 - 0.25) * eased;
          color = `rgba(0,0,0,${alpha.toFixed(3)})`;
        } else if (recentTs !== undefined && now - recentTs.ts < decayMs) {
          // Wave decay: recently-passed ticks swell then settle back to their
          // own rest height — month markers floor at 22 (never dip to 12 and regrow).
          const age = now - recentTs.ts;
          const t = 1 - Math.pow(1 - age / decayMs, 2); // ease-in-quad falloff
          const restHeight = tick.isMonthStart ? 22 : 12;
          const peakHeight = Math.max(30, restHeight);
          height = restHeight + (peakHeight - restHeight) * (1 - t);
          const alpha = 0.25 + (0.55 - 0.25) * (1 - t);
          color = `rgba(0,0,0,${alpha.toFixed(3)})`;
        } else if (tick.isMonthStart) {
          height = 22;
          color = 'rgba(0,0,0,0.25)';
        }

        ctx.fillStyle = color;
        ctx.fillRect(Math.round(sx), TICK_BASE - height, 1, height);

        if (tick.monthLabel) {
          ctx.fillStyle = 'rgba(0,0,0,0.85)';
          ctx.font = '500 13px ui-monospace, SFMono-Regular, "Cascadia Code", Menlo, Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(tick.monthLabel.toUpperCase(), sx, TICK_BASE + 18);
        }
      }

      ctx.restore();
    };

    // Set initial scroll position
    if (positions.length > 0 && ticks.length > 0) {
      const viewportHalf = getViewportWidth() / 2;
      // On first load, center on the first month; afterwards preserve the active tick.
      const targetTickIndex = hasShownCenteredStateRef.current
        ? Math.min(activeTickIndexRef.current, ticks.length - 1)
        : Math.min(firstMonthTickIndex, ticks.length - 1);
      if (!hasShownCenteredStateRef.current) {
        activeTickIndexRef.current = targetTickIndex;
        previousTickRef.current = targetTickIndex;
      }
      const activeTick = ticks[targetTickIndex];
      const initialScroll = Math.max(0, activeTick.x - viewportHalf);
      scrollStateRef.current.current = initialScroll;
      scrollStateRef.current.target = initialScroll;
      previousScrollRef.current = initialScroll;
      updateRenderWindow(initialScroll);
      if (canvasRef.current) {
        canvasRef.current.style.transform = `translateX(-${initialScroll}px)`;
      }
      drawRuler(initialScroll);
    }

    if (!hasShownCenteredStateRef.current) {
      hasShownCenteredStateRef.current = true;
      setIsTimelineVisible(true);
    }

    // Wheel: accumulate target, let lerp smooth it
    const WHEEL_MULTIPLIER = 2.0;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleScrollGestureAudio();
      const delta = e.deltaMode === 1
        ? (e.deltaY || e.deltaX) * 40
        : (e.deltaY || e.deltaX);
      const state = scrollStateRef.current;
      state.target = Math.max(0, Math.min(getMaxScroll(), state.target + delta * WHEEL_MULTIPLIER));
    };

    // Pointer drag for mouse/touch drag-to-scroll
    const DRAG_MULTIPLIER = 1.5;
    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragStartScrollRef.current = scrollStateRef.current.target;
      container.setPointerCapture(e.pointerId);
      handleScrollGestureAudio();
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const dx = dragStartXRef.current - e.clientX;
      scrollStateRef.current.target = Math.max(
        0,
        Math.min(getMaxScroll(), dragStartScrollRef.current + dx * DRAG_MULTIPLIER)
      );
    };
    const handlePointerUp = () => { isDraggingRef.current = false; };

    // Keyboard arrow scroll
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 300;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        scrollStateRef.current.target = Math.min(getMaxScroll(), scrollStateRef.current.target + step);
        markAudioInteraction();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        scrollStateRef.current.target = Math.max(0, scrollStateRef.current.target - step);
        markAudioInteraction();
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('keydown', handleKeyDown);

    // RAF loop: lerp scroll → apply transform → draw canvas → tick sounds
    const LERP_FACTOR = 0.10;

    function raf() {
      const state = scrollStateRef.current;
      const dx = state.target - state.current;
      if (Math.abs(dx) > 0.01) {
        state.current += dx * LERP_FACTOR;
      } else {
        state.current = state.target;
      }
      const scrollX = state.current;

      // Single transform on the track — compositor only, no layout
      if (canvasRef.current) {
        canvasRef.current.style.transform = `translateX(-${scrollX}px)`;
      }

      // Draw ruler canvas
      drawRuler(scrollX);

      // Velocity for tick sounds
      const now = Date.now();
      const timeDelta = Math.max(1, now - lastScrollTimeRef.current);
      const scrollDelta = Math.abs(scrollX - previousScrollRef.current);
      const normalizedVelocity = Math.min(1, (scrollDelta / timeDelta) / 5);
      scrollVelocityRef.current = normalizedVelocity;

      let playedTickThisFrame = false;
      if (hasUserInteractedForAudioRef.current && normalizedVelocity > 0.05 && !hasPlayedInitialScrollTickRef.current) {
        unlockAudio();
        const played = playTick(normalizedVelocity);
        if (played) { hasPlayedInitialScrollTickRef.current = true; playedTickThisFrame = true; }
      } else if (normalizedVelocity < 0.01) {
        hasPlayedInitialScrollTickRef.current = false;
      }

      previousScrollRef.current = scrollX;
      lastScrollTimeRef.current = now;

      // Virtualization: update render window (guarded by equality check inside)
      updateRenderWindow(scrollX);

      // Binary search for active tick
      if (ticks.length > 0) {
        const viewportCenter = scrollX + getViewportWidth() / 2;
        let lo = 0, hi = ticks.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (ticks[mid].x < viewportCenter) lo = mid + 1;
          else hi = mid;
        }
        const centerTickIndex =
          lo > 0 && Math.abs(ticks[lo - 1].x - viewportCenter) < Math.abs(ticks[lo].x - viewportCenter)
            ? lo - 1 : lo;

        if (centerTickIndex !== activeTickIndexRef.current) {
          const previousTick = previousTickRef.current;
          const currentTick = centerTickIndex;

          if (normalizedVelocity > 0.05 && !playedTickThisFrame) {
            unlockAudio();
            playTick(normalizedVelocity);
          }

          const tickNow = Date.now();
          const start = Math.min(previousTick, currentTick);
          const end = Math.max(previousTick, currentTick);
          for (let i = start; i <= end; i++) {
            if (i !== currentTick) {
              // Record when this tick was passed AND how fast we were moving, so the
              // draw loop can collapse the trail faster on fast scrolls.
              recentTicksRef.current.set(i, {
                ts: tickNow - Math.abs(i - currentTick) * 2,
                vel: normalizedVelocity,
              });
            }
          }

          previousTickRef.current = centerTickIndex;
          activeTickIndexRef.current = centerTickIndex;
          activeTickSinceRef.current = tickNow;
        }

        // Prune stale recentTicks entries
        if (recentTicksRef.current.size > 100) {
          const cutoff = Date.now() - 700;
          for (const [idx, entry] of recentTicksRef.current) {
            if (entry.ts < cutoff) recentTicksRef.current.delete(idx);
          }
        }
      }

      // Single-active-video: find the item nearest the viewport center and, if it's a
      // video, make it the only one playing. Binary search keeps this O(log n).
      if (positions.length > 0) {
        const center = scrollX + getViewportWidth() / 2;
        let plo = 0, phi = positions.length - 1;
        while (plo < phi) {
          const mid = (plo + phi) >> 1;
          if (positions[mid].x + positions[mid].width / 2 < center) plo = mid + 1;
          else phi = mid;
        }
        let nearest = plo;
        if (plo > 0) {
          const prevDist = Math.abs((positions[plo - 1].x + positions[plo - 1].width / 2) - center);
          const currDist = Math.abs((positions[plo].x + positions[plo].width / 2) - center);
          if (prevDist < currDist) nearest = plo - 1;
        }
        const nearestItem = positions[nearest].item;
        activateVideo(nearestItem.type === 'video' && nearestItem.videoSrc ? nearestItem.id : null);
      }

      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      removeListenerSafely(window, 'touchstart', markAudioInteraction);
      removeListenerSafely(window, 'pointerdown', markAudioInteraction);
      removeListenerSafely(window, 'mousedown', markAudioInteraction);
      removeListenerSafely(window, 'resize', initRulerCanvas);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [positions, ticks, totalWidth, firstMonthTickIndex, playTick, unlockAudio]);

  return (
    <div
      className="fixed inset-0"
      style={{
        opacity: isTimelineVisible ? 1 : 0,
        pointerEvents: isTimelineVisible ? 'auto' : 'none',
        backgroundImage: `
          linear-gradient(to right, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.7)),
          url(/assets/linedpaper.webp),
          url(/assets/callmeifyougetlost.webp)
        `,
        backgroundBlendMode: 'screen, multiply, normal',
        backgroundSize: '100% 100%, 20% 20%, 100% auto',
        backgroundRepeat: 'repeat, repeat, repeat-x',
        backgroundPosition: '0 0, 0 0, 0 0',
      }}
    >
      {/* Note Palette */}
      <NotePalette 
        onColorSelect={handleColorSelect}
        activeColor={placementColor}
        isDeleteMode={isDeleteMode}
        onToggleDeleteMode={handleToggleDeleteMode}
        onPaperCrumpleSound={playPaperCrumple}
      />

      <div className="fixed right-6 top-6 z-[120] pointer-events-none">
        <div
          className={`rounded-full px-3 py-1 text-[11px] font-medium tracking-wide shadow-sm ${
            notesSyncStatus === "live"
              ? "bg-green-100 text-green-800"
              : notesSyncStatus === "connecting"
              ? "bg-blue-100 text-blue-800"
              : notesSyncStatus === "local-fallback"
              ? "bg-gray-100 text-gray-700"
              : "bg-red-100 text-red-800"
          }`}
          title={notesSyncMessage ?? "Sticky notes sync status"}
        >
          {notesSyncStatus === "live"
            ? "Notes: Live"
            : notesSyncStatus === "connecting"
            ? "Notes: Connecting"
            : notesSyncStatus === "local-fallback"
            ? "Notes: Local only"
            : "Notes: Sync error"}
        </div>
      </div>

      {/* Scroll container: overflow-hidden, events handled natively */}
      <div
        ref={scrollContainerRef}
        className="h-full w-full overflow-hidden"
        style={{ cursor: placementColor ? 'crosshair' : 'grab' }}
      >
        {/* Inner track: single translateX driven by RAF loop */}
        <div
          ref={canvasRef}
          className="absolute top-0 left-0 h-full"
          style={{ width: `${totalWidth}px`, willChange: 'transform' }}
          onClick={handleCanvasClick}
        >

          {/* Floating images - equal spacing */}
          {visiblePositions.map((pos) => {
            const item = pos.item;
            const hasFailedVideo = failedVideoIds.has(item.id);
            const isInInitialViewport = pos.x < viewportWidth * 1.5;

            return (
              <div
                key={item.id}
                className="absolute z-30 animate-fade-in"
                style={{
                  left: `${pos.x}px`,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: `${pos.width}px`,
                  height: `${pos.height}px`,
                  pointerEvents: placementColor ? 'none' : 'auto',
                }}
                onMouseEnter={() => !placementColor && setHoveredIndex(pos.index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Image or Video */}
                {item.type === 'video' && item.videoSrc && !hasFailedVideo ? (
                  <video
                    ref={(el) => {
                      if (el) videoElsRef.current.set(item.id, el);
                      else videoElsRef.current.delete(item.id);
                    }}
                    src={item.videoSrc}
                    className="h-full w-full object-cover"
                    loop
                    muted
                    playsInline
                    preload="none"
                    poster={item.src}
                    onLoadedData={() => handleVideoLoaded(item.id)}
                    onError={() => handleVideoError(item)}
                  />
                ) : (
                  <>
                    <Image
                      src={item.src}
                      alt="Content"
                      fill
                      sizes={`${Math.ceil(pos.width)}px`}
                      className="object-cover"
                      quality={75}
                      priority={isInInitialViewport}
                      loading={isInInitialViewport ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </>
                )}

                {/* Hover labels */}
                {hoveredIndex === pos.index && !placementColor && (
                  <div
                    className="absolute -bottom-7 left-0 text-left animate-fade-in"
                    style={{
                      fontSize: '11px',
                      pointerEvents: 'none',
                    }}
                  >
                    <div className="text-gray-500">{formatDate(item.date)}</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Sticky Notes - rendered on top of all images (virtualized to the window) */}
          {visibleNotes.map(note => (
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
              onPaperFallSound={playPaperFall}
              canvasBounds={{ width: totalWidth, height: viewportHeight }}
            />
          ))}
        </div>
      </div>

      {/* Canvas ruler: fixed to viewport, drawn every RAF frame — zero DOM overhead */}
      <canvas
        ref={rulerCanvasRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '96px',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />
    </div>
  );
}

