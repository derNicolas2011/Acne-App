import { Download, LogOut, Shield } from 'lucide-react';
import { PageBody, PageHeader, SectionHeading } from '@/components/shared/page-header';
import { Surface } from '@/components/shared/surface';
import { DeleteAllData } from '@/components/settings/delete-all-data';
import { MealPresets } from '@/components/settings/meal-presets';
import { getSettings } from '@/lib/settings';
import { requireUser } from '@/lib/session';
import { logout } from '@/app/login/actions';

export const metadata = { title: 'Daten & Konto' };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return (
    <>
      <PageHeader title="Daten & Konto" size="large" />

      <PageBody>
        <section className="space-y-3">
          <SectionHeading title="Mahlzeiten-Vorlagen" />
          <MealPresets presets={settings.mealPresets} />
        </section>

        <section className="space-y-3">
          <SectionHeading title="Deine Daten" />

          <Surface className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Shield className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={1.9} aria-hidden />
              <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                Fotos liegen in privatem Speicher und sind nur über kurzlebige,
                signierte Links erreichbar. Es gibt keine öffentlichen Bild-URLs.
              </p>
            </div>
          </Surface>

          <Surface className="space-y-3">
            <div>
              <h3 className="text-[0.9375rem] font-medium">Daten exportieren</h3>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
                Alle Analysen, Mahlzeiten, Routine-Einträge und Zusammenfassungen
                als JSON-Datei. Bilddateien sind nicht enthalten.
              </p>
            </div>
            <a
              href="/api/export"
              download
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-[0.875rem] font-semibold press"
            >
              <Download className="size-4" strokeWidth={1.9} aria-hidden />
              Export herunterladen
            </a>
          </Surface>

          <DeleteAllData />
        </section>

        <section className="space-y-3">
          <SectionHeading title="Konto" />
          <Surface className="space-y-3">
            <p className="text-[0.8125rem] text-muted-foreground">
              Angemeldet als <span className="font-medium text-foreground">{user.name}</span>
            </p>
            <form action={logout}>
              <button
                type="submit"
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-[0.875rem] font-semibold press"
              >
                <LogOut className="size-4" strokeWidth={1.9} aria-hidden />
                Abmelden
              </button>
            </form>
          </Surface>
        </section>
      </PageBody>
    </>
  );
}
