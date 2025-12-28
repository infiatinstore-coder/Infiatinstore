import { cn } from '@/lib/utils';

const badgeVariants = {
    primary: 'bg-primary-100 text-primary-700',
    secondary: 'bg-neutral-100 text-neutral-700',
    success: 'bg-secondary-100 text-secondary-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
};

const badgeSizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
};

export function Badge({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 font-medium rounded-full',
                badgeVariants[variant],
                badgeSizes[size],
                className
            )}
        >
            {children}
        </span>
    );
}
