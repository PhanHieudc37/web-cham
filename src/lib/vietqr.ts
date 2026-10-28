export function vietQrUrl(bank: { bankBin: string; accountNo: string; accountName: string }, amount: number, code: string): string {
  if (!/^\d{6}$/.test(bank.bankBin) || !/^[a-zA-Z0-9]+$/.test(bank.accountNo) || !Number.isSafeInteger(amount) || amount < 0) throw new Error("Thông tin mã QR không hợp lệ");
  const url = new URL(`https://img.vietqr.io/image/${encodeURIComponent(bank.bankBin)}-${encodeURIComponent(bank.accountNo)}-compact2.png`);
  url.search = new URLSearchParams({ amount: String(amount), addInfo: code, accountName: bank.accountName }).toString();
  return url.toString();
}
