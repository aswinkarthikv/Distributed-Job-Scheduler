import React, { useState } from 'react';
import { useProjectStore } from '../store/ProjectStore';
import { useAuthStore } from '../store/AuthStore';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Search, LogOut, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { projects, activeProject, setActiveProject } = useProjectStore();
  const { user, logout } = useAuthStore();
  const [showProjMenu, setShowProjMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 z-10 shrink-0">
      {/* Project Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowProjMenu(!showProjMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm font-semibold hover:bg-muted/40 transition-colors"
        >
          <span className="text-muted-foreground font-medium">Project:</span>
          <span>{activeProject?.name || 'Default Space'}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {showProjMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowProjMenu(false)} />
            <div className="absolute left-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-20 overflow-hidden divide-y divide-border animate-in fade-in slide-in-from-top-1">
              <div className="py-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      setShowProjMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-muted/50 transition-colors ${
                      activeProject?.id === p.id ? 'text-primary font-semibold' : ''
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-4">
        {/* Search placeholder */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search control plane..."
            className="h-10 w-60 rounded-lg border border-input pl-9 pr-4 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-xs border border-primary/20"
          >
            {user?.name?.charAt(0) || 'S'}
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg z-20 overflow-hidden py-1 divide-y divide-border">
                <div className="px-4 py-2">
                  <p className="text-xs text-muted-foreground font-medium">Signed in as</p>
                  <p className="text-sm font-semibold truncate">{user?.email || 'staff@enterprise.io'}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-muted/50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
