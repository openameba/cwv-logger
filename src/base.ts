type Connection = Record<"effectiveType", "string">;
type NetworkInformation = Navigator &
  Record<"mozConnection" | "webkitConnection" | "connection", Connection>;

export const getNetworkType = () => {
  const connection =
    (navigator as NetworkInformation).connection ||
    (navigator as NetworkInformation).mozConnection ||
    (navigator as NetworkInformation).webkitConnection;

  return connection ? connection.effectiveType : "unknown";
};

const isSVGAnimatedString = (
  className: string | SVGAnimatedString
): className is SVGAnimatedString => typeof className !== "string";

export const getElementName = (element?: Element) => {
  if (!element) {
    return "";
  }

  const elementId = element.id;
  const idName = elementId ? `#${elementId}` : "";

  const elementClassName = element.className;

  let className = elementClassName || "";

  if (isSVGAnimatedString(className) && className) {
    className = className.baseVal;
  }

  const normalizedClassName = `.${className.split(" ").join(".")}`;

  return `${element.tagName.toLowerCase()}${idName}${normalizedClassName}`.trim();
};
