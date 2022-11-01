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

type LCPReportParams = SharedReportParams<"LCP"> &
  InteractiveMetricsReportParams;
type FIDReportParams = SharedReportParams<"FID"> &
  InteractiveMetricsReportParams;
type INPReportParams = SharedReportParams<"INP"> &
  InteractiveMetricsReportParams;
type CLSReportParams = SharedReportParams<"CLS"> &
  InteractiveMetricsReportParams & {
    rectDiff?: string;
  };
type TTFBReportParams = SharedReportParams<"TTFB">;

export type ReportParams =
  | LCPReportParams
  | FIDReportParams
  | INPReportParams
  | CLSReportParams
  | TTFBReportParams;
