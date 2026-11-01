export type PerformanceSample = {
  round: number;
  ttfbMs: number | null;
  contentMs: number;
  appRequests: number;
  status: number | null;
  cacheStatus: string | null;
  age: string | null;
};

export function percentile(values: number[], fraction: number): number | null {
  if (!values.length) return null;
  if (values.some((value) => !Number.isFinite(value)) || fraction < 0 || fraction > 1) throw new RangeError("Invalid measurements");
  const ordered = [...values].sort((left, right) => left - right);
  if (fraction === 0.5) {
    const middle = Math.floor(ordered.length / 2);
    return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  }
  return ordered[Math.max(0, Math.ceil(fraction * ordered.length) - 1)];
}

export function isApplicationRequest(url: string, origin: string, resourceType: string): boolean {
  const target = new URL(url);
  return target.origin === origin && ["document", "fetch", "xhr"].includes(resourceType)
    && !target.pathname.startsWith("/_next/")
    && !/\.(?:js|css|woff2?|png|jpe?g|webp|svg|ico|map)$/i.test(target.pathname);
}

export function summarizePerformance(samples: PerformanceSample[]) {
  const ttfb = samples.flatMap((sample) => sample.ttfbMs === null ? [] : [sample.ttfbMs]);
  return {
    ttfbMedian: percentile(ttfb, 0.5), ttfbP90: percentile(ttfb, 0.9),
    contentMedian: percentile(samples.map((sample) => sample.contentMs), 0.5),
    contentP90: percentile(samples.map((sample) => sample.contentMs), 0.9),
    requestMedian: percentile(samples.map((sample) => sample.appRequests), 0.5),
    requestP90: percentile(samples.map((sample) => sample.appRequests), 0.9),
  };
}
