import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ClientLogos() {
  return (
    <div className="w-full relative bg-blue-50/50 dark:bg-slate-900/50 py-12 border-y border-blue-100 dark:border-slate-800 overflow-hidden">
      {/* Subtle grid background similar to image */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #80b3ff 1px, transparent 1px), linear-gradient(to bottom, #80b3ff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        <div className="bg-white dark:bg-slate-800 py-3 px-8 rounded-sm shadow-sm inline-block mb-10 border border-gray-100 dark:border-slate-700">
          <p className="text-gray-700 dark:text-gray-200 text-sm font-medium tracking-wide">
            Teams growing with LeadForGrow
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-8 md:space-x-16">
          <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex items-center space-x-12 md:space-x-24">
            <img 
              src="/scaledesk_technology_logo.jpg" 
              alt="ScaleDesk" 
              className="h-10 md:h-12 object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300" 
            />
            <img 
              src="/homie4u.png" 
              alt="Homie4U" 
              className="h-10 md:h-12 object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300" 
            />
          </div>
          
          <button className="w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 flex items-center justify-center shadow-sm border border-gray-100 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
