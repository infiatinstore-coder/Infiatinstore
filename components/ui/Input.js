'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(
    (
        {
            label,
            error,
            helperText,
            leftIcon,
            rightIcon,
            fullWidth = true,
            className = '',
            ...props
        },
        ref
    ) => {
        return (
            <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
                {label && (
                    <label className="block text-sm font-medium text-neutral-700">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'w-full px-4 py-3 rounded-lg border-2 bg-white text-neutral-800',
                            'placeholder:text-neutral-400',
                            'focus:outline-none focus:ring-2 transition-all duration-200',
                            error
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-100',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                            {rightIcon}
                        </span>
                    )}
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {helperText && !error && (
                    <p className="text-sm text-neutral-500">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

