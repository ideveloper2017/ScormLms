import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';

export function CourseFormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  const id = useId();
  // A labelled group also covers composite controls (selects and rich text editors).
  const control = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, {
    'aria-labelledby': `${id}-label`,
    'aria-describedby': error ? `${id}-error` : undefined,
    'aria-invalid': Boolean(error),
  }) : children;
  return <div role="group" aria-labelledby={`${id}-label`} className="space-y-1.5">
    <Label id={`${id}-label`}>{label}</Label>
    {control}
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
