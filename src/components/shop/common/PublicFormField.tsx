import type { InputHTMLAttributes } from "react";

export function PublicFormField({ label, error, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
  return <div className="space-y-2"><label htmlFor={id} className="block text-xs font-medium">{label}</label><input {...props} id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="h-12 w-full min-w-0 border border-line bg-white px-3 text-sm outline-offset-2 focus:border-fg" />{error && <p id={`${id}-error`} role="alert" className="text-xs leading-5 text-sale">{error}</p>}</div>;
}
