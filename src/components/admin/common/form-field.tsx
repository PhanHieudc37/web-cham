import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function FormField({ label, error, id, ...props }: React.ComponentProps<typeof Input> & { label: string; error?: string; id: string }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} className="h-11 bg-white" {...props} />{error && <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>}</div>;
}
