# cwv-logger

[web-vitals](https://github.com/GoogleChrome/web-vitals/tree/next)から取得した Core Web Vitals のメトリクスをデータとして使いやすい形式に変換して出力するライブラリです。

## Installation

```sh
yarn add -D cwv-logger
```

or

```
npm i --save-dev cwv-logger
```

## Usage

```ts
const reportPerformance = () => {
  const startTime = Date.now();

  const handleReport: ReportCallback = useCallback(
    ({ metricsName, metricsValue, networkType, selectorName, rectDiff }) => {
      firebase
        .performance()
        .trace(params.metricsName)
        .record(startTime, params.metricsValue, {
          selectorName,
          networkType,
          rectDiff,
        });
    },
    [option]
  );

  import("../../helpers/performance").then(
    ({ reportCLS, reportFID, reportLCP, reportTTFB }) => {
      reportCLS(handleReport);
      reportFID(handleReport);
      reportLCP(handleReport);
      reportTTFB(handleReport);
    }
  );
};
```

## Supported Metrics

- [Cumulative Layout Shift(CLS)](https://web.dev/cls/)
- [Largest Contentful Paint(LCP)](https://web.dev/lcp/)
- [First Input Delay(FID)](https://web.dev/fid/)
- [Time to First Byte(TTFB)](https://web.dev/ttfb/)

## Report params

```ts
type ReportParams = {
  metricsName: "CLS" | "LCP" | "FID" | "TTFB";
  metricsValue: number;
  // Get value from https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType.
  networkType: string;
  // Currently not supported
  country?: string;
  // Available with CLS, LCP and FID.
  selectorName?: string;
  // Available only with CLS.
  rectDiff?: string;
};
```
