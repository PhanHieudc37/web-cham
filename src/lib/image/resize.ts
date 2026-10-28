export async function resizeImage(file: File, mode: "square" | "fit"): Promise<File> {
  if (!["image/webp", "image/png", "image/jpeg"].includes(file.type)) throw new Error("Chỉ chấp nhận ảnh WebP, JPEG hoặc PNG");
  if (file.size > 20 * 1024 * 1024) throw new Error("Ảnh gốc tối đa 20 MB");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const scale = mode === "square" ? Math.min(1200 / bitmap.width, 1200 / bitmap.height) : Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    canvas.width = mode === "square" ? 1200 : Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = mode === "square" ? 1200 : Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh");
    context.fillStyle = "#FFFFFF"; context.fillRect(0, 0, canvas.width, canvas.height);
    const width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale);
    context.drawImage(bitmap, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    const encode = (type: string, quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Không chuyển đổi được ảnh")), type, quality));
    let blob = await encode("image/webp", 0.85);
    if (blob.type !== "image/webp") blob = await encode("image/jpeg", 0.85);
    if (blob.size >= 1024 * 1024) blob = await encode(blob.type, 0.7);
    if (blob.size >= 1024 * 1024) blob = await encode(blob.type, 0.5);
    if (blob.size >= 1024 * 1024) throw new Error("Ảnh sau xử lý còn quá lớn. Vui lòng chọn ảnh nhẹ hơn");
    return new File([blob], `image.${blob.type === "image/webp" ? "webp" : "jpg"}`, { type: blob.type });
  } finally { bitmap.close(); }
}
