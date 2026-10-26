import type { ReactNode } from 'react'
import { cn, Label, Switch } from '@heroui/react'

export function SettingsRow({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <p className="font-semibold">{title}</p>
        {hint && <p className="text-sm text-pw-text-2">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

export function SettingsToggle({ label, isSelected, isDisabled, onChange }: { label: string; isSelected: boolean; isDisabled?: boolean; onChange(value: boolean): void }) {
  return (
    <Switch isSelected={isSelected} isDisabled={isDisabled} onChange={onChange}>
      {/* Content is the actual button; control and label must sit inside it. */}
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
        <Label className="sr-only">{label}</Label>
      </Switch.Content>
    </Switch>
  )
}

/** Pill-style single choice (radiogroup). */
export function SettingsChoice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange(value: T): void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-pw-elevated p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded-full px-4 py-1 text-sm font-semibold transition', value === o.value ? 'bg-pw-pink text-white' : 'text-pw-text-2 hover:text-white')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
