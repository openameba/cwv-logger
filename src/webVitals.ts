import {
  FirstInputPolyfillEntry,
  getCLS,
  getFID,
  getLCP,
  getTTFB,
  ReportHandler as WebVitalsReportHandler,
  Metric as WebVitalsMetrics,
} from "web-vitals";
import { getElementName, getNetworkType } from "./base";
import { ReportParams, SupportMetrics } from "./types";

type BaseMetrics = Pick<WebVitalsMetrics, "delta">;

type LargestContentfulPaint = {
  name: typeof SupportMetrics.LCP;
  entries: ({
    element?: Element;
  } & PerformanceEntry)[];
};

type FirstInputDelay = {
  name: typeof SupportMetrics.FID;
  entries: FirstInputPolyfillEntry[];
};

const CLS_RECT_PROPERTIES = ["width", "height", "x", "y"] as const;
type CLSEntryRect = { [K in typeof CLS_RECT_PROPERTIES[number]]: number };

type CumulativeLayoutShift = {
  name: typeof SupportMetrics.CLS;
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
  name: typeof SupportMetrics.TTFB;
};

type Metrics = BaseMetrics &
  (
    | LargestContentfulPaint
    | FirstInputDelay
    | CumulativeLayoutShift
    | TimeToFirstByte
  );

/**
 * CLSの発生前後の差分を返す
 * @param {String} elementName
 * @param {Array} source
 * @returns {string} elementName:width,height,x,y(, sources分繰り返し)
 */
function getRectDiff(
  elementName: string,
  source: CumulativeLayoutShift["entries"][number]["sources"][number]
) {
  const { currentRect, previousRect } = source;
  const rectDiff: string[] = [];
  CLS_RECT_PROPERTIES.forEach((property) => {
    const diff = currentRect[property] - previousRect[property];
    rectDiff.push(`${diff}`);
  });
  return `${elementName}:${rectDiff.join(",")}`;
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

export type ReportCallback = (params: ReportParams) => void;

type Report = (report: ReportCallback) => void;

type ReportHandler = (metrics: Metrics) => void;

// web-vitalsの型定義が微妙なので独自の型定義を使います。
// その際に既存の型定義と合わせるために、この関数を挟むようにします。
const handleReportHandler = (f: ReportHandler) => f as WebVitalsReportHandler;

export const reportCLS: Report = (report) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportMetrics.CLS) {
      return;
    }

    const { name, entries, delta } = metrics;

    const largestSource = getLargestLayoutShiftSource(entries);
    if (!largestSource) {
      return;
    }
    const elementName = getElementName(largestSource.node);
    const rectDiff = getRectDiff(elementName, largestSource);
    report({
      metricsName: name,
      metricsValue: delta,
      selectorName: elementName,
      networkType: getNetworkType(),
      rectDiff,
    });
  };
  getCLS(handleReportHandler(reportHandler));
};

export const reportLCP: Report = (report) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportMetrics.LCP) {
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
  getLCP(handleReportHandler(reportHandler));
};

export const reportFID: Report = (report) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportMetrics.FID) {
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

  getFID(handleReportHandler(reportHandler));
};

export const reportTTFB: Report = (report) => {
  const reportHandler: ReportHandler = ({ name, delta }) => {
    if (name !== SupportMetrics.TTFB) {
      return;
    }

    report({
      metricsName: name,
      metricsValue: delta,
      networkType: getNetworkType(),
    });
  };
  getTTFB(handleReportHandler(reportHandler));
};
