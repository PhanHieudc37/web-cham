import { existsSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const target = ".env.test.local";
if (existsSync(target)) {
  console.log("Môi trường kiểm thử đã tồn tại; giữ nguyên mật khẩu và kết nối.");
} else {
  const password = randomBytes(24).toString("base64url");
  writeFileSync(target, `TEST_POSTGRES_PASSWORD=${password}\nTEST_DATABASE_URL=postgresql://postgres:${password}@127.0.0.1:55432/cham_stu_test\n`);
  console.log("Đã tạo môi trường kiểm thử riêng; thông tin kết nối không được in ra.");
}
