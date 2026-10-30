import { createDatabase } from "../src/server/db/client";
import { recoverAdminPassword } from "../src/server/services/admin-recovery.service";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "dotenv";
import { parseProductionEnvironment } from "../src/lib/validation/production";

const env = parseProductionEnvironment(process.env, existsSync(".env") ? parse(readFileSync(".env")) : {});
const database = createDatabase(env.DATABASE_URL);
try {
  await recoverAdminPassword(database.db, process.env);
  console.log("Đã đổi mật khẩu admin và thu hồi mọi phiên của tài khoản đó. Xóa ADMIN_RECOVERY_PASSWORD khỏi file riêng sau khi đăng nhập.");
} catch {
  console.error("Không thể khôi phục admin. Kiểm tra email, mật khẩu mới và trạng thái tài khoản; không thay vai trò hoặc mở khóa.");
  process.exitCode = 1;
} finally { await database.connection.end({ timeout: 3 }); }
