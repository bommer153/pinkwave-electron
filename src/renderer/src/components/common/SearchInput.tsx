import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange(value: string): void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-pw-text-2" />
      <input
        type="search"
        autoFocus
        aria-label="Search"
        value={value}
        maxLength={200}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onChange('')}
        className="h-12 w-full rounded-full border border-transparent bg-pw-elevated pr-11 pl-11 text-sm text-white placeholder:text-pw-muted outline-none transition focus:border-pw-pink/60 focus:shadow-[0_0_0_3px_rgb(255_79_163/0.15)] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute top-1/2 right-4 -translate-y-1/2 text-pw-text-2 hover:text-white"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}
