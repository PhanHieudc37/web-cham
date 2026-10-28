import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import type { productInputSchema, ProductInput } from "@/lib/validation/product";
export type ProductForm = UseFormReturn<z.input<typeof productInputSchema>, unknown, ProductInput>;
