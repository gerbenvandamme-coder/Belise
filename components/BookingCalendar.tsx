'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isClosedDay, startOfDay, toDateKey } from '@/lib/schedule';

const WEEKDAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'] as const;
const MONTH_FORMATTER = new Intl.DateTimeFormat('nl-BE', { month: 'long', year: 'numeric' });
const DAY_FORMATTER = new Intl.DateTimeFormat('nl-BE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe';

// TimeSlotPicker importeert deze helpers nog via dit bestand.
export { startOfDay, toDateKey };

/** Maakt een raster van zeven kolommen (maandag eerst). Lege cellen zijn null. */
function buildMonthGrid(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const cells: (Date | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, monthIndex, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type DayButtonProps = {
  date: Date;
  selected: boolean;
  disabled: boolean;
  onSelect: (date: Date) => void;
};

function DayButton({ date, selected, disabled, onSelect }: DayButtonProps) {
  const stateClass = selected
    ? 'bg-primary font-medium text-canvas shadow-sm'
    : disabled
      ? 'cursor-not-allowed text-primary/25'
      : 'text-primary hover:bg-blush/50';

  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      aria-label={DAY_FORMATTER.format(date)}
      onClick={() => onSelect(date)}
      className={`relative flex aspect-square w-full items-center justify-center rounded-full text-sm transition-colors duration-200 motion-reduce:transition-none ${FOCUS_RING} ${stateClass}`}
    >
      {date.getDate()}
      {!disabled && (
        <span
          aria-hidden="true"
          className={`absolute bottom-1.5 h-1 w-1 rounded-full ${selected ? 'bg-canvas' : 'bg-taupe'}`}
        />
      )}
    </button>
  );
}

type BookingCalendarProps = {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
};

export default function BookingCalendar({ selectedDate, onSelectDate }: BookingCalendarProps) {
  const today = startOfDay(new Date());
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    const base = selectedDate ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const cells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth]);
  const selectedKey = selectedDate ? toDateKey(selectedDate) : null;
  const canGoBack = visibleMonth > currentMonthStart;

  const monthTitle = MONTH_FORMATTER.format(visibleMonth);
  const title = monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);

  const shiftMonth = (delta: number) => {
    setVisibleMonth(
      (previous) => new Date(previous.getFullYear(), previous.getMonth() + delta, 1),
    );
  };

  return (
    <div className="rounded-3xl bg-card p-6 shadow-[0_20px_40px_-30px_rgba(28,25,23,0.3)] ring-1 ring-taupe/25 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          aria-label="Vorige maand"
          disabled={!canGoBack}
          onClick={() => shiftMonth(-1)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-blush/50 disabled:cursor-not-allowed disabled:text-primary/25 disabled:hover:bg-transparent ${FOCUS_RING}`}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <p aria-live="polite" className="font-serif text-xl font-medium text-primary">
          {title}
        </p>

        <button
          type="button"
          aria-label="Volgende maand"
          onClick={() => shiftMonth(1)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-blush/50 ${FOCUS_RING}`}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-[0.12em] text-primary/55">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} aria-hidden="true">
            {label}
          </span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} aria-hidden="true" />;

          const disabled = date < today || isClosedDay(date);
          return (
            <DayButton
              key={toDateKey(date)}
              date={date}
              selected={toDateKey(date) === selectedKey}
              disabled={disabled}
              onSelect={onSelectDate}
            />
          );
        })}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-primary/60">
        <span aria-hidden="true" className="inline-block h-1 w-1 rounded-full bg-taupe" />
        Open dag. Zondagen en feestdagen zijn gesloten.
      </p>
    </div>
  );
}