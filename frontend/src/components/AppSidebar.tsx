import React from 'react';
import { Camera, Settings } from 'lucide-react';
import type { AppTab } from '../config/navConfig';
import { sidebarNavItems } from '../config/navConfig';
import type { UserMode } from '../types/practice';

interface Props {
  activeTab: AppTab;
  mode: UserMode;
  onNavigate: (tab: AppTab) => void;
}

export const AppSidebar: React.FC<Props> = ({ activeTab, mode, onNavigate }) => {
  const items = sidebarNavItems(mode);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-56 shrink-0 border-r border-slate-800 bg-slate-900/80 min-h-screen sticky top-0">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="flex items-center gap-3 p-5 text-left hover:bg-slate-800/50 transition-colors"
      >
        <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-2 rounded-xl">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <span className="font-extrabold text-white text-sm leading-tight">Practice Companion</span>
      </button>

      <nav className="flex-1 px-3 space-y-1" aria-label="Main navigation">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                selected
                  ? 'bg-brand-500 text-slate-900'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="w-5 h-5" aria-hidden />
          Settings
        </button>
      </div>
    </aside>
  );
};
