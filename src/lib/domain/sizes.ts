export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Freesize"];
export function sortSizes(sizes: readonly string[]): string[] {
  return [...new Set(sizes)].sort((a, b) => {
    const first = SIZE_ORDER.indexOf(a), second = SIZE_ORDER.indexOf(b);
    if (first >= 0 && second >= 0) return first - second;
    if (first >= 0) return -1;
    if (second >= 0) return 1;
    return a.localeCompare(b, "en");
  });
}
