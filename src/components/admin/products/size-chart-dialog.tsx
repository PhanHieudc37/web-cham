"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { sizeChartInputSchema } from "@/lib/validation/product";
import { createSizeChartAction } from "@/server/actions/admin/products";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "../common/form-field";

type Chart = z.output<typeof sizeChartInputSchema>;
export function SizeChartDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (chart: Chart & { id: string }) => void }) {
  const [error, setError] = useState("");
  const form = useForm<z.input<typeof sizeChartInputSchema>, unknown, Chart>({ resolver: zodResolver(sizeChartInputSchema), defaultValues: { name: "", columns: ["Size", "Dài", "Rộng"], rows: [["S", "", ""], ["M", "", ""]], note: "" } });
  const columns = useWatch({ control: form.control, name: "columns" }), rows = useWatch({ control: form.control, name: "rows" });
  useUnsavedChanges(open && form.formState.isDirty);
  return <Dialog open={open} onOpenChange={(value) => { if (form.formState.isSubmitting) return; if (!value && form.formState.isDirty && !window.confirm("Bạn có thay đổi chưa lưu. Bạn muốn đóng?")) return; onClose(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-md sm:max-w-xl"><DialogHeader><DialogTitle>Tạo bảng size</DialogTitle><DialogDescription>Nhập số đo thật của shop, có thể thêm cột và dòng.</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={form.handleSubmit(async (values) => { const result = await createSizeChartAction(values); if (!result.ok) { setError(result.error.message); return; } onCreated({ ...values, id: result.data.id }); form.reset(); toast.success("Đã tạo bảng size"); onClose(); })}>
    <FormField id="chart-name" label="Tên bảng size" {...form.register("name")} error={form.formState.errors.name?.message} /><div className="space-y-2">{columns.map((column, index) => <div key={index} className="flex gap-2"><Input aria-label={`Tên cột ${index + 1}`} {...form.register(`columns.${index}`)} /><Button type="button" variant="ghost" className="h-10 px-2" disabled={columns.length === 1} onClick={() => { form.setValue("columns", columns.filter((_, position) => position !== index), { shouldDirty: true }); form.setValue("rows", rows.map((row) => row.filter((_, position) => position !== index)), { shouldDirty: true }); }}>Gỡ</Button></div>)}<Button type="button" variant="outline" className="h-9 px-3" disabled={columns.length >= 12} onClick={() => { form.setValue("columns", [...columns, ""], { shouldDirty: true }); form.setValue("rows", rows.map((row) => [...row, ""]), { shouldDirty: true }); }}>Thêm cột</Button></div>
    <div className="space-y-3">{rows.map((row, index) => <div key={index} className="rounded-md border p-3"><p className="mb-2 text-xs text-stone-500">Dòng {index + 1}</p><div className="grid grid-cols-2 gap-2">{row.map((_, position) => <Input key={position} aria-label={`Dòng ${index + 1} ${columns[position]}`} placeholder={columns[position]} {...form.register(`rows.${index}.${position}`)} />)}</div><Button type="button" variant="ghost" className="mt-1 h-8 px-1 text-xs" disabled={rows.length === 1} onClick={() => form.setValue("rows", rows.filter((_, position) => position !== index), { shouldDirty: true })}>Gỡ dòng</Button></div>)}<Button type="button" variant="outline" className="h-9 px-3" disabled={rows.length >= 30} onClick={() => form.setValue("rows", [...rows, columns.map(() => "")], { shouldDirty: true })}>Thêm dòng</Button></div>
    <FormField id="chart-note" label="Ghi chú" {...form.register("note")} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>Lưu bảng size</Button></form></DialogContent></Dialog>;
}
