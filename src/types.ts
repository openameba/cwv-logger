export const SupportMetrics = {
  LCP: "LCP",
  CLS: "CLS",
  FID: "FID",
  TTFB: "TTFB",
} as const;

export type ReportParams = {
  metricsName: keyof typeof SupportMetrics;
  metricsValue: number;
  networkType: string;
  country?: string;
  selectorName?: string;
  rectDiff?: string;
};
