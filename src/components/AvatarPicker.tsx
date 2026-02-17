import coolCat from '@/assets/avatars/cool-cat.png';
import happyGhost from '@/assets/avatars/happy-ghost.png';
import friendlyMushroom from '@/assets/avatars/friendly-mushroom.png';
import smilingStar from '@/assets/avatars/smiling-star.png';

export interface AvatarOption {
  id: string;
  label: string;
  localSrc: string;
  storagePath: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'cool-cat',
    label: 'Cool Cat',
    localSrc: coolCat,
    storagePath: `${SUPABASE_URL}/storage/v1/object/public/avatars/presets/cool-cat.png`,
  },
  {
    id: 'happy-ghost',
    label: 'Happy Ghost',
    localSrc: happyGhost,
    storagePath: `${SUPABASE_URL}/storage/v1/object/public/avatars/presets/happy-ghost.png`,
  },
  {
    id: 'friendly-mushroom',
    label: 'Friendly Mushroom',
    localSrc: friendlyMushroom,
    storagePath: `${SUPABASE_URL}/storage/v1/object/public/avatars/presets/friendly-mushroom.png`,
  },
  {
    id: 'smiling-star',
    label: 'Smiling Star',
    localSrc: smilingStar,
    storagePath: `${SUPABASE_URL}/storage/v1/object/public/avatars/presets/smiling-star.png`,
  },
];

interface AvatarPickerProps {
  selected: string;
  onSelect: (url: string) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-3">Pick your avatar</p>
      <div className="grid grid-cols-4 gap-3">
        {AVATAR_OPTIONS.map((avatar) => {
          const isSelected = selected === avatar.storagePath;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelect(avatar.storagePath)}
              className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-primary shadow-md scale-105'
                  : 'border-border/50 hover:border-border hover:shadow-sm'
              }`}
            >
              <img
                src={avatar.localSrc}
                alt={avatar.label}
                className="w-full h-full object-cover"
              />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/10 flex items-end justify-center pb-1">
                  <span className="text-[9px] font-bold text-primary bg-background/80 px-1.5 py-0.5 rounded-full">
                    ✓
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
