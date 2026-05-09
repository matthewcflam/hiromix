export interface TimelineItem {
  id: string;
  date: string; // ISO date string
  type: "image" | "video" | "project";
  src: string;
  width: "portrait" | "square" | "landscape";
  scale?: number; // Scale percentage (100 = 100%, 80 = 80%, etc.)
  category?: string;
  description?: string;
  videoSrc?: string; // For video type
  song?: string; // Optional song reference
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt: string;
  audioSrc?: string;
  duration?: number; // in seconds
}

export interface Playlist {
  tracks: MusicTrack[];
  currentIndex: number;
}

export interface StickyNoteRecord {
  id: string;
  boardId: string;
  text: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

export interface StickyNoteInsertInput {
  id: string;
  boardId: string;
  text: string;
  color: string;
  x: number;
  y: number;
  rotation: number;
  createdBy?: string | null;
}

export interface StickyNoteUpdateInput {
  text?: string;
  color?: string;
  x?: number;
  y?: number;
  rotation?: number;
}
