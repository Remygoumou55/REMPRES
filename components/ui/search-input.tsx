"use client";

import { useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionSelect?: (value: string) => void;
  className?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher...",
  suggestions = [],
  onSuggestionSelect,
  className,
}: SearchInputProps) {
  const showSuggestions = suggestions.length > 0 && value.trim().length > 0;
  const completionSuffix = useMemo(() => {
    const q = value.trim();
    if (!q) return "";
    const qLower = q.toLowerCase();
    const first = suggestions.find((s) => s.toLowerCase().startsWith(qLower));
    if (!first) return "";
    return first.slice(q.length);
  }, [suggestions, value]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.key === "Tab" || e.key === "ArrowRight") && completionSuffix) {
            e.preventDefault();
            onChange(`${value}${completionSuffix}`);
          }
        }}
        placeholder={placeholder}
        className="bg-white py-2 pl-9 pr-9"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Effacer la recherche"
        >
          <X size={14} />
        </button>
      ) : null}

      {completionSuffix ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 pl-9 pr-9 text-sm">
          <span className="invisible">{value}</span>
          <span className="text-gray-300">{completionSuffix}</span>
        </div>
      ) : null}

      {showSuggestions ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => (onSuggestionSelect ? onSuggestionSelect(s) : onChange(s))}
              className="block w-full truncate px-3 py-2 text-left text-xs text-gray-600 hover:bg-gray-50"
            >
              {value.trim() && s.toLowerCase().startsWith(value.trim().toLowerCase()) ? (
                <>
                  <span className="font-semibold text-gray-700">{s.slice(0, value.trim().length)}</span>
                  <span>{s.slice(value.trim().length)}</span>
                </>
              ) : (
                s
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
