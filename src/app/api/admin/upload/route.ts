import { uploadInputSchema } from "@/lib/validation/media";
import { ERROR_HTTP_STATUS } from "@/lib/result";
import { requireRole } from "@/server/auth/guards";
import { AppError } from "@/server/errors";
import { runAction } from "@/server/run-action";
import { uploadMedia } from "@/server/services/media.service";

export async function POST(request: Request) {
  const result = await runAction(async () => {
    if (Number(request.headers.get("content-length") ?? 0) > 2 * 1024 * 1024 + 16000) throw new AppError("VALIDATION_ERROR", "Tệp tải lên quá lớn.");
    let body: FormData;
    try { body = await request.formData(); } catch { throw new AppError("VALIDATION_ERROR", "Dữ liệu tải lên không hợp lệ."); }
    const input = uploadInputSchema.parse({ file: body.get("file"), folder: body.get("folder") });
    await requireRole("staff");
    const origin = request.headers.get("origin");
    if (origin !== process.env.BETTER_AUTH_URL) throw new AppError("FORBIDDEN");
    return uploadMedia(input.file, input.folder);
  });
  return Response.json(result, { status: result.ok ? 200 : ERROR_HTTP_STATUS[result.error.code] });
}
