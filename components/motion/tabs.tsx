"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

type Variant = "pill" | "underline" | "segment";

type Ctx = {
  value: string;
  setValue: (v: string) => void;
  layoutId: string;
  variant: Variant;
};

const TabsCtx = createContext<Ctx | null>(null);

function useTabs() {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("Tabs components must be used inside <Tabs>");
  return ctx;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  variant = "pill",
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const layoutId = useId();
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  const setValue = useCallback(
    (v: string) => {
      if (!controlled) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange]
  );

  const contextValue = useMemo(
    () => ({ value: current, setValue, layoutId, variant }),
    [current, layoutId, setValue, variant]
  );

  return (
    <TabsCtx.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

const listClasses: Record<Variant, string> = {
  pill: "inline-flex items-center gap-1 rounded-xl bg-surface-subtle p-1 border border-black/[0.06] dark:border-white/[0.08]",
  underline: "inline-flex items-center gap-1 border-b border-black/[0.08] dark:border-white/[0.08]",
  segment: "inline-flex items-center gap-0 rounded-xl bg-surface-subtle p-1 border border-black/[0.06] dark:border-white/[0.08]",
};

export function TabsList({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { variant } = useTabs();

  return (
    <div
      {...props}
      role="tablist"
      className={cn(listClasses[variant], className)}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  indicatorClassName,
  onClick,
  ...props
}: {
  value: string;
  indicatorClassName?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value">) {
  const { value: current, setValue, layoutId, variant } = useTabs();
  const reduce = useReducedMotion();
  const active = current === value;

  if (variant === "underline") {
    return (
      <button
        {...props}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setValue(value);
        }}
        className={cn(
          "relative isolate px-3 pb-2 pt-1 text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center justify-center whitespace-nowrap shrink-0",
          active
            ? "text-gold font-bold"
            : "text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white",
          className
        )}
      >
        <span className="relative z-10">{children}</span>
        {active ? (
          <motion.span
            layoutId={layoutId}
            transition={
              reduce ? { duration: 0 } : SPRING_LAYOUT
            }
            className={cn(
              "absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full",
              indicatorClassName
            )}
          />
        ) : null}
      </button>
    );
  }

  const radius = variant === "pill" ? "rounded-lg" : "rounded-lg";

  return (
    <button
      {...props}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setValue(value);
      }}
      className={cn(
        "relative isolate inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-xs font-mono uppercase tracking-wider outline-none transition-colors select-none active:scale-[0.98]",
        active
          ? "text-gold font-bold"
          : "text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white",
        radius,
        className
      )}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          transition={
            reduce ? { duration: 0 } : SPRING_LAYOUT
          }
          className={cn(
            "absolute inset-0 bg-surface shadow-sm border border-gold/30 -z-10",
            radius,
            indicatorClassName
          )}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {children}
      </span>
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const { value: current } = useTabs();
  const reduce = useReducedMotion();
  const active = current === value;

  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduce ? 0 : -4 }}
      transition={{ duration: 0.18, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
