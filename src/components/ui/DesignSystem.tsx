import React, { useState, useEffect, useRef } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'motion/react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ChevronDown,
  X,
  Loader2,
  Inbox,
  RefreshCw,
  Check,
  Info,
} from 'lucide-react';
import { ToastMessage } from '../../types/crewpay';

// ============================================================================
// 1. ANIMATED NUMERICAL COUNTER
// ============================================================================
interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(prefersReducedMotion ? value : 0);
  const springValue = useSpring(motionValue, {
    stiffness: 90,
    damping: 22,
    mass: 0.8,
  });
  const [displayValue, setDisplayValue] = useState<string>(() =>
    value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(
        value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
      return;
    }
    motionValue.set(value);
  }, [value, decimals, motionValue, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(
        latest.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
    });
    return () => unsubscribe();
  }, [springValue, decimals, prefersReducedMotion]);

  return (
    <span className={`font-mono-tabular tabular-nums ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

// ============================================================================
// 2. REUSABLE BUTTON
// ============================================================================
export type ButtonVariant =
  | 'primary'
  | 'midnight'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[#4169E1] text-white hover:bg-[#3257C8] active:bg-[#2746A8] border border-transparent shadow-xs',
    midnight:
      'bg-[#14213D] text-white hover:bg-[#1E2F54] active:bg-[#0F192E] border border-transparent shadow-xs',
    secondary:
      'bg-[#EEEAFE] text-[#14213D] hover:bg-[#E1DAFC] active:bg-[#D4CAFA] border border-[#14213D]/10',
    outline:
      'bg-white text-[#252A34] hover:bg-[#FAF9F6] active:bg-[#F0EFEA] border border-[#14213D]/15',
    ghost:
      'bg-transparent text-[#252A34] hover:bg-[#14213D]/6 active:bg-[#14213D]/10 border border-transparent',
    danger:
      'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] border border-transparent',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5 min-h-[34px]',
    md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2 min-h-[40px]',
    lg: 'px-5 py-2.5 text-sm font-semibold rounded-lg gap-2.5 min-h-[44px]',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center whitespace-nowrap shrink-0 transition-all duration-150 ease-out cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4169E1] disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

// ============================================================================
// 3. REUSABLE CARD
// ============================================================================
export type CardSurface =
  | 'white'
  | 'lavender'
  | 'mint'
  | 'peach'
  | 'cream'
  | 'midnight';

interface CardProps {
  surface?: CardSurface;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  surface = 'white',
  interactive = false,
  padding = 'md',
  className = '',
  onClick,
  children,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const surfaceClasses: Record<CardSurface, string> = {
    white: 'bg-white text-[#252A34] border border-[#14213D]/10',
    lavender: 'bg-[#EEEAFE] text-[#14213D] border border-[#4169E1]/15',
    mint: 'bg-[#C9F2DF] text-[#14213D] border border-[#14213D]/12',
    peach: 'bg-[#FFE0D1] text-[#14213D] border border-[#14213D]/12',
    cream: 'bg-[#FAF9F6] text-[#252A34] border border-[#14213D]/10',
    midnight: 'bg-[#14213D] text-white border border-[#14213D]',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-7',
  };

  if (interactive) {
    return (
      <motion.div
        whileHover={prefersReducedMotion ? undefined : { y: -2 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClick}
        className={`rounded-xl transition-colors duration-150 ${surfaceClasses[surface]} ${paddingClasses[padding]} ${
          onClick ? 'cursor-pointer hover:border-[#4169E1]/40' : ''
        } ${className}`}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-xl ${surfaceClasses[surface]} ${paddingClasses[padding]} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

// ============================================================================
// 4. ACCESSIBLE STATUS INDICATOR (Icon + Label, non-hue-only signaling)
// ============================================================================
export type SemanticStatus =
  | 'completed'
  | 'verified'
  | 'paid'
  | 'ready'
  | 'approved'
  | 'processing'
  | 'pending'
  | 'pending_approval'
  | 'scheduled'
  | 'review'
  | 'funding_required'
  | 'action_required'
  | 'flagged'
  | 'failed'
  | 'rejected';

interface StatusBadgeProps {
  status: SemanticStatus;
  customLabel?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  customLabel,
}) => {
  const config: Record<
    SemanticStatus,
    {
      label: string;
      icon: React.ReactNode;
      styleClass: string;
    }
  > = {
    completed: {
      label: 'Completed',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E46] shrink-0" />,
      styleClass: 'bg-[#C9F2DF]/65 text-[#0F5132] border-[#0F6E46]/20',
    },
    verified: {
      label: 'Verified',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E46] shrink-0" />,
      styleClass: 'bg-[#C9F2DF]/65 text-[#0F5132] border-[#0F6E46]/20',
    },
    paid: {
      label: 'Settled',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E46] shrink-0" />,
      styleClass: 'bg-[#C9F2DF]/65 text-[#0F5132] border-[#0F6E46]/20',
    },
    ready: {
      label: 'Ready to Execute',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E46] shrink-0" />,
      styleClass: 'bg-[#C9F2DF]/65 text-[#0F5132] border-[#0F6E46]/20',
    },
    approved: {
      label: 'Approved',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E46] shrink-0" />,
      styleClass: 'bg-[#C9F2DF]/65 text-[#0F5132] border-[#0F6E46]/20',
    },
    processing: {
      label: 'In Clearing',
      icon: <Clock className="w-3.5 h-3.5 text-[#4169E1] shrink-0" />,
      styleClass: 'bg-[#EEEAFE] text-[#14213D] border-[#4169E1]/25',
    },
    scheduled: {
      label: 'Scheduled',
      icon: <Clock className="w-3.5 h-3.5 text-[#4169E1] shrink-0" />,
      styleClass: 'bg-[#EEEAFE] text-[#14213D] border-[#4169E1]/25',
    },
    pending: {
      label: 'Pending Verification',
      icon: <Clock className="w-3.5 h-3.5 text-[#9A4B1A] shrink-0" />,
      styleClass: 'bg-[#FFE0D1]/70 text-[#7C360B] border-[#9A4B1A]/20',
    },
    pending_approval: {
      label: 'Awaiting Approval',
      icon: <Clock className="w-3.5 h-3.5 text-[#9A4B1A] shrink-0" />,
      styleClass: 'bg-[#FFE0D1]/70 text-[#7C360B] border-[#9A4B1A]/20',
    },
    review: {
      label: 'Under Review',
      icon: <Clock className="w-3.5 h-3.5 text-[#9A4B1A] shrink-0" />,
      styleClass: 'bg-[#FFE0D1]/70 text-[#7C360B] border-[#9A4B1A]/20',
    },
    funding_required: {
      label: 'Funding Required',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#9A4B1A] shrink-0" />,
      styleClass: 'bg-[#FFE0D1] text-[#7C360B] border-[#9A4B1A]/25',
    },
    action_required: {
      label: 'Action Required',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#9A4B1A] shrink-0" />,
      styleClass: 'bg-[#FFE0D1] text-[#7C360B] border-[#9A4B1A]/25',
    },
    flagged: {
      label: 'Compliance Hold',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />,
      styleClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]/25',
    },
    failed: {
      label: 'Returned',
      icon: <XCircle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />,
      styleClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]/25',
    },
    rejected: {
      label: 'Declined',
      icon: <XCircle className="w-3.5 h-3.5 text-[#B91C1C] shrink-0" />,
      styleClass: 'bg-[#FEE2E2] text-[#991B1B] border-[#DC2626]/25',
    },
  };

  const current = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap shrink-0 ${current.styleClass}`}
    >
      {current.icon}
      <span>{customLabel || current.label}</span>
    </span>
  );
};

