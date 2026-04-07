"use client";

import Navigation from "@/components/Navigation";
import HeroHeader from "@/components/HeroHeader";
import TimelineCarousel from "@/components/TimelineCarousel";
import MusicPlayer from "@/components/MusicPlayer";
import { timelineData } from "@/data/timeline";
import { musicTracks } from "@/data/music";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-white">
      <HeroHeader />
      <TimelineCarousel items={timelineData} />
      <MusicPlayer tracks={musicTracks} />
    </main>
  );
}
