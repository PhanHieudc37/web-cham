import { z } from "zod";

export const searchSuggestSchema = z.object({ q: z.string({ error: "Vui lòng nhập từ khóa tìm kiếm." }).trim()
  .min(2, "Nhập ít nhất 2 ký tự để tìm kiếm.").max(200, "Từ khóa không được quá 200 ký tự.") });
