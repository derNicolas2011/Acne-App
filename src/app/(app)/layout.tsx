import Link from 'next/link';
import { CalendarDays, LogOut } from 'lucide-react';
import { BottomNav, SideNav } from '@/components/shared/app-nav';
import { requireUser } from '@/lib/session';
import { logout } from '@/app/login/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth-Gate für alle Seiten dieser Gruppe. Der Proxy prüft nur, ob
  // überhaupt ein Cookie da ist — hier wird die Session validiert.
  const user = await requireUser();

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Desktop-Seitenleiste */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-sidebar md:flex">
        <div className="px-6 py-6">
          <p className="text-sm font-semibold tracking-tight">Skin Tracker</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{user.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <SideNav />
        </div>

        <div className="border-t border-border px-3 py-3">
          <Link
            href="/timeline"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <CalendarDays className="size-[1.15rem]" strokeWidth={1.8} aria-hidden />
            Tagesverlauf
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-[1.15rem] rotate-180" strokeWidth={1.8} aria-hidden />
            Daten & Konto
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-[1.15rem]" strokeWidth={1.8} aria-hidden />
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      <main className="md:pl-60">
        {/* Platz für die Bottom-Nav, damit nichts verdeckt wird. */}
        <div className="pb-nav md:pb-10">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}
