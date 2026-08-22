import { MapPin } from 'lucide-react';
import type { Station } from '../types/bus';

interface Props {
  origins: Station[];
  selectedId: string;
  onSelect: (stationId: string) => void;
}

export default function OriginTabs({ origins, selectedId, onSelect }: Props) {
  return (
    <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5">
      {origins.map((origin, i) => {
        const active = origin.stationId === selectedId;
        return (
          <button
            key={origin.stationId}
            onClick={() => onSelect(origin.stationId)}
            className={`flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-3 text-base font-bold transition-colors ${
              active
                ? 'bg-white text-blue-600 shadow'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapPin size={18} className={active ? 'text-blue-600' : 'text-slate-400'} />
            {origin.name === '...' ? (
              <span className="inline-block h-4 w-20 animate-pulse rounded bg-slate-200" />
            ) : (
              <span className="truncate">{origin.name}</span>
            )}
            <span className="text-xs font-normal opacity-60">({i + 1})</span>
          </button>
        );
      })}
    </div>
  );
}