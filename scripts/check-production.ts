import { createClient } from "@supabase/supabase-js";
import { getTableName, isTable, sql } from "drizzle-orm";
import { parseEnvironment, serverEnvSchema } from "../src/lib/validation/env";
import { createDatabase } from "../src/server/db/client";
import * as schema from "../src/server/db/schema";

const env = parseEnvironment(serverEnvSchema, process.env), database = createDatabase(env.DATABASE_URL);
try {
  const expected = Object.values(schema).flatMap((value) => isTable(value) ? [getTableName(value)] : []);
  const tables = await database.db.execute<{ name: string; rls: boolean }>(sql`SELECT c.relname AS name, c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r'`);
  if (tables.some((table) => !table.rls) || expected.some((name) => !tables.some((table) => table.name === name && table.rls))) throw new Error("Thiếu bảng hoặc RLS: kiểm tra migration production.");
  const [policies] = await database.db.execute<{ total: number }>(sql`SELECT count(*)::integer AS total FROM pg_policies WHERE schemaname='public'`);
  if (policies.total) throw new Error("Schema public phải không có policy Data API theo kiến trúc.");
  const [counts] = await database.db.execute<{ admins: number; samples: number }>(sql`SELECT (SELECT count(*)::integer FROM "user" WHERE role='admin' AND coalesce(banned,false)=false) AS admins, (SELECT count(*)::integer FROM products WHERE code LIKE 'SAMPLE%') AS samples`);
  if (!counts.admins) throw new Error("Chưa có admin hoạt động; chạy seed production.");
  if (counts.samples) throw new Error("Production còn sản phẩm mã SAMPLE; kiểm tra dữ liệu trước khi mở bán, không tự xóa.");
  const storage = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { data, error } = await storage.storage.getBucket("media");
  if (error || !data?.public) throw new Error("Bucket media chưa tồn tại, chưa public hoặc key không có quyền.");
  console.log(JSON.stringify({ status: "pass", tables: expected.length, rls: true, publicPolicies: 0, activeAdmins: counts.admins, sampleProducts: 0, publicMediaBucket: true, emailDelivery: env.EMAIL_DELIVERY }));
  console.log(env.EMAIL_DELIVERY === "disabled" ? "Email tự động đang tắt theo cấu hình. Theo dõi đơn và tin nhắn trong admin; chưa nghiệm thu email hoặc đơn thật." : "Cần kiểm tra domain Resend đã Verified và nghiệm thu đơn thật trên website; lệnh này không gửi email hoặc tạo đơn.");
} catch (error) {
  console.error(error instanceof Error && !('query' in error) && !('code' in error) ? error.message : "Kiểm tra production thất bại; kiểm tra kết nối/schema, không in chi tiết nhạy cảm.");
  process.exitCode = 1;
} finally { await database.connection.end({ timeout: 3 }); }
