import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Quản trị | Cham.stu", template: "%s | Quản trị Cham.stu" }, robots: { index: false, follow: false } };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return children; }
