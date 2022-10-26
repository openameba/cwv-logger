export const SupportedMetrics = {
  LCP: "LCP",
  CLS: "CLS",
  FID: "FID",
  TTFB: "TTFB",
  INP: "INP",
} as const;

type SupportedMetricsNames<
  P extends keyof typeof SupportedMetrics = keyof typeof SupportedMetrics,
  V = Pick<typeof SupportedMetrics, P>
> = V[keyof V];

export type BaseReportParams<MetricsName extends SupportedMetricsNames> = {
  metricsName: MetricsName;
  metricsValue: number;
  networkType: string;
  country?: string;
  selectorName?: string;
  rectDiff?: string;
};

export type ReportParams =
  | BaseReportParams<SupportedMetricsNames<"CLS" | "FID" | "TTFB" | "LCP">>
  | (BaseReportParams<SupportedMetricsNames<"INP">> & { eventName?: string });
