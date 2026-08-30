'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ChevronDown, ImagePlus, Info, Loader2, RotateCcw } from 'lucide-react';
import { Surface } from '@/components/shared/surface';
import { ErrorState } from '@/components/shared/states';
import { ImageError, prepareImage } from '@/lib/image';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'preparing' | 'uploading' | 'analyzing' | 'error';

const PHASE_LABEL: Record<Exclude<Phase, 'idle' | 'error'>, string> = {
  preparing: 'Bild wird vorbereitet …',
  uploading: 'Foto wird hochgeladen …',
  analyzing: 'Hautbild wird analysiert …',
};

/** Fortschritt der drei Schritte — gibt der Wartezeit eine Struktur. */
const PHASE_PROGRESS: Record<Exclude<Phase, 'idle' | 'error'>, number> = {
  preparing: 20,
  uploading: 55,
  analyzing: 90,
};

/**
 * Foto aufnehmen → hochladen → analysieren, in einem Fluss.
 * Der Weg von "App offen" bis "Analyse läuft" ist bewusst zwei Taps lang.
 */
export function SkinCapture() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const busy = phase === 'preparing' || phase === 'uploading' || phase === 'analyzing';

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Zurücksetzen, damit dieselbe Datei erneut gewählt werden kann.
    event.target.value = '';
    if (!file) return;

    setErrorMessage(null);
    setPhase('preparing');

    try {
      const prepared = await prepareImage(file);
      setPreview(prepared.dataUrl);
      setPhase('idle');
    } catch (error) {
      setPhase('error');
      setErrorMessage(
        error instanceof ImageError
          ? error.message
          : 'Das Bild konnte nicht verarbeitet werden.'
      );
    }
  };

  const startAnalysis = async () => {
    if (!preview) return;
    setErrorMessage(null);

    try {
      setPhase('uploading');
      const uploadResponse = await fetch('/api/skin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: preview }),
      });
      if (!uploadResponse.ok) {
        const body = await uploadResponse.json().catch(() => null);
        throw new Error(body?.error ?? 'Das Foto konnte nicht gespeichert werden.');
      }
      const { photoId } = await uploadResponse.json();

      setPhase('analyzing');
      const analyzeResponse = await fetch('/api/skin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
      if (!analyzeResponse.ok) {
        const body = await analyzeResponse.json().catch(() => null);
        throw new Error(body?.error ?? 'Die Analyse konnte nicht durchgeführt werden.');
      }
      const { analysisId } = await analyzeResponse.json();

      router.replace(`/skin/${analysisId}`);
    } catch (error) {
      setPhase('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Die Analyse konnte nicht durchgeführt werden.'
      );
    }
  };

  return (
    <div className="space-y-5">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
      />

      {/* Vorschau */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vorschau des aufgenommenen Fotos" className="size-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-3 px-8 text-center text-muted-foreground press"
          >
            <Camera className="size-9" strokeWidth={1.5} aria-hidden />
            <span className="text-[0.875rem]">Tippen, um ein Foto aufzunehmen</span>
          </button>
        )}

        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm">
            <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
            <p className="text-[0.875rem] font-medium" role="status" aria-live="polite">
              {PHASE_LABEL[phase as keyof typeof PHASE_LABEL]}
            </p>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{
                  width: `${PHASE_PROGRESS[phase as keyof typeof PHASE_PROGRESS]}%`,
                  transitionTimingFunction: 'var(--ease-out-soft)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <ErrorState
          title="Das hat nicht geklappt"
          description={errorMessage}
          action={
            <button
              type="button"
              onClick={() => {
                setPhase('idle');
                setErrorMessage(null);
                if (preview) void startAnalysis();
              }}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[0.875rem] font-semibold text-background press"
            >
              <RotateCcw className="size-4" strokeWidth={2} aria-hidden />
              Erneut versuchen
            </button>
          }
        />
      )}

      {/* Aktionen */}
      <div className="mx-auto w-full max-w-sm space-y-3">
        {preview && (
          <button
            type="button"
            onClick={startAnalysis}
            disabled={busy}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-[0.9375rem] font-semibold text-primary-foreground shadow-raised press',
              busy && 'opacity-60'
            )}
          >
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
            {busy ? 'Bitte warten …' : 'Analyse starten'}
          </button>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[0.875rem] font-semibold press disabled:opacity-50"
          >
            <Camera className="size-[1.125rem]" strokeWidth={2} aria-hidden />
            {preview ? 'Neu aufnehmen' : 'Kamera'}
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={busy}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-[0.875rem] font-semibold press disabled:opacity-50"
          >
            <ImagePlus className="size-[1.125rem]" strokeWidth={2} aria-hidden />
            Galerie
          </button>
        </div>
      </div>

      {/* Aufnahmetipps */}
      <Surface padded={false} className="overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTips((v) => !v)}
          aria-expanded={showTips}
          className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left"
        >
          <Info className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} aria-hidden />
          <span className="flex-1 text-[0.875rem] font-medium">Tipps für vergleichbare Fotos</span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              showTips && 'rotate-180'
            )}
            aria-hidden
          />
        </button>

        {showTips && (
          <ul className="space-y-1.5 border-t border-border px-4 py-3.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            <li>Immer bei ähnlichem Licht — Tageslicht am Fenster funktioniert gut.</li>
            <li>Gleicher Abstand und gleicher Winkel zur Kamera.</li>
            <li>Keine Filter und keine Beauty-Modi.</li>
            <li>Am besten abends vor der Skincare-Routine.</li>
          </ul>
        )}
      </Surface>

      <p className="px-1 text-center text-[0.75rem] leading-relaxed text-muted-foreground">
        Fotos werden privat gespeichert und sind nur für dich abrufbar.
      </p>
    </div>
  );
}
