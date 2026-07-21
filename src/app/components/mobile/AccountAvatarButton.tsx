import { useApp } from '../../App';

interface AccountAvatarButtonProps {
  onOpen: () => void;
  active?: boolean;
}

// The account entry point in the app layout. It used to be a tab-bar slot,
// which put it in competition with the destinations people actually navigate
// between; every phone app of this shape instead parks the account behind an
// avatar in the top-right corner, so that's where it lives now.
export default function AccountAvatarButton({ onOpen, active = false }: AccountAvatarButtonProps) {
  const { user, language } = useApp();

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
      aria-label={language === 'tr' ? 'Hesap' : 'Account'}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition active:scale-95 ${
        active
          ? 'bg-emerald-700 text-white ring-2 ring-emerald-200'
          : 'bg-emerald-600 text-white'
      }`}
    >
      {initials}
    </button>
  );
}
