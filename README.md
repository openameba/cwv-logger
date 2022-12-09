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

  // Logging is not critical for most application,
  // so you can avoid loading this library in initial bundle by using dynamic import.
  import("@openameba/cwv-logger").then(
    ({ reportCLS, reportFID, reportLCP, reportTTFB, reportINP }) => {
      /**
       * reportCLS has option in second argument.
       * @see https://github.com/GoogleChrome/web-vitals/tree/main#oncls
       */
      reportCLS(
        ({
          metricsName,
          metricsValue,
          networkType,
          selectorName,
          rectDiff,
        }) => {
          firebase
            .performance()
            .trace(metricsName)
            .record(startTime, metricsValue, {
              selectorName,
              networkType,
              rectDiff,
            });
        },
        {
          reportAllChanges: false, // or true
          durationThreshold: 40, // or number
        }
      );
      reportFID(({ metricsName, metricsValue, networkType, selectorName }) => {
        firebase
          .performance()
          .trace(metricsName)
          .record(startTime, metricsValue, {
            selectorName,
            networkType,
          });
      });
      reportLCP(({ metricsName, metricsValue, networkType, selectorName }) => {
        firebase
          .performance()
          .trace(metricsName)
          .record(startTime, metricsValue, {
            selectorName,
            networkType,
          });
      });
      reportTTFB(({ metricsName, metricsValue, networkType }) => {
        firebase
          .performance()
          .trace(metricsName)
          .record(startTime, metricsValue, {
            networkType,
          });
      });
      /**
       * reportINP has option in second argument.
       * @see https://github.com/GoogleChrome/web-vitals/tree/main#oninp
       */
      reportINP(
        ({ metricsName, metricsValue, networkType, selectorName }) => {
          firebase
            .performance()
            .trace(metricsName)
            .record(startTime, metricsValue, {
              selectorName,
              networkType,
            });
        },
        {
          reportAllChanges: false, // or true
          durationThreshold: 40, // or number
        }
      );
    }
  );
};
```

## Supported Metrics

- [Cumulative Layout Shift(CLS)](https://web.dev/cls/)
- [Largest Contentful Paint(LCP)](https://web.dev/lcp/)
- [First Input Delay(FID)](https://web.dev/fid/)
- [Time to First Byte(TTFB)](https://web.dev/ttfb/)
- [Interaction to Next Paint(INP)](https://web.dev/inp/)

## Report params

```ts
type ReportParams = {
  metricsName: "CLS" | "LCP" | "FID" | "TTFB" | "INP";
  metricsValue: number;
  // Get value from https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType.
  networkType: string;
  // Currently not supported
  country?: string;
  // Available with CLS, LCP, FID and INP.
  selectorName?: string;
  // Available only with FID and INP.
  eventTime?: string;
  // Available only with CLS.
  rectDiff?: string;
};
```

## リリースフロー

`main`または`beta`ブランチにマージすることで自動的にリリースされます。
リリースが完了するとリリースノートも自動的に生成されます。

基本は`main`ブランチにマージします。
実験的な機能や大きな変更を含む場合に、`beta`ブランチを通して段階的にリリースします。
