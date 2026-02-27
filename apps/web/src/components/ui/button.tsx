import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
        ghost:
          'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300',
        ribbon:
          'hover:bg-ribbon-hover dark:hover:bg-ribbon-hover-dark text-gray-700 dark:text-gray-300 rounded px-1.5 py-0.5',
        'ribbon-active':
          'bg-ribbon-active dark:bg-ribbon-active-dark text-blue-700 dark:text-blue-300 rounded px-1.5 py-0.5',
        destructive:
          'bg-red-600 text-white hover:bg-red-700',
        outline:
          'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
      },
      size: {
        default: 'h-8 px-3 py-1',
        sm: 'h-7 px-2 py-0.5 text-xs',
        lg: 'h-10 px-4',
        icon: 'h-7 w-7 p-0',
        'icon-sm': 'h-6 w-6 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