// ============================================================================
// 5. INPUT FIELD
// ============================================================================
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightElement,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#14213D] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-[#252A34]/50 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full bg-white text-sm text-[#252A34] placeholder:text-[#252A34]/40 rounded-lg border ${
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15'
              : 'border-[#14213D]/15 focus:border-[#4169E1] focus:ring-2 focus:ring-[#4169E1]/15'
          } py-2 ${leftIcon ? 'pl-9' : 'pl-3.5'} ${
            rightElement ? 'pr-10' : 'pr-3.5'
          } outline-none transition-all duration-150 min-h-[40px] ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-2.5 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-[#DC2626]">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#252A34]/60">{helperText}</p>
      ) : null}
    </div>
  );
};

// ============================================================================
// 6. ANIMATED DROPDOWN SELECT
// ============================================================================
export interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface DropdownProps {
  label?: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  value,
  options,
  onChange,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption =
    options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-[#14213D] mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full min-h-[40px] px-3.5 py-2 bg-white border border-[#14213D]/15 rounded-lg text-sm text-[#252A34] flex items-center justify-between gap-2 hover:border-[#14213D]/30 focus-visible:outline-2 focus-visible:outline-[#4169E1] transition-colors cursor-pointer"
      >
        <span className="truncate font-medium">{selectedOption?.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#252A34]/60 shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-40 mt-1.5 w-full min-w-[200px] bg-white border border-[#14213D]/12 rounded-xl shadow-lg py-1.5 max-h-64 overflow-y-auto"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEEAFE]/70 text-[#14213D] font-semibold'
                      : 'text-[#252A34] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-xs text-[#252A34]/55 truncate">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[#4169E1] shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// 7. ANIMATED MODAL
// ============================================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  maxWidth = 'lg',
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const widthClass = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#14213D]/55"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 w-full ${widthClass} bg-white border border-[#14213D]/12 rounded-2xl shadow-xl overflow-hidden my-auto`}
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[#14213D]/10 bg-[#FAF9F6]">
              <div>
                <h3 className="text-lg font-bold text-[#14213D]">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-[#252A34]/65 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#252A34]/60 hover:text-[#14213D] hover:bg-[#14213D]/8 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
            {footer && (
              <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#14213D]/10 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// 8. EMPTY, LOADING & ERROR STATES
// ============================================================================
interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
    <div className="w-11 h-11 rounded-xl bg-[#EEEAFE] text-[#4169E1] flex items-center justify-center mb-3.5">
      <Inbox className="w-5 h-5" />
    </div>
    <h4 className="text-base font-bold text-[#14213D]">{title}</h4>
    <p className="text-sm text-[#252A34]/65 max-w-sm mt-1 mb-5">
      {description}
    </p>
    {actionLabel && onAction && (
      <Button variant="primary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </div>
);

export const LoadingState: React.FC<{ rows?: number; label?: string }> = ({
  rows = 4,
  label = 'Synchronizing financial ledger...',
}) => (
  <div className="py-8 px-6 space-y-3" role="status" aria-live="polite">
    <div className="flex items-center gap-2 text-xs font-medium text-[#252A34]/60 mb-4">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4169E1]" />
      <span>{label}</span>
    </div>
    {Array.from({ length: rows }).map((_, idx) => (
      <div
        key={idx}
        className="h-10 w-full rounded-lg bg-[#14213D]/6 animate-pulse"
      />
    ))}
  </div>
);

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to retrieve settlement feed',
  message,
  onRetry,
}) => (
  <div className="py-10 px-6 text-center bg-[#FFE0D1]/35 rounded-xl border border-[#9A4B1A]/20">
    <div className="w-10 h-10 rounded-xl bg-[#FFE0D1] text-[#9A4B1A] flex items-center justify-center mx-auto mb-3">
      <AlertTriangle className="w-5 h-5" />
    </div>
    <h4 className="text-sm font-bold text-[#14213D]">{title}</h4>
    <p className="text-xs text-[#252A34]/75 max-w-md mx-auto mt-1 mb-4">
      {message}
    </p>
    {onRetry && (
      <Button
        variant="outline"
        size="sm"
        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        onClick={onRetry}
      >
        Retry Connection
      </Button>
    )}
  </div>
);

// ============================================================================
// 9. TOAST NOTIFICATION VIEWPORT
// ============================================================================
interface ToastViewportProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastViewport: React.FC<ToastViewportProps> = ({
  toasts,
  onDismiss,
}) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const iconMap = {
            success: <CheckCircle2 className="w-4 h-4 text-[#0F6E46] shrink-0" />,
            info: <Info className="w-4 h-4 text-[#4169E1] shrink-0" />,
            warning: <AlertTriangle className="w-4 h-4 text-[#9A4B1A] shrink-0" />,
            error: <XCircle className="w-4 h-4 text-[#DC2626] shrink-0" />,
          };
          const bgMap = {
            success: 'bg-white border-[#0F6E46]/30',
            info: 'bg-white border-[#4169E1]/30',
            warning: 'bg-white border-[#9A4B1A]/30',
            error: 'bg-white border-[#DC2626]/30',
          };

          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 ${bgMap[t.variant]}`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{iconMap[t.variant]}</div>
                <div>
                  <div className="text-xs font-bold text-[#14213D]">
                    {t.title}
                  </div>
                  <div className="text-xs text-[#252A34]/75 mt-0.5 leading-relaxed">
                    {t.description}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="text-[#252A34]/40 hover:text-[#14213D] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
