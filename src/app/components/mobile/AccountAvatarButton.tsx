import { useApp } from '../../App';
import { useUnreadCount } from './unreadStore';

interface AccountAvatarButtonProps {
  onOpen: () => void;
  active?: boolean;
}

// The account entry point in the app layout. It used to be a tab-bar slot,
// which put it in competition with the destinations people actually navigate
// between; every phone app of this shape instead parks the account behind an
// avatar in the top-right corner, so that's where it lives now.
export default function AccountAvatarButton({ onOpen, active = false }: AccountAvatarButtonProps) {
  const { user, language, apiRequest } = useApp();
  // The avatar is the app's only permanent piece of chrome, so it's the only
  // place an unread count can live where it will be seen from every tab.
  const unread = useUnreadCount(apiRequest);

  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={
        unread > 0
          ? `${language === 'tr' ? 'Hesap' : 'Account'} — ${unread} ${
              language === 'tr' ? 'okunmamış bildirim' : 'ongelezen meldingen'
            }`
          : language === 'tr' ? 'Hesap' : 'Account'
      }
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition active:scale-95 ${
        active
          ? 'bg-emerald-700 text-white ring-2 ring-emerald-200'
          : 'bg-emerald-600 text-white'
      }`}
    >
      {initials}
      {unread > 0 && (
        // Ringed in the page background so the badge stays legible where it
        // overlaps the avatar's own green.
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-gray-50">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
