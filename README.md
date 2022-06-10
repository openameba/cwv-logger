# cwv-logger

[web-vitals](https://github.com/GoogleChrome/web-vitals/tree/next)から取得した Core Web Vitals のメトリクスをデータとして使いやすい形式に変換して出力するライブラリです。

## Installation

```sh
yarn add -D @openameba/cwv-logger
```

or

```
npm i --save-dev @openameba/cwv-logger
```

## Usage

```ts
const reportPerformance = () => {
  const startTime = Date.now();

  const handleReport: ReportCallback = useCallback(
    ({ metricsName, metricsValue, networkType, selectorName, rectDiff }) => {
      firebase
        .performance()
        .trace(metricsName)
        .record(startTime, metricsValue, {
          selectorName,
          networkType,
          rectDiff,
        });
    },
    [option]
  );

  // Logging is not critical for most application,
  // so you can avoid loading this library in initial bundle by using dynamic import.
  import("@openameba/cwv-logger").then(
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

## リリースフロー

[.github/workflows/release.yml](https://github.com/openameba/cwv-logger/blob/main/.github/workflows/release.yml)に合わせてバージョニングを指定してbranchを作成し、pushすると自動でリリースできます。

`@openameba/cwv-logger@beta`のようにタグをつけてリリースしたい場合は[導入ガイド](https://github.com/openameba/cwv-logger/pull/8)を参考にリリース処理を行います。基本的には`release/prerelease-[PRE_ID]`というブランチをpushするとPRE_IDをもとに自動でタグつけされたバージョンでリリースされます。
