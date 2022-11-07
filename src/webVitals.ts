import {
  FirstInputPolyfillEntry,
  onCLS,
  onFID,
  onLCP,
  onTTFB,
  onINP,
  ReportCallback as WebVitalsReportHandler,
  Metric as WebVitalsMetrics,
  ReportOpts,
} from "web-vitals";
import { getElementName, getNetworkType } from "./base";
import {
  CLSReportParams,
  FIDReportParams,
  INPReportParams,
  LCPReportParams,
  ReportParams,
  SupportedMetrics,
  TTFBReportParams,
} from "./types";

type BaseMetrics = Pick<WebVitalsMetrics, "delta">;

type LargestContentfulPaint = {
  name: typeof SupportedMetrics.LCP;
  entries: ({
    element?: Element;
  } & PerformanceEntry)[];
};

type FirstInputDelay = {
  name: typeof SupportedMetrics.FID;
  entries: FirstInputPolyfillEntry[];
};

const CLS_RECT_PROPERTIES = ["width", "height", "x", "y"] as const;
type CLSEntryRect = { [K in typeof CLS_RECT_PROPERTIES[number]]: number };

type CumulativeLayoutShift = {
  name: typeof SupportedMetrics.CLS;
  entries: ({
    value: number;
    sources: {
      node?: Element;
      currentRect: CLSEntryRect;
      previousRect: CLSEntryRect;
    }[];
  } & PerformanceEntry)[];
};

type TimeToFirstByte = {
  name: typeof SupportedMetrics.TTFB;
};

type InteractionToNextPaint = {
  name: typeof SupportedMetrics.INP;
  entries: FirstInputPolyfillEntry[];
};

type Metrics = BaseMetrics &
  (
    | LargestContentfulPaint
    | FirstInputDelay
    | CumulativeLayoutShift
    | TimeToFirstByte
    | InteractionToNextPaint
  );

/**
 * CLSの発生前後の差分を返す
 * @returns {string} elementName:width,height,x,y(, sources分繰り返し)
 */
function getRectDiff(
  source: CumulativeLayoutShift["entries"][number]["sources"][number]
) {
  const { currentRect, previousRect } = source;
  const rectDiff: string[] = [];
  CLS_RECT_PROPERTIES.forEach((property) => {
    const diff = currentRect[property] - previousRect[property];
    rectDiff.push(`${diff}`);
  });
  return rectDiff.join(",");
}

function getLargestLayoutShiftSource(
  entries: CumulativeLayoutShift["entries"]
) {
  if (!entries.length) {
    return null;
  }
  const largestEntry = entries.reduce((a, b) => {
    return a && a.value > b.value ? a : b;
  });

  if (largestEntry && largestEntry.sources && largestEntry.sources.length) {
    const largestSource = largestEntry.sources.reduce((a, b) => {
      return a.node &&
        a.previousRect.width * a.previousRect.height >
          b.previousRect.width * b.previousRect.height
        ? a
        : b;
    });
    if (largestSource) {
      return largestSource;
    }
  }
  return null;
}

export type ReportCallback<P extends ReportParams> = (params: P) => void;

type Report<P extends ReportParams, Option = unknown> = (
  report: ReportCallback<P>,
  option?: Option
) => void;

type ReportHandler = (metrics: Metrics) => void;

// web-vitalsの型定義が微妙なので独自の型定義を使います。
// その際に既存の型定義と合わせるために、この関数を挟むようにします。
const handleReportHandler = (f: ReportHandler) => f as WebVitalsReportHandler;

export const reportCLS: Report<CLSReportParams> = (report) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportedMetrics.CLS) {
      return;
    }

    const { name, delta, entries } = metrics;

    /**
     * To analyze CLS by using some analytics tools, the reported data should be aggregated with largest layout shift source.
     * @see https://web.dev/debug-web-vitals-in-the-field/#cls
     */
    const largestSource = getLargestLayoutShiftSource(entries);
    if (!largestSource) {
      return;
    }
    const elementName = getElementName(largestSource.node);
    const rectDiff = getRectDiff(largestSource);
    report({
      metricsName: name,
      metricsValue: delta,
      selectorName: elementName,
      networkType: getNetworkType(),
      rectDiff,
    });
  };
  onCLS(handleReportHandler(reportHandler));
};

export const reportLCP: Report<LCPReportParams> = (report) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportedMetrics.LCP) {
      return;
    }

    const { name, entries, delta } = metrics;

    entries.map((entry) => {
      const elementName = getElementName(entry.element);
      report({
        metricsName: name,
        metricsValue: delta,
        selectorName: elementName,
        networkType: getNetworkType(),
      });
    });
  };
  onLCP(handleReportHandler(reportHandler));
};

export const reportFID: Report<FIDReportParams> = (report) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportedMetrics.FID) {
      return;
    }

    const { name, entries, delta } = metrics;

    entries.map((entry) => {
      const elementName = getElementName(entry.target);
      report({
        metricsName: name,
        metricsValue: delta,
        selectorName: elementName,
        networkType: getNetworkType(),
      });
    });
  };

  onFID(handleReportHandler(reportHandler));
};

export const reportTTFB: Report<TTFBReportParams> = (report) => {
  const reportHandler: ReportHandler = ({ name, delta }) => {
    if (name !== SupportedMetrics.TTFB) {
      return;
    }

    report({
      metricsName: name,
      metricsValue: delta,
      networkType: getNetworkType(),
    });
  };
  onTTFB(handleReportHandler(reportHandler));
};

export const reportINP: Report<INPReportParams, ReportOpts> = (
  report,
  option
) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportedMetrics.INP) {
      return;
    }

    const { name, entries, delta } = metrics;

    entries.map((entry) => {
      const elementName = getElementName(entry.target);
      report({
        metricsName: name,
        metricsValue: delta,
        selectorName: elementName,
        networkType: getNetworkType(),
      });
    });
  };

  onINP(handleReportHandler(reportHandler), option);
};
