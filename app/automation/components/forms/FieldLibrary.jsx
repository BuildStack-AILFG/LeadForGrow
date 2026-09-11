'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FIELD_CATEGORIES } from './constants';

export default function FieldLibrary({ onAddField }) {
  const [openCategory, setOpenCategory] = useState('basic');

  return (
    <div className="h-full flex flex-col">
      <div className="px-1 pb-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Fields</h3>
        <p className="text-xs text-slate-500 mt-0.5">Click to add to your form</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 -mr-1">
        {FIELD_CATEGORIES.map((cat) => {
          const isOpen = openCategory === cat.id;
          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors"
              >
                {cat.label}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-1 pb-2"
                  >
                    {cat.fields.map((field) => {
                      const Icon = field.icon;
                      return (
                        <button
                          key={field.type + field.label}
                          type="button"
                          onClick={() => onAddField(field)}
                          className="w-full group flex items-start gap-3 p-2.5 rounded-xl text-left bg-white/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Icon className="w-4 h-4 text-teal-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{field.label}</p>
                            <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{field.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
