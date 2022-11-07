export const SupportedMetrics = {
  LCP: "LCP",
  CLS: "CLS",
  FID: "FID",
  TTFB: "TTFB",
  INP: "INP",
} as const;

type SharedReportParams<T extends keyof typeof SupportedMetrics> = {
  metricsName: T;
  metricsValue: number;
  networkType: string;
  country?: string;
};

type InteractiveMetricsReportParams = {
  selectorName?: string;
};

export type LCPReportParams = SharedReportParams<"LCP"> &
  InteractiveMetricsReportParams;
export type FIDReportParams = SharedReportParams<"FID"> &
  InteractiveMetricsReportParams;
export type INPReportParams = SharedReportParams<"INP"> &
  InteractiveMetricsReportParams;
export type CLSReportParams = SharedReportParams<"CLS"> &
  InteractiveMetricsReportParams & {
    rectDiff?: string;
  };
export type TTFBReportParams = SharedReportParams<"TTFB">;

export type ReportParams =
  | LCPReportParams
  | FIDReportParams
  | INPReportParams
  | CLSReportParams
  | TTFBReportParams;
