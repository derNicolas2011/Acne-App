import { Surface } from '@/components/shared/surface';
import { MIN_GROUP_DAYS, type Observation } from '@/lib/insights';
import { cn } from '@/lib/utils';

const STRENGTH_LABEL = {
  insufficient: 'Datenbasis zu klein',
  weak: 'schwaches Signal',
  moderate: 'wiederkehrendes Muster',
} as const;

/**
 * Eine Beobachtung aus den eigenen Daten.
 *
 * Formuliert bewusst als Vergleich zweier Tagesgruppen, nie als Ursache.
 * Die Stichprobengrösse steht immer dabei, damit sichtbar bleibt,
 * worauf die Aussage beruht.
 */
export function ObservationCard({ observation }: { observation: Observation }) {
  const { delta, withDays, withoutDays, strength } = observation;
  const insufficient = strength === 'insufficient';

  return (
    <Surface className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.9375rem] font-medium">{observation.label}</p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium',
            insufficient ? 'bg-muted text-muted-foreground' : 'bg-accent text-accent-foreground'
          )}
        >
          {STRENGTH_LABEL[strength]}
        </span>
      </div>

      {insufficient ? (
        <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
          Für einen Vergleich braucht es mindestens {MIN_GROUP_DAYS} Tage je Gruppe.
          Bisher: {withDays} Tage mit, {withoutDays} Tage ohne.
        </p>
      ) : (
        <>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-[0.75rem] text-muted-foreground">Ø Score an diesen Tagen</p>
              <p className="tabular mt-0.5 text-[1.375rem] font-semibold">
                {observation.withAverage}
              </p>
            </div>
            <div>
              <p className="text-[0.75rem] text-muted-foreground">Ø an übrigen Tagen</p>
              <p className="tabular mt-0.5 text-[1.375rem] font-semibold text-muted-foreground">
                {observation.withoutAverage}
              </p>
            </div>
          </div>

          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {delta === 0 ? (
              <>In deinen bisherigen Daten zeigt sich hier kein Unterschied.</>
            ) : (
              <>
                In deinen bisherigen Daten lag dein Skin Score an diesen Tagen im Schnitt{' '}
                <span className="font-medium text-foreground">
                  {Math.abs(delta)} Punkte {delta > 0 ? 'höher' : 'niedriger'}
                </span>
                . Das ist ein beobachteter Zusammenhang, keine Ursache.
              </>
            )}{' '}
            <span className="tabular">
              ({withDays} vs. {withoutDays} Tage)
            </span>
          </p>
        </>
      )}
    </Surface>
  );
}
