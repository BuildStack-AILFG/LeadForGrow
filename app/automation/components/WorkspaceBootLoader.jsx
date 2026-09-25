'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];

export default function WorkspaceBootLoader({ complete = false, onFinished }) {
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const delta = now - last;
      last = now;
      setProgress((p) => {
        const cap = complete ? 100 : 92;
        const speed = complete ? 0.35 : 0.04;
        return Math.min(cap, p + delta * speed * 0.08);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [complete]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setExiting(true);
    setTimeout(() => onFinished?.(), 400);
  }, [onFinished]);

  useEffect(() => {
    if (complete && progress >= 99) finish();
  }, [complete, progress, finish]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="boot-loader"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white dark:bg-slate-900"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease }}
        >
          <div className="flex flex-col items-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col items-center"
            >
              <img
                src="/image.png"
                alt="LeadForGrow"
                className="h-10 w-10 object-contain"
              />
              <p
                className="mt-4 text-[13px] font-semibold tracking-wide text-slate-900 dark:text-slate-50"
                style={{ fontFamily: 'var(--font-plus-jakarta)' }}
              >
                LeadForGrow
              </p>
            </motion.div>

            <motion.div
              className="mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4, ease }}
            >
              <motion.div
                className="h-full rounded-full bg-teal-600"
                style={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 80, damping: 24 }}
              />
            </motion.div>

            <motion.p
              className="mt-5 text-[13px] text-slate-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease }}
            >
              Loading workspace
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
