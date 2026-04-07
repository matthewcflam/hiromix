"use client";

import { motion } from "framer-motion";

export default function Navigation() {
  return (
    <nav className="fixed left-5 top-6 z-50">
      <motion.a
        href="#timeline"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-base font-semibold text-black tracking-tight hover:opacity-60 transition-opacity"
        style={{ fontFamily: 'Helvetica Neue, Inter, sans-serif' }}
      >
        Timeline
      </motion.a>
    </nav>
  );
}
