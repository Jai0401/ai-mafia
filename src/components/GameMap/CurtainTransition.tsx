// src/components/GameMap/CurtainTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  roomName: string;
  roomIcon: string;
  roomDescription: string;
  roomColor: string;
}

export default function CurtainTransition({ isOpen, roomName, roomIcon, roomDescription, roomColor }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Top curtain panel */}
          <motion.div
            className="absolute top-0 left-0 right-0 bg-bg-deep"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
            initial={{ height: '0%' }}
            animate={{ height: '50%' }}
            exit={{ height: '0%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Bottom curtain panel */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 bg-bg-deep"
            style={{ boxShadow: '0 -20px 60px rgba(0,0,0,0.8)' }}
            initial={{ height: '0%' }}
            animate={{ height: '50%' }}
            exit={{ height: '0%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Room title card — appears in the gap while curtains are closed */}
          <motion.div
            className="z-10 text-center px-8"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{
                backgroundColor: roomColor + '20',
                border: `2px solid ${roomColor}40`,
                boxShadow: `0 0 40px ${roomColor}30`,
              }}
            >
              {roomIcon}
            </div>
            <h2
              className="font-display text-4xl font-bold tracking-wider mb-2"
              style={{
                color: roomColor,
                textShadow: `0 0 30px ${roomColor}60`,
              }}
            >
              {roomName}
            </h2>
            <p className="text-text-muted text-sm font-body tracking-wide">
              {roomDescription}
            </p>
            {/* Decorative line */}
            <div
              className="w-24 h-0.5 mx-auto mt-4 rounded-full"
              style={{ backgroundColor: roomColor + '60' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
