import { Skeleton } from "@/components/ui/skeleton";

export function ListingSkeleton({ sidebar = true }: { sidebar?: boolean }) {
  return <div className="shop-container py-8" role="status" aria-label="Đang tải sản phẩm"><Skeleton className="mb-10 h-4 w-48" /><Skeleton className="mx-auto mb-5 h-7 w-64" /><Skeleton className="mx-auto mb-10 h-4 w-24" /><Skeleton className="mb-7 h-16 w-full" />
    <div className={`grid gap-8 ${sidebar ? "lg:grid-cols-[240px_minmax(0,1fr)]" : ""}`}>{sidebar && <div className="hidden space-y-6 lg:block">{[0, 1, 2].map((index) => <Skeleton key={index} className="h-32 w-full" />)}</div>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">{Array.from({ length: 12 }, (_, index) => <div key={index}><Skeleton className="aspect-square w-full" /><Skeleton className="mt-4 h-4 w-4/5" /><Skeleton className="mt-3 h-4 w-1/2" /></div>)}</div>
    </div>
  </div>;
}
export function ProductSkeleton() {
  return <div className="shop-container py-8" role="status" aria-label="Đang tải chi tiết sản phẩm"><Skeleton className="mb-8 h-4 w-64 max-w-full" /><div className="grid items-start gap-8 lg:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] lg:gap-12"><Skeleton className="aspect-square w-full" />
    <div className="space-y-6"><Skeleton className="h-7 w-4/5" /><Skeleton className="h-4 w-1/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-16 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
  </div></div>;
}
