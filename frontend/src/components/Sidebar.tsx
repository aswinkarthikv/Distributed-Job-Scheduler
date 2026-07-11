import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Network,
  Activity,
  Cpu,
  AlertTriangle,
  Inbox,
  LineChart,
  Settings,
  Terminal
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const menuItems = [
    { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Projects', to: '/projects', icon: <FolderKanban className="w-5 h-5" /> },
    { label: 'Queues', to: '/queues', icon: <Network className="w-5 h-5" /> },
    { label: 'Jobs', to: '/jobs', icon: <Activity className="w-5 h-5" /> },
    { label: 'Workers', to: '/workers', icon: <Cpu className="w-5 h-5" /> },
    { label: 'Failed Jobs', to: '/failed-jobs', icon: <AlertTriangle className="w-5 h-5" /> },
    { label: 'Dead Letter Queue', to: '/dlq', icon: <Inbox className="w-5 h-5" /> },
    { label: 'Metrics', to: '/analytics', icon: <LineChart className="w-5 h-5" /> },
    { label: 'Settings', to: '/settings', icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-border select-none">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Terminal className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground">Control Plane</h1>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">DJS Platform</span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border select-none bg-muted/10 text-center">
        <span className="text-[10px] font-medium text-muted-foreground">Control Plane v1.0.0</span>
      </div>
    </aside>
  );
};
export default Sidebar;
