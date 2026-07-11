import React from 'react';
import { Filter } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterPanelProps {
  label: string;
  options: FilterOption[];
  selectedValue: string;
  onSelect: (val: string) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  label,
  options,
  selectedValue,
  onSelect
}) => {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs font-medium text-muted-foreground mr-1">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-secondary border-border text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default FilterPanel;
