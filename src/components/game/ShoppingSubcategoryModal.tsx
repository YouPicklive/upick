import { X } from 'lucide-react';

export type ShoppingSubcategory = 'random' | 'decor' | 'clothes' | 'games' | 'books' | 'gifts' | 'vintage' | 'artisan';

const SUBCATEGORIES: { id: ShoppingSubcategory; emoji: string; label: string }[] = [
  { id: 'random', emoji: '🎲', label: 'Random' },
  { id: 'decor', emoji: '🏡', label: 'Decor' },
  { id: 'clothes', emoji: '👗', label: 'Clothes' },
  { id: 'games', emoji: '🎮', label: 'Games' },
  { id: 'books', emoji: '📚', label: 'Books' },
  { id: 'gifts', emoji: '🎁', label: 'Gifts' },
  { id: 'vintage', emoji: '🕰️', label: 'Vintage' },
  { id: 'artisan', emoji: '🎨', label: 'Local Artisan' },
];

interface ShoppingSubcategoryModalProps {
  onSelect: (subcategory: ShoppingSubcategory) => void;
  onClose: () => void;
}

export function ShoppingSubcategoryModal({ onSelect, onClose }: ShoppingSubcategoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-card rounded-2xl shadow-card border border-border/30 p-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <span className="text-3xl mb-2 block">🛍️</span>
          <h2 className="font-display text-xl font-bold">What are you looking for?</h2>
          <p className="text-muted-foreground text-sm mt-1">Pick a shopping vibe</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {SUBCATEGORIES.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 bg-secondary hover:bg-secondary/80 hover:shadow-md active:scale-95"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
