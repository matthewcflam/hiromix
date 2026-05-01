export interface TimelineItem {
  id: string;
  date: string; // ISO date string
  type: "image" | "video" | "project";
  src: string;
  width: "portrait" | "square" | "landscape";
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
