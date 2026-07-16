'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BarChart3,
  BriefcaseBusiness,
  ChevronRight,
  Compass,
  Droplets,
  LayoutDashboard,
  Menu,
  Mountain,
  X,
} from 'lucide-react';

const navigation = [
  { href: '/', label: 'Executive overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Trail Solutions', icon: BriefcaseBusiness },
  { href: '/forecast', label: 'Forecast & scenarios', icon: BarChart3 },
  { href: '/liquidity', label: 'Deployable cash', icon: Droplets },
  { href: '/leadership', label: 'CEO decision brief', icon: Compass },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-button"
        type="button"
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open ? <button className="nav-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}

      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Mountain size={25} strokeWidth={2.4} /></div>
          <div>
            <strong>IMBA</strong>
            <span>Finance command center</span>
          </div>
        </div>

        <div className="prototype-label">Working prototype</div>

        <nav aria-label="Primary navigation">
          {navigation.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                href={item.href}
                key={item.href}
                className={active ? 'nav-item nav-item-active' : 'nav-item'}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active ? <ChevronRight className="nav-chevron" size={15} /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <span className="signal-dot" />
          <div>
            <strong>Prototype data policy</strong>
            <p>Public facts and illustrative operating assumptions are labeled separately.</p>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
