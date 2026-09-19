import React, { useMemo, useState } from 'react';
import { User, Search } from 'lucide-react';
import { DirectoryPerson } from '../types';
import { DIRECTORY_PEOPLE } from '../data/people';

interface PersonTypeaheadProps {
  value: string;
  onSelect: (person: DirectoryPerson) => void;
  placeholder?: string;
  invalid?: boolean;
}

export const PersonTypeahead: React.FC<PersonTypeaheadProps> = ({
  value,
  onSelect,
  placeholder = 'Search people by name...',
  invalid = false,
}) => {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return DIRECTORY_PEOPLE.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [query]);

  const hasQuery = query.trim().length > 0;

  const handleSelect = (person: DirectoryPerson) => {
    setQuery(person.name);
    setIsOpen(false);
    onSelect(person);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          className={`w-full pl-8 pr-3.5 py-2 rounded-lg border text-xs font-semibold focus:outline-hidden focus:ring-2 ${
            invalid ? 'border-red-400 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'
          }`}
          placeholder={placeholder}
        />
      </div>

      {isOpen && hasQuery && matches.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {matches.map((person) => (
            <button
              type="button"
              key={person.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(person)}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-50 text-left transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{person.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{person.email} · {person.title}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && hasQuery && matches.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-[11px] text-slate-500">
          No matching person found.
        </div>
      )}
    </div>
  );
};
