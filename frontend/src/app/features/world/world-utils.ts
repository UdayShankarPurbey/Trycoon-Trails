import { Terrain, Territory } from '../../core/types';

export type WorldFilter = 'all' | 'mine' | 'owned' | 'unowned';

export const WORLD_SIZE = 50;
export const WORLD_TOTAL = WORLD_SIZE * WORLD_SIZE;
export const WORLD_PAGE_SIZE = 500;

export interface TerrainStyle {
  label: string;
  base: string;
  hover: string;
  text: string;
}

export const TERRAIN_STYLES: Record<Terrain, TerrainStyle> = {
  plains:   { label: 'Plains',   base: 'bg-emerald-700',   hover: 'hover:bg-emerald-600',   text: 'text-emerald-200' },
  forest:   { label: 'Forest',   base: 'bg-green-900',     hover: 'hover:bg-green-800',     text: 'text-green-200' },
  mountain: { label: 'Mountain', base: 'bg-stone-600',     hover: 'hover:bg-stone-500',     text: 'text-stone-200' },
  coast:    { label: 'Coast',    base: 'bg-sky-700',       hover: 'hover:bg-sky-600',       text: 'text-sky-200' },
  desert:   { label: 'Desert',   base: 'bg-amber-700',     hover: 'hover:bg-amber-600',     text: 'text-amber-200' },
};

export type OwnershipStatus = 'mine' | 'other' | 'unowned';

export const ownershipOf = (tile: Territory, currentUserId: string | null): OwnershipStatus => {
  if (!tile.owner_id) return 'unowned';
  if (currentUserId && tile.owner_id === currentUserId) return 'mine';
  return 'other';
};

export const matchesFilter = (
  tile: Territory,
  filter: WorldFilter,
  currentUserId: string | null,
  terrain?: Terrain | null,
): boolean => {
  if (terrain && tile.terrain !== terrain) return false;
  const own = ownershipOf(tile, currentUserId);
  switch (filter) {
    case 'mine':
      return own === 'mine';
    case 'owned':
      return own === 'mine' || own === 'other';
    case 'unowned':
      return own === 'unowned';
    default:
      return true;
  }
};

export const ownershipBorder = (status: OwnershipStatus): string => {
  if (status === 'mine') return 'ring-1 ring-amber-400';
  if (status === 'other') return 'ring-1 ring-red-500';
  return '';
};
