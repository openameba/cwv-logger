import {
  FirstInputPolyfillEntry,
  onCLS,
  onFID,
  onLCP,
  onTTFB,
  onINP,
  Metric as WebVitalsMetrics,
  ReportOpts,
  LCPAttribution,
  FIDAttribution,
  CLSAttribution,
  INPAttribution,
  TTFBAttribution,
  MetricWithAttribution,
} from "web-vitals/attribution";
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
  attribution: LCPAttribution;
};

type FirstInputDelay = {
  name: typeof SupportedMetrics.FID;
  entries: FirstInputPolyfillEntry[];
  attribution: FIDAttribution;
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
  attribution: CLSAttribution;
};

type TimeToFirstByte = {
  name: typeof SupportedMetrics.TTFB;
  attribution: TTFBAttribution;
};

type InteractionToNextPaint = {
  name: typeof SupportedMetrics.INP;
  entries: FirstInputPolyfillEntry[];
  attribution: INPAttribution;
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
function getRectDiff(source: LayoutShiftAttribution | undefined) {
  if (!source) {
    return;
  }
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
      return largestSource as LayoutShiftAttribution;
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
const handleReportHandler = <
  Handler extends (metrics: MetricWithAttribution) => void
>(
  f: ReportHandler
) => f as unknown as Handler;

export const reportCLS: Report<CLSReportParams> = (report) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportedMetrics.CLS) {
      return;
    }

    const { name, delta, entries, attribution } = metrics;

    /**
     * To analyze CLS by using some analytics tools, the reported data should be aggregated with largest layout shift source.
     * @see https://web.dev/debug-web-vitals-in-the-field/#cls
     */
    const largestSource =
      attribution.largestShiftSource || getLargestLayoutShiftSource(entries);
    if (!largestSource) {
      return;
    }
    const elementName = getElementName(largestSource.node);
    const rectDiff = getRectDiff(largestSource);
    report({
      metricsName: name,
      metricsValue: delta,
      selectorName: attribution.largestShiftTarget || elementName,
      networkType: getNetworkType(),
      rectDiff,
      debug: {
        attribution,
      },
    });
  };
  onCLS(handleReportHandler(reportHandler));
};

export const reportLCP: Report<LCPReportParams> = (report) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportedMetrics.LCP) {
      return;
    }

    const { name, entries, delta, attribution } = metrics;

    entries.map((entry) => {
      const elementName = getElementName(entry.element);
      report({
        metricsName: name,
        metricsValue: delta,
        selectorName: attribution.element || elementName,
        networkType: getNetworkType(),
        debug: {
          attribution,
        },
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

    const { name, entries, delta, attribution } = metrics;

    entries.map((entry) => {
      const elementName = getElementName(entry.target);
      report({
        metricsName: name,
        metricsValue: delta,
        selectorName: attribution.eventTarget || elementName,
        networkType: getNetworkType(),
        debug: {
          attribution,
        },
      });
    });
  };

  onFID(handleReportHandler(reportHandler));
};

export const reportTTFB: Report<TTFBReportParams> = (report) => {
  const reportHandler: ReportHandler = ({ name, delta, attribution }) => {
    if (name !== SupportedMetrics.TTFB) {
      return;
    }

    report({
      metricsName: name,
      metricsValue: delta,
      networkType: getNetworkType(),
      debug: {
        attribution,
      },
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

    const { name, entries, delta, attribution } = metrics;

    entries.map((entry) => {
      const elementName = getElementName(entry.target);
      report({
        metricsName: name,
        metricsValue: delta,
        selectorName: attribution.eventTarget || elementName,
        networkType: getNetworkType(),
        debug: {
          attribution,
        },
      });
    });
  };

  onINP(handleReportHandler(reportHandler), option);
};
