"use client";
import { useState } from "react";
import type { Settings, SettingsFormOutput } from "@/lib/validation/settings";
import { useHydrated } from "@/hooks/use-hydrated";
import { SettingForm } from "./setting-form";

const tabs = [{ id: "shop", name: "Thông tin shop" }, { id: "social", name: "Mạng xã hội" }, { id: "communication", name: "Thông báo & cam kết" }, { id: "shipping", name: "Vận chuyển" }, { id: "bank", name: "Thanh toán" }, { id: "legal", name: "Pháp lý" }, { id: "orders", name: "Đơn hàng" }, { id: "seo", name: "SEO" }] as const;
type Tab = (typeof tabs)[number]["id"];
export function SettingsView({ settings }: { settings: Settings }) {
  const [tab, setTab] = useState<Tab>("shop"), [current, setCurrent] = useState(settings);
  const hydrated = useHydrated();
  function switchTab(next: Tab) {
    if (next === tab) return;
    if (document.querySelector('[data-setting-busy="true"]')) return;
    if (document.querySelector('[data-setting-dirty="true"]') && !window.confirm("Bạn có thay đổi chưa lưu. Bạn muốn đổi tab?")) return;
    setTab(next);
  }
  function saved(result: SettingsFormOutput) { setCurrent((previous) => ({ ...previous, [result.key]: result.value })); }
  return <div data-content-ready={hydrated} className="space-y-6"><div><p className="mb-2 text-[10px] tracking-[0.18em] text-stone-400">CỬA HÀNG / CÀI ĐẶT</p><h1 className="text-2xl font-semibold md:text-3xl">Cài đặt cửa hàng</h1><p className="mt-2 text-sm text-stone-500">Thông tin shop, vận chuyển và thanh toán ở cùng một nơi.</p></div><div className="grid items-start gap-6 lg:grid-cols-[190px_minmax(0,1fr)]"><nav aria-label="Nhóm cài đặt" className="flex flex-wrap gap-2 lg:flex-col lg:rounded-md lg:border lg:bg-white lg:p-2">{tabs.map((item) => <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined} className={`min-h-11 rounded-md px-3 py-2 text-left text-xs ${tab === item.id ? "bg-stone-900 text-white" : "border bg-white text-stone-500 hover:bg-stone-50 lg:border-transparent"}`} onClick={() => switchTab(item.id)}>{item.name}</button>)}</nav><div key={tab} className="min-w-0 space-y-6">{tab === "communication" ? <><SettingForm settingKey="announcements" initialValue={current.announcements} onSaved={saved} /><SettingForm settingKey="policies" initialValue={current.policies} onSaved={saved} /><SettingForm settingKey="returnPolicySummary" initialValue={current.returnPolicySummary} onSaved={saved} /></> : <SettingForm settingKey={tab} initialValue={current[tab]} onSaved={saved} />}<p className="text-xs leading-6 text-stone-400">Thông tin chưa có có thể để trống. Chỉ hiển thị các kênh liên hệ và thông tin pháp lý mà shop đã cung cấp.</p></div></div></div>;
}
