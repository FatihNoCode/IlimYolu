import { X } from 'lucide-react';
import type { Language } from '../App';

type TourRole = 'parent' | 'teacher' | 'admin';

// Persist per-role so switching roles (e.g. a superadmin who is also a parent
// elsewhere) each get their own first-run tour.
//
// The `v2` marker resets the "seen" flag for everyone: when the tour content
// changes we bump this version so previously-dismissed users see the new tour
// once more. Older keys (`ilimyolu_tour_seen_<role>`) are simply ignored.
const storageKey = (role: TourRole) => `ilimyolu_tour_seen_v2_${role}`;

export function hasSeenTour(role: string): boolean {
  if (role !== 'parent' && role !== 'teacher' && role !== 'admin') return true;
  try {
    return localStorage.getItem(storageKey(role)) === '1';
  } catch {
    return true;
  }
}

function ArcadeEmbed() {
  return (
    <div style={{ position: 'relative', paddingBottom: 'calc(48.056300268096514% + 41px)', height: '0', width: '100%' }}>
      <iframe
        src="https://demo.arcade.software/I3zeSks1Mu3MA1dayz60?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true"
        title="Een kind inschrijven voor lessen"
        frameBorder="0"
        loading="lazy"
        allowFullScreen
        allow="clipboard-write"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', colorScheme: 'light' }}
      />
    </div>
  );
}

interface ProductTourProps {
  role: TourRole;
  language: Language;
  onClose: () => void;
}

export default function ProductTour({ role, language, onClose }: ProductTourProps) {
  const finish = () => {
    try {
      localStorage.setItem(storageKey(role), '1');
    } catch {
      // ignore storage failures — worst case the tour shows again
    }
    onClose();
  };

  const t = {
    title: language === 'tr' ? 'Hoş geldiniz 👋' : 'Welkom 👋',
    subtitle: language === 'tr'
      ? 'Bir çocuğu derslere nasıl kaydedeceğinizi gösteren kısa bir tur.'
      : 'Een korte rondleiding: hoe u een kind inschrijft voor lessen.',
    close: language === 'tr' ? 'Kapat' : 'Sluiten',
    start: language === 'tr' ? 'Başla 🎉' : 'Aan de slag 🎉',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-6 pt-6 pb-6 text-white relative">
          <button
            onClick={finish}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label={t.close}
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-bold leading-tight">{t.title}</h3>
          <p className="text-sm text-white/80 mt-1">{t.subtitle}</p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <ArcadeEmbed />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={finish}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
          >
            {t.start}
          </button>
        </div>
      </div>
    </div>
  );
}
