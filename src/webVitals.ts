import {
  FirstInputPolyfillEntry,
  onCLS,
  onFID,
  onLCP,
  onTTFB,
  onINP,
  ReportCallback as WebVitalsReportHandler,
  Metric as WebVitalsMetrics,
  ReportOpts as WebVitalsReportOps,
} from "web-vitals";
import { getElementName, getNetworkType } from "./base";
import { onReportOnSPA, storeReportParams } from "./spa";
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

// TODO: Remove `experimental_useSPA` when the following issue is resolved.
// https://github.com/GoogleChrome/web-vitals/issues/119
type ReportOpts = WebVitalsReportOps & { experimental_useSpa?: boolean };

export const reportCLS: Report<
  CLSReportParams,
  Pick<ReportOpts, "reportAllChanges" | "experimental_useSpa">
> = (report, options) => {
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
    if (options?.experimental_useSpa) {
      storeReportParams(name, delta, [
        {
          metricsName: name,
          metricsValue: delta,
          selectorName: elementName,
          networkType: getNetworkType(),
          rectDiff,
        },
      ]);
    } else {
      report({
        metricsName: name,
        metricsValue: delta,
        selectorName: elementName,
        networkType: getNetworkType(),
        rectDiff,
      });
    }
  };

  if (options?.experimental_useSpa) {
    onReportOnSPA((params) => {
      if (params.metricsName !== "CLS") {
        return;
      }
      report(params);
    });
  }

  onCLS(handleReportHandler(reportHandler), {
    ...options,
    reportAllChanges: options?.reportAllChanges || options?.experimental_useSpa,
  });
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

export const reportINP: Report<
  INPReportParams,
  Pick<
    ReportOpts,
    "reportAllChanges" | "durationThreshold" | "experimental_useSpa"
  >
> = (report, options) => {
  const reportHandler: ReportHandler = (metrics) => {
    if (metrics.name !== SupportedMetrics.INP) {
      return;
    }

    const { name, entries, delta } = metrics;

    const result = entries.map((entry) => {
      const elementName = getElementName(entry.target);
      return {
        metricsName: name,
        metricsValue: delta,
        selectorName: elementName,
        networkType: getNetworkType(),
      };
    });

    if (options?.experimental_useSpa) {
      storeReportParams(name, delta, result);
    } else {
      result.forEach((p) => report(p));
    }
  };

  if (options?.experimental_useSpa) {
    onReportOnSPA((params) => {
      if (params.metricsName !== "INP") {
        return;
      }
      report(params);
    });
  }

  onINP(handleReportHandler(reportHandler), {
    ...options,
    reportAllChanges: options?.reportAllChanges || options?.experimental_useSpa,
  });
};
