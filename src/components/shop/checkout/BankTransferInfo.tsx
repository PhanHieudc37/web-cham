import Image from "next/image";
import { vietQrUrl } from "@/lib/vietqr";
import { formatPrice } from "@/lib/format";
import type { OrderSuccessDTO } from "@/types/dto";
import { CopyButton } from "../common/CopyButton";

export function BankTransferInfo({ order }: { order: OrderSuccessDTO }) {
  if (order.paymentMethod !== "bank_transfer" || order.paymentStatus !== "unpaid") return null;
  const bank = order.bank;
  if (!bank) return <p className="border p-5 text-sm leading-7">Thông tin chuyển khoản đang được cập nhật. Vui lòng liên hệ shop trước khi thanh toán.</p>;
  return <section aria-label="Thông tin chuyển khoản" className="mt-8 min-w-0 border p-5 sm:p-8"><h2 className="text-center text-base font-semibold tracking-wider">CHUYỂN KHOẢN NGÂN HÀNG</h2><Image src={vietQrUrl(bank, order.total, order.code)} alt={`Mã VietQR thanh toán đơn ${order.code}`} width={400} height={500} unoptimized referrerPolicy="no-referrer" className="mx-auto my-5 h-auto w-full max-w-[320px]" /><dl className="space-y-4 text-sm"><div><dt className="text-xs text-muted">Ngân hàng</dt><dd className="mt-1 wrap-anywhere">{bank.bankName}</dd></div><div><dt className="text-xs text-muted">Số tài khoản</dt><dd className="flex flex-wrap items-center gap-2"><span className="wrap-anywhere font-medium">{bank.accountNo}</span><CopyButton value={bank.accountNo} label="số tài khoản" /></dd></div><div><dt className="text-xs text-muted">Chủ tài khoản</dt><dd className="mt-1 wrap-anywhere">{bank.accountName}</dd></div><div><dt className="text-xs text-muted">Số tiền</dt><dd className="flex flex-wrap items-center gap-2"><strong>{formatPrice(order.total)}</strong><CopyButton value={String(order.total)} label="số tiền" /></dd></div><div><dt className="text-xs text-muted">Nội dung chuyển khoản</dt><dd className="flex flex-wrap items-center gap-2"><strong className="wrap-anywhere">{order.code}</strong><CopyButton value={order.code} label="nội dung chuyển khoản" /></dd></div></dl><p className="mt-5 text-xs leading-6">Vui lòng ghi đúng nội dung chuyển khoản để shop xác nhận nhanh.</p></section>;
}
