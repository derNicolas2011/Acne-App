'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Camera, House, Pill, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { name: 'Home', href: '/', icon: House },
  { name: 'Haut', href: '/skin', icon: Camera },
  { name: 'Ernährung', href: '/nutrition', icon: UtensilsCrossed },
  { name: 'Routine', href: '/treatment', icon: Pill },
  { name: 'Analyse', href: '/analysis', icon: BarChart3 },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

/** Feste Bottom-Navigation für Mobile — Daumenzone, grosse Touch-Ziele. */
export function BottomNav() {
  const isActive = useIsActive();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/85 backdrop-blur-xl pb-safe md:hidden"
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[3.25rem] flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5 press',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon
                  className="size-[1.35rem]"
                  strokeWidth={active ? 2.3 : 1.8}
                  aria-hidden
                />
                <span className={cn('text-[0.625rem] leading-none', active && 'font-semibold')}>
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Seitenleiste ab md — gleiche Informationsarchitektur, ruhiger gesetzt. */
export function SideNav() {
  const isActive = useIsActive();

  return (
    <nav aria-label="Hauptnavigation" className="flex flex-col gap-0.5 px-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              active
                ? 'bg-accent font-semibold text-accent-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="size-[1.15rem]" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
