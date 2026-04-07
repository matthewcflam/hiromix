"use client";

import { motion } from "framer-motion";

interface NotePaletteProps {
  onColorSelect: (color: string) => void;
  activeColor: string | null;
  isDeleteMode: boolean;
  onToggleDeleteMode: () => void;
}

export default function NotePalette({ 
  onColorSelect, 
  activeColor, 
  isDeleteMode,
  onToggleDeleteMode 
}: NotePaletteProps) {
  const notes = [
    {
      id: 'yellow',
      label: '',
      gradient: 'linear-gradient(135deg, #fff5cc 0%, #ffecb3 50%, #ffe299 100%)',
      rotation: 12,
      zIndex: 30,
      offset: { x: 0, y: 0 },
    },
    {
      id: 'green',
      label: '',
      gradient: 'linear-gradient(135deg, #d5f4d5 0%, #c1ecc1 50%, #ade4ad 100%)',
      rotation: -6,
      zIndex: 20,
      offset: { x: 85, y: 10 },
    },
    {
      id: 'pink',
      label: 'Delete',
      gradient: 'linear-gradient(135deg, #fef5f7 0%, #fde8ed 50%, #fbd9e3 100%)',
      rotation: 8,
      zIndex: 10,
      offset: { x: 195, y: 1 },
      isDelete: true,
    },
  ];

  const handleNoteClick = (noteId: string, isDelete?: boolean) => {
    if (isDelete) {
      onToggleDeleteMode();
    } else {
      if (activeColor === noteId) {
        onColorSelect('');
      } else {
        onColorSelect(noteId);
      }
    }
  };

  return (
    <div 
      className="fixed left-8 -top-16 z-[100]"
    >
      <div className="relative" style={{ width: '350px', height: '250px' }}>
        {notes.map((note) => {
          const isActive = note.isDelete ? isDeleteMode : activeColor === note.id;
          
          return (
            <motion.button
              key={note.id}
              onClick={() => handleNoteClick(note.id, note.isDelete)}
              className="absolute group cursor-pointer"
              style={{
                width: '140px',
                height: '140px',
                left: `${note.offset.x}px`,
                top: `${note.offset.y}px`,
                zIndex: note.zIndex,
                transformOrigin: 'center center',
              }}
              initial={{ rotate: note.rotation }}
              whileHover={{ 
                rotate: note.rotation + (Math.random() * 4 - 2),
                y: -4,
                transition: { duration: 0.2, ease: "easeOut" }
              }}
              whileTap={{ 
                scale: 0.95,
                y: isActive ? 0 : 2,
                transition: { duration: 0.1 }
              }}
              animate={{
                rotate: note.rotation,
                y: isActive ? -3 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
            >
              {/* Thick paper stack edge (side profile) */}
              <div
                className="absolute rounded-sm"
                style={{
                  top: '4px',
                  left: note.id === 'yellow' ? '4px' : '3px',
                  width: '100%',
                  height: '100%',
                  background: note.id === 'yellow' 
                    ? 'linear-gradient(135deg, #e6d89f 0%, #d4c48a 50%, #c2b076 100%)'
                    : note.id === 'green'
                    ? 'linear-gradient(135deg, #a8d4a8 0%, #8fbc8f 50%, #76a476 100%)'
                    : 'linear-gradient(135deg, #e6c4ce 0%, #d4aab4 50%, #c2909a 100%)',
                  boxShadow: `
                    0 4px 8px rgba(0, 0, 0, 0.15),
                    0 2px 4px rgba(0, 0, 0, 0.1)
                  `,
                  zIndex: -1,
                }}
              />

              {/* Main sticky note with realistic depth */}
              <div
                className="relative w-full h-full rounded-sm overflow-hidden"
                style={{
                  background: note.gradient,
                  boxShadow: isActive
                    ? `
                      0 3px 8px rgba(0, 0, 0, 0.15),
                      0 1px 4px rgba(0, 0, 0, 0.1),
                      inset 0 -3px 6px rgba(0, 0, 0, 0.12),
                      inset 0 2px 2px rgba(255, 255, 255, 0.6),
                      inset -2px 0 4px rgba(0, 0, 0, 0.08),
                      inset 2px 0 4px rgba(0, 0, 0, 0.08)
                    `
                    : note.id === 'yellow'
                    ? `
                      0 6px 12px rgba(0, 0, 0, 0.18),
                      0 3px 6px rgba(0, 0, 0, 0.12),
                      0 2px 3px rgba(0, 0, 0, 0.1),
                      inset 0 -3px 6px rgba(0, 0, 0, 0.12),
                      inset 0 2px 2px rgba(255, 255, 255, 0.6),
                      inset -2px 0 4px rgba(0, 0, 0, 0.08),
                      inset 2px 0 4px rgba(0, 0, 0, 0.08)
                    `
                    : `
                      0 4px 8px rgba(0, 0, 0, 0.15),
                      0 2px 4px rgba(0, 0, 0, 0.1),
                      inset 0 -3px 6px rgba(0, 0, 0, 0.12),
                      inset 0 2px 2px rgba(255, 255, 255, 0.6),
                      inset -2px 0 4px rgba(0, 0, 0, 0.08),
                      inset 2px 0 4px rgba(0, 0, 0, 0.08)
                    `,
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                {/* Paper texture overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `
                      url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")
                    `,
                    mixBlendMode: 'multiply',
                    opacity: 0.4,
                  }}
                />

                {/* Paper texture overlay for all notes */}
                {note.id === 'yellow' && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'url("/assets/yellownote.jpg")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      mixBlendMode: 'multiply',
                      opacity: 0.3,
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  />
                )}
                {note.id === 'green' && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'url("/assets/greennote.jpg")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      mixBlendMode: 'multiply',
                      opacity: 0.3,
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  />
                )}
                {note.isDelete && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'url("/assets/crumbledpaper.jpg")',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      mixBlendMode: 'multiply',
                      opacity: 0.3,
                      pointerEvents: 'none',
                      zIndex: 2,
                    }}
                  />
                )}

                {/* Subtle lined paper effect */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(180deg, transparent, transparent 21px, rgba(0, 0, 0, 0.03) 21px, rgba(0, 0, 0, 0.03) 22px)',
                    opacity: 0.3,
                  }}
                />

                {/* Top sticky strip (darker adhesive area) */}
                <div
                  className="absolute top-0 left-0 right-0 h-4"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, transparent 100%)',
                  }}
                />

                {/* Content area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {!note.isDelete && note.label && (
                    <div
                      className="text-center"
                      style={{
                        fontFamily: '"Reenie Beanie", cursive',
                        fontSize: '26px',
                        fontWeight: 400,
                        color: 'rgba(0, 0, 0, 0.35)',
                        transform: `rotate(${Math.random() * 6 - 3}deg)`,
                        textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {note.label}
                    </div>
                  )}
                </div>

                {/* Edge curl effect (bottom right corner) */}
                <div
                  className="absolute bottom-0 right-0"
                  style={{
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.08) 100%)',
                    borderRadius: '0 0 2px 0',
                    clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
                  }}
                />

                {/* Active state indicator - subtle glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-sm pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      boxShadow: 'inset 0 0 0 2px rgba(0, 0, 0, 0.2)',
                    }}
                  />
                )}
              </div>

              {/* Enhanced tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[110]">
                <div 
                  className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap"
                  style={{
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  {note.isDelete ? 'Toggle Delete' : (note.id === 'yellow' ? 'Yellow Note' : 'Green Note')}
                  <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0"
                    style={{
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: '4px solid black',
                    }}
                  />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
