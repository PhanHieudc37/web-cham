import type { ProductDetailDTO } from "@/types/dto";

export function SizeChartTable({ chart }: { chart: ProductDetailDTO["sizeChart"] }) {
  if (!chart) return <p className="text-sm leading-7 text-muted">Bảng kích thước đang được cập nhật.</p>;
  return <div className="min-w-0"><p className="mb-3 text-sm font-medium">{chart.name}</p>
    <div className="max-w-full overflow-x-auto"><table className="w-full border-collapse text-left text-xs"><caption className="sr-only">{chart.name}</caption>
      <thead><tr>{chart.columns.map((column, index) => <th key={index} scope="col" className="border bg-surface px-3 py-3 font-medium whitespace-nowrap">{column}</th>)}</tr></thead>
      <tbody>{chart.rows.map((row, index) => <tr key={index}>{row.map((value, column) => column === 0 ? <th key={column} scope="row" className="border px-3 py-3 font-medium whitespace-nowrap">{value}</th> : <td key={column} className="border px-3 py-3 whitespace-nowrap">{value}</td>)}</tr>)}</tbody>
    </table></div>
    {chart.note && <p className="mt-4 whitespace-pre-line text-xs leading-6 text-muted">{chart.note}</p>}
  </div>;
}
