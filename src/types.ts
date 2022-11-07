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
