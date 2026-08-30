import { PageBody, PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { PhotoCompare, type ComparePhoto } from '@/components/skin/photo-compare';
import { getRecentSkinEntries, withSignedUrls } from '@/lib/queries/skin';
import { requireUser } from '@/lib/session';
import { GitCompareArrows } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Vergleich' };

/** Wie viele Aufnahmen zur Auswahl stehen. */
const MAX_ENTRIES = 120;

export default async function ComparePage() {
  const user = await requireUser();

  const recent = await getRecentSkinEntries(user.id, MAX_ENTRIES);
  const withUrls = await withSignedUrls(recent.filter((e) => e.score != null));

  const entries: ComparePhoto[] = withUrls.map((entry) => ({
    analysisId: entry.analysisId,
    date: entry.date,
    score: entry.score,
    frontPhotoUrl: entry.frontPhotoUrl,
  }));

  return (
    <>
      <PageHeader title="Vorher / Nachher" backHref="/skin" />

      <PageBody>
        {entries.length < 2 ? (
          <EmptyState
            icon={<GitCompareArrows className="size-5" strokeWidth={1.8} />}
            title="Für einen Vergleich fehlt noch ein Foto"
            description="Sobald zwei analysierte Aufnahmen vorliegen, kannst du zwei Zeitpunkte gegenüberstellen."
            action={
              <Link
                href="/skin/upload"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-[0.875rem] font-semibold text-primary-foreground press"
              >
                Foto aufnehmen
              </Link>
            }
          />
        ) : (
          <PhotoCompare entries={entries} />
        )}
      </PageBody>
    </>
  );
}
