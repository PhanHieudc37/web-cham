import Link from "next/link";
export function ListPagination({ path, page, totalPages, total }: { path: string; page: number; totalPages: number; total: number }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-white px-4 py-4 text-xs text-stone-500"><span>{total} mục · Trang {page} / {totalPages}</span><div className="flex gap-4">{page > 1 && <Link href={`${path}?page=${page - 1}`}>Trước</Link>}{page < totalPages && <Link href={`${path}?page=${page + 1}`}>Sau</Link>}</div></div>;
}
