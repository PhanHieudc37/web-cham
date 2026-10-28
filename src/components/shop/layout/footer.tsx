import Link from "next/link";
import type { PublicSettingsDTO } from "@/types/dto";
import { ShopImage } from "../common/shop-image";
import { SocialLinks } from "./social-links";

export function Footer({ settings }: { settings: PublicSettingsDTO }) {
  const { shop, social, legal } = settings;
  const contact = Boolean(shop.address || shop.phone || shop.email || shop.workingHours);
  const hasLegal = Boolean(legal.businessName || legal.taxCode || legal.businessAddress || (legal.bctBadgeUrl && legal.bctNotificationUrl));
  return <footer className="mt-12 bg-fg py-14 text-sm text-white md:mt-[72px]">
    <div className="shop-container">
      <div className="grid gap-x-9 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" aria-label={`${shop.name} — Trang chủ`} className="text-2xl font-bold tracking-[-0.06em]">{shop.logoUrl ? <span className="relative block h-12 w-36 bg-white"><ShopImage src={shop.logoUrl} alt={shop.name} sizes="144px" className="object-contain" /></span> : shop.name.toUpperCase()}</Link>
          {shop.description && <p className="mt-4 whitespace-pre-line text-xs leading-7 text-white/65">{shop.description}</p>}
          <div className="mt-5"><SocialLinks social={social} /></div>
        </div>
        {contact && <div><h2 className="mb-5 text-xs font-semibold tracking-[0.08em] uppercase">Thông tin liên hệ</h2><address className="space-y-3 text-xs leading-6 not-italic text-white/65">
          {shop.address && <p>{shop.address}</p>}
          {shop.phone && <a href={`tel:${shop.phone}`} className="block hover:text-white">{shop.phone}</a>}
          {shop.email && <a href={`mailto:${shop.email}`} className="block break-all hover:text-white">{shop.email}</a>}
          {shop.workingHours && <p>{shop.workingHours}</p>}
        </address></div>}
        <div><h2 className="mb-5 text-xs font-semibold tracking-[0.08em] uppercase">Chính sách</h2><ul className="space-y-3 text-xs text-white/65">
          {[["Đổi trả", "/chinh-sach-doi-tra"], ["Bảo mật", "/chinh-sach-bao-mat"], ["Điều khoản dịch vụ", "/dieu-khoan-dich-vu"], ["Hướng dẫn chọn size", "/huong-dan-chon-size"], ["Kiểm tra đơn hàng", "/kiem-tra-don-hang"]].map(([label, href]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}
        </ul></div>
        <div><h2 className="mb-5 text-xs font-semibold tracking-[0.08em] uppercase">Về {shop.name}</h2><ul className="space-y-3 text-xs text-white/65">
          {[["Giới thiệu", "/gioi-thieu"], ["Liên hệ", "/lien-he"], ["Tìm kiếm", "/search"]].map(([label, href]) => <li key={href}><Link href={href} className="hover:text-white">{label}</Link></li>)}
        </ul></div>
      </div>
      {hasLegal && <div className="mt-10 space-y-2 border-t border-white/15 pt-6 text-xs text-white/65" aria-label="Thông tin pháp lý">
        {legal.businessName && <p>{legal.businessName}</p>}{legal.taxCode && <p>Mã số thuế: {legal.taxCode}</p>}{legal.businessAddress && <p>{legal.businessAddress}</p>}
        {legal.bctBadgeUrl && legal.bctNotificationUrl && <a href={legal.bctNotificationUrl} target="_blank" rel="noopener noreferrer" className="relative mt-4 block h-16 w-44"><ShopImage src={legal.bctBadgeUrl} alt="Thông báo Bộ Công Thương" sizes="176px" className="object-contain object-left" /></a>}
      </div>}
      <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-[11px] text-white/50 md:flex-row md:justify-between">
        <p>© {new Date().getFullYear()} {shop.name}. All rights reserved.</p>
        <p>Thanh toán: COD{settings.bankTransferEnabled ? " · Chuyển khoản" : ""}</p>
      </div>
    </div>
  </footer>;
}
