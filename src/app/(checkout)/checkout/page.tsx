import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout/CheckoutForm";
import { getPublicSettings } from "@/server/services/settings.service";
import { getServerEnv } from "@/server/env";

export const metadata: Metadata = { title: "Thanh toán | Cham.stu" };
export default async function CheckoutPage() {
  const settings = await getPublicSettings();
  return <CheckoutForm bankTransferEnabled={settings.bankTransferEnabled} shopPhone={settings.shop.phone} emailEnabled={getServerEnv().EMAIL_DELIVERY !== "disabled"} />;
}
