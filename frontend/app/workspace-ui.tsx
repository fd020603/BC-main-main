"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  decisionMeta,
  type DecisionGrade,
  type FieldOption,
} from "./workspace-types";

export function SectionIntro({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        {kicker}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
        {description}
      </p>
    </div>
  );
}

function HelpTooltip({ content }: { content: string }) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: "bottom" as "top" | "bottom",
  });
  const canUseDom = typeof window !== "undefined";

  useLayoutEffect(() => {
    if (!open || !canUseDom) {
      return;
    }

    function updatePosition() {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;

      if (!trigger || !tooltip) {
        return;
      }

      const viewportPadding = 12;
      const triggerRect = trigger.getBoundingClientRect();
      const maxWidth = Math.min(320, window.innerWidth - viewportPadding * 2);

      tooltip.style.maxWidth = `${maxWidth}px`;

      const tooltipRect = tooltip.getBoundingClientRect();
      const shouldPlaceBelow =
        triggerRect.bottom + 12 + tooltipRect.height <=
        window.innerHeight - viewportPadding;

      const top = shouldPlaceBelow
        ? triggerRect.bottom + 10
        : Math.max(viewportPadding, triggerRect.top - tooltipRect.height - 10);
      const left = Math.min(
        Math.max(
          viewportPadding,
          triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
        ),
        window.innerWidth - tooltipRect.width - viewportPadding,
      );

      setPosition({
        top,
        left,
        placement: shouldPlaceBelow ? "bottom" : "top",
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [canUseDom, open]);

  return (
    <span className="inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-label="보조 설명 보기"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-line-strong)] bg-white text-[11px] font-semibold text-[var(--color-accent)] shadow-sm transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
      >
        ?
      </button>
      {canUseDom && open
        ? createPortal(
            <div
              ref={tooltipRef}
              className="pointer-events-none fixed z-[90] rounded-2xl border border-[var(--color-line)] bg-[rgba(255,255,255,0.98)] px-3 py-2 text-xs font-medium leading-6 text-[var(--color-ink)] shadow-[0_18px_36px_rgba(15,23,42,0.16)]"
              style={{
                top: position.top,
                left: position.left,
                width: "max-content",
                transform:
                  position.placement === "bottom"
                    ? "translateY(0)"
                    : "translateY(0)",
              }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

export function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}

export function ActionButton({
  label,
  onClick,
  disabled,
  active,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "primary" | "secondary";
}) {
  const baseClass =
    "rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const primaryClass =
    "bg-[var(--color-accent)] text-white hover:brightness-105";
  const secondaryClass =
    "border border-[var(--color-line)] bg-[var(--color-surface-strong)] text-[var(--color-ink)] hover:border-[var(--color-line-strong)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClass} ${
        variant === "primary" ? primaryClass : secondaryClass
      } ${active ? "ring-4 ring-[var(--color-accent-soft)]" : ""}`}
    >
      {active ? `${label}...` : label}
    </button>
  );
}

export function EditorCard({
  label,
  helper,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4">
      <label className="text-sm font-semibold text-[var(--color-ink)]">
        {label}
      </label>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{helper}</p>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={18}
        className="code-block mt-3 w-full rounded-lg px-4 py-3 text-sm leading-6 text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)]"
        placeholder={placeholder}
      />
    </div>
  );
}

export function StatusBanner({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] px-4 py-3 text-sm text-[var(--color-muted)]">
      {message}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-3 rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
      {message}
    </div>
  );
}

export function DecisionBadge({
  decision,
  compact = false,
}: {
  decision: DecisionGrade;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-3 py-1 font-semibold ${
        compact ? "text-xs" : "text-sm"
      } ${decisionMeta[decision].className}`}
    >
      {decisionMeta[decision].label}
    </span>
  );
}

export function TextList({
  title,
  items,
  emptyCopy = "표시할 항목이 없습니다.",
  compact = false,
  className = "",
  itemHints,
}: {
  title: string;
  items: string[];
  emptyCopy?: string;
  compact?: boolean;
  className?: string;
  itemHints?: Record<string, string>;
}) {
  return (
    <div
      className={`rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-4 ${className}`}
    >
      <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
      {items.length > 0 ? (
        <ul
          className={`mt-3 space-y-2 text-[var(--color-muted)] ${
            compact ? "text-sm leading-6" : "text-sm leading-7"
          }`}
        >
          {items.map((item) => {
            const hint = itemHints?.[item];
            return (
              <li
                key={`${title}-${item}`}
                className="group relative rounded-md px-2 py-1 transition hover:bg-[var(--color-surface-muted)]"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-sm bg-[var(--color-accent)]" />
                  <span className="flex-1">{item}</span>
                  {hint ? (
                    <span className="shrink-0 pt-1">
                      <HelpTooltip content={hint} />
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-muted)]">{emptyCopy}</p>
      )}
    </div>
  );
}

export function InlineList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${title}-${item}`}
            className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-strong)] px-3 py-1.5 text-sm text-[var(--color-muted)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-strong)] p-6">
      <p className="text-base font-semibold text-[var(--color-ink)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
        {description}
      </p>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`interactive-card reveal-up rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-strong)] p-5 ${className}`}
    >
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
        <p className="mt-1 text-sm leading-7 text-[var(--color-muted)]">
          {description}
        </p>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

export function SelectField({
  label,
  helper,
  tooltip,
  value,
  onChange,
  options,
}: {
  label: string;
  helper: string;
  tooltip?: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldOption[];
}) {
  const labelId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [highlightedValue, setHighlightedValue] = useState<string | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const displayedOption = selectedOption ?? options[0];
  const highlightedOption =
    options.find(
      (option) => option.value === (highlightedValue ?? value),
    ) ?? displayedOption;
  const isPlaceholder = !value;

  useEffect(() => {
    if (!open) {
      return;
    }

    function closeOnOutsidePointer(event: MouseEvent) {
      const container = containerRef.current;

      if (container && !container.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsidePointer);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsidePointer);
    };
  }, [open]);

  function moveHighlight(direction: 1 | -1) {
    if (options.length === 0) {
      return;
    }

    const currentValue = highlightedValue ?? value;
    const currentIndex = Math.max(
      0,
      options.findIndex((option) => option.value === currentValue),
    );
    const nextIndex =
      (currentIndex + direction + options.length) % options.length;

    setHighlightedValue(options[nextIndex]?.value ?? null);
    setOpen(true);
  }

  function selectOption(nextValue: string) {
    onChange(nextValue);
    setHighlightedValue(nextValue);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative block">
      <span
        id={labelId}
        className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]"
      >
        {label}
        {tooltip ? <HelpTooltip content={tooltip} /> : null}
      </span>
      <span className="mt-1 block text-sm text-[var(--color-muted)]">{helper}</span>
      <button
        type="button"
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => {
          setOpen((current) => !current);
          setHighlightedValue(value || options[0]?.value || null);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveHighlight(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveHighlight(-1);
          } else if (event.key === "Escape") {
            setOpen(false);
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open && highlightedValue !== null) {
              selectOption(highlightedValue);
            } else {
              setOpen(true);
              setHighlightedValue(value || options[0]?.value || null);
            }
          }
        }}
        className={`mt-3 flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-left text-sm outline-none transition focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-soft)] ${
          isPlaceholder ? "text-[var(--color-muted)]" : "text-[var(--color-ink)]"
        }`}
      >
        <span>{displayedOption?.label ?? "선택"}</span>
        <span className="text-xs font-semibold text-[var(--color-muted)]">v</span>
      </button>
      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          className="absolute left-0 right-0 z-50 mt-2 max-h-80 overflow-auto rounded-lg border border-[var(--color-line)] bg-white p-1 shadow-[0_18px_36px_rgba(15,23,42,0.16)]"
        >
          {options.map((option) => {
            const selected = option.value === value;
            const highlighted = option.value === highlightedOption?.value;

            return (
              <button
                key={`${label}-${option.value}`}
                type="button"
                role="option"
                aria-selected={selected}
                title={option.description}
                onMouseEnter={() => setHighlightedValue(option.value)}
                onFocus={() => setHighlightedValue(option.value)}
                onClick={() => selectOption(option.value)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  highlighted
                    ? "bg-[var(--color-accent-soft)] text-[var(--color-ink)]"
                    : "text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
                }`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className={option.value ? "font-semibold" : "text-[var(--color-muted)]"}>
                    {option.label}
                  </span>
                  {selected ? (
                    <span className="text-xs font-semibold text-[var(--color-accent)]">
                      선택됨
                    </span>
                  ) : null}
                </span>
                {highlighted && option.description ? (
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                    예시: {option.description}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SegmentedField({
  label,
  helper,
  tooltip,
  value,
  onChange,
  options,
}: {
  label: string;
  helper: string;
  tooltip?: string;
  value: string;
  onChange: (value: string) => void;
  options: FieldOption[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p>
        {tooltip ? <HelpTooltip content={tooltip} /> : null}
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{helper}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <button
              key={`${label}-${option.value}`}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                  : "border-[var(--color-line)] bg-white text-[var(--color-muted)] hover:border-[var(--color-line-strong)] hover:text-[var(--color-ink)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] py-2 last:border-b-0">
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <span className="text-sm font-semibold text-[var(--color-ink)]">{value}</span>
    </div>
  );
}
