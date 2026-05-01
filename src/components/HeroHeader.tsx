"use client";

import { motion } from "framer-motion";

export default function HeroHeader() {
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-20 flex h-screen w-screen items-start justify-center pt-5 sm:pt-8 md:pt-12 lg:pt-16">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-center px-4"
        style={{ mixBlendMode: "difference" }}
      >
        <h1
          className="whitespace-normal sm:whitespace-nowrap font-black text-black"
          style={{
            fontSize: 'clamp(1.5rem, 7vw, 4.5rem)',
            lineHeight: '0.88',
            letterSpacing: '-0.02em',
            fontWeight: 900,
            fontFamily: '"Helvetica", "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <div className="flex flex-col">
            <span>For Anne, my love</span>
            <span></span>
            {/* <span style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}>(BO®S / 2025)</span> */}
          </div>
        </h1>
      </motion.div>
    </div>
  );
}
