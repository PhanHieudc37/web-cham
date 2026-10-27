import "server-only";

export const defaultSettings = {
  shop: { name: "Cham.stu", description: "", logoUrl: null, phone: "", zaloPhone: "", email: "", address: "", workingHours: "" },
  social: { facebook: "", messenger: "", instagram: "", tiktok: "", shopee: "https://shopee.vn/cham.stu" },
  announcements: ["Miễn phí vận chuyển cho đơn từ 3 sản phẩm"],
  policies: [
    { icon: "truck", text: "Freeship đơn từ 3 sản phẩm" }, { icon: "refresh", text: "Đổi size trong 7 ngày" },
    { icon: "wallet", text: "Thanh toán khi nhận hàng" }, { icon: "message", text: "Hỗ trợ qua Zalo / Messenger" },
  ],
  returnPolicySummary: "",
  shipping: { fee: 30000, freeShipMinItems: 3, freeShipMinAmount: null },
  bank: { bankBin: "", bankName: "", accountNo: "", accountName: "" },
  legal: { businessName: "", taxCode: "", businessAddress: "", bctNotificationUrl: "", bctBadgeUrl: "" },
  orders: { codePrefix: "CS", autoCancelUnpaidHours: 48, lowStockThreshold: 3, maxQtyPerLine: 10 },
  seo: { defaultTitle: "Cham.stu", defaultDescription: "", ogImageUrl: null },
};
