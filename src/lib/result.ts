export type ErrorCode = "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "OUT_OF_STOCK" | "PRICE_CHANGED" | "INVALID_TRANSITION" | "CONFLICT" | "RATE_LIMITED" | "INTERNAL";
export type ActionError = { code: ErrorCode; message: string; fields?: Record<string, string>; details?: unknown };
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Thông tin chưa hợp lệ, vui lòng kiểm tra lại.", UNAUTHORIZED: "Vui lòng đăng nhập.", FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  NOT_FOUND: "Không tìm thấy dữ liệu.", OUT_OF_STOCK: "Sản phẩm không đủ số lượng hoặc đã ngừng bán.", PRICE_CHANGED: "Giá sản phẩm vừa thay đổi, vui lòng kiểm tra lại đơn hàng.",
  INVALID_TRANSITION: "Không thể chuyển đơn sang trạng thái này.", CONFLICT: "Dữ liệu bị trùng hoặc đã thay đổi.", RATE_LIMITED: "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.", INTERNAL: "Đã có lỗi xảy ra, vui lòng thử lại hoặc liên hệ shop.",
};
export const ERROR_HTTP_STATUS: Record<ErrorCode, number> = { VALIDATION_ERROR: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, OUT_OF_STOCK: 409, PRICE_CHANGED: 409, INVALID_TRANSITION: 409, CONFLICT: 409, RATE_LIMITED: 429, INTERNAL: 500 };
