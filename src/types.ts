export const SupportedMetrics = {
  LCP: "LCP",
  CLS: "CLS",
  FID: "FID",
  TTFB: "TTFB",
} as const;

export type ReportParams = {
  metricsName: keyof typeof SupportedMetrics;
  metricsValue: number;
  networkType: string;
  country?: string;
  selectorName?: string;
  rectDiff?: string;
};
