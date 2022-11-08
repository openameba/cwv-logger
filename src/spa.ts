/**
 * ページ間で最大の値を計算するようなパフォーマンス指標の場合、ページがinvisibleになるまでレポートされない。
 * 特にSPAの場合、ページ遷移したとしてもinvisible扱いにならないのでレポートされない。
 * また、パフォーマンスに問題のあるDOMがレポートされたとしても、SPA遷移によって対象のDOMが消えてしまいnullがレポートされてしまうことがよく起こる。
 * そのため、このような指標は、reportAllChangesで計測し、値をMemoryに保存しておき、invisibleとSPA遷移のタイミングでレポートする。
 */

import { CLSReportParams, INPReportParams } from "./types";
import { ReportCallback } from "./webVitals";

type AccumulatedReportParams = CLSReportParams | INPReportParams;

type ReportParamsMemoryType<
  T extends AccumulatedReportParams = AccumulatedReportParams
> = {
  [K in T["metricsName"]]: K extends T["metricsName"]
    ? { metrics: number; params: { [P in keyof T]: T[P] }[] } | undefined
    : never;
};
const ReportParamsMemory: ReportParamsMemoryType = {
  CLS: undefined,
  INP: undefined,
};

const flushReportParamsMemory = (
  metricsName: keyof typeof ReportParamsMemory
) => {
  ReportParamsMemory[metricsName] = undefined;
};

const shouldReportMemory = (
  memory: typeof ReportParamsMemory[keyof typeof ReportParamsMemory]
) => !!memory && Object.keys(memory).length;

// memoryを重複して編集しないために、他のイベントで`reportReportParamsMemory`が走っているときは処理を止める
let runningReport = false;
const reportReportParamsMemory = (
  cb: ReportCallback<AccumulatedReportParams>
) => {
  if (runningReport) {
    return;
  }
  runningReport = true;

  (
    Object.keys(ReportParamsMemory) as (keyof typeof ReportParamsMemory)[]
  ).forEach((metricsName) => {
    const params = ReportParamsMemory[metricsName];
    if (params && shouldReportMemory(params)) {
      params.params.forEach((p) => {
        cb(p);
      });
      flushReportParamsMemory(metricsName);
    }
  });

  runningReport = false;
};

export const storeReportParams = (
  metricsName: keyof ReportParamsMemoryType,
  metrics: number,
  reportParams: AccumulatedReportParams[]
) => {
  const params = ReportParamsMemory[metricsName];
  if (!params || Math.max(params.metrics, metrics)) {
    ReportParamsMemory[metricsName] = {
      metrics,
      params: reportParams,
    };
  }
};

// @see https://github.com/GoogleChrome/web-vitals/blob/7f0ed0bfb03c356e348a558a3eda111b498a2a11/src/lib/onHidden.ts
interface OnHiddenCallback {
  (event: Event): void;
}
const onHidden = (cb: OnHiddenCallback) => {
  const onHiddenOrPageHide = (event: Event) => {
    if (event.type === "pagehide" || document.visibilityState === "hidden") {
      cb(event);
    }
  };
  window.addEventListener("visibilitychange", onHiddenOrPageHide, true);
  // Some browsers have buggy implementations of visibilitychange,
  // so we use pagehide in addition, just to be safe.
  window.addEventListener("pagehide", onHiddenOrPageHide, true);
};

export const onReportOnSPA = (cb: ReportCallback<AccumulatedReportParams>) => {
  onHidden(() => {
    reportReportParamsMemory(cb);
  });
  window.addEventListener("popstate", () => {
    reportReportParamsMemory(cb);
  });
};
