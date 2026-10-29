import type { ReactNode } from "react";

export function InformationPage({ title, children, draft = false }: { title: string; children: ReactNode; draft?: boolean }) {
  return <div className="shop-container py-12 md:py-16"><header className="mb-10 text-center"><p className="text-[10px] tracking-[0.2em] text-muted">CHAM.STU</p><h1 className="shop-section-title mt-4">{title}</h1></header><article className="mx-auto max-w-[760px] space-y-7 text-[15px] leading-[1.7] break-words [&_h2]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:underline [&_a]:underline-offset-4">{draft && <p className="border-l-2 border-fg bg-surface p-4 text-xs leading-6 text-muted">Nội dung mẫu đang chờ chủ shop rà soát trước khi áp dụng chính thức.</p>}{children}</article></div>;
}
