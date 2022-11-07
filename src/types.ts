import type {
  CLSAttribution,
  FIDAttribution,
  INPAttribution,
  LCPAttribution,
  TTFBAttribution,
} from "web-vitals";

export const SupportedMetrics = {
  LCP: "LCP",
  CLS: "CLS",
  FID: "FID",
  TTFB: "TTFB",
  INP: "INP",
} as const;

// This is unstable property, this should be used only for debug.
// If you want to monitor these values, please consider to add a new property to the `ReportParams` as stable property.
type Debug<T extends keyof typeof SupportedMetrics> = {
  attribution: T extends "LCP"
    ? LCPAttribution
    : T extends "CLS"
    ? CLSAttribution
    : T extends "FID"
    ? FIDAttribution
    : T extends "TTFB"
    ? TTFBAttribution
    : T extends "INP"
    ? INPAttribution
    : never;
};

type SharedReportParams<T extends keyof typeof SupportedMetrics> = {
  metricsName: T;
  metricsValue: number;
  networkType: string;
  country?: string;
  debug: Debug<T>;
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
