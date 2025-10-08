import type { Plugin } from "unified";
import type { Root, Element, ElementContent } from "hast";

type Options = {
  base?: string;
};

const hasProtocol = (value: string): boolean =>
  /^[a-z][a-z0-9+.-]*:/i.test(value);

const normaliseBase = (base: string): string => {
  if (!base) {
    return "/";
  }
  const withSlash = base.endsWith("/") ? base : `${base}/`;
  return withSlash.startsWith("/") ? withSlash : `/${withSlash}`;
};

const shouldTransform = (value: string, base: string): boolean => {
  if (!value) {
    return false;
  }
  if (value.startsWith("#") || value.startsWith("//") || hasProtocol(value)) {
    return false;
  }
  if (value.startsWith("data:")) {
    return false;
  }
  const normalisedBase = normaliseBase(base);
  return value.startsWith("/") && !value.startsWith(normalisedBase);
};

const applyBase = (value: string, base: string): string => {
  if (!shouldTransform(value, base)) {
    return value;
  }
  const normalisedBase = normaliseBase(base);
  const suffix = value.startsWith("/") ? value.slice(1) : value;
  return `${normalisedBase}${suffix}`;
};

const transformSrcSet = (value: string, base: string): string =>
  value
    .split(",")
    .map((candidate) => {
      const trimmed = candidate.trim();
      if (!trimmed) {
        return trimmed;
      }
      const [url, ...rest] = trimmed.split(/\s+/);
      const descriptor = rest.join(" ");
      const transformedUrl = applyBase(url, base);
      return descriptor ? `${transformedUrl} ${descriptor}` : transformedUrl;
    })
    .join(", ");

type WalkableNode = Root | Element | ElementContent;

const isElement = (node: WalkableNode): node is Element =>
  typeof node === "object" && node !== null && (node as Element).type === "element";

const hasChildren = (node: WalkableNode): node is Root | Element =>
  typeof node === "object" && node !== null && "children" in node;

const walk = (node: WalkableNode, base: string): void => {
  if (!node || typeof node !== "object") {
    return;
  }

  if (isElement(node) && node.tagName === "img" && node.properties) {
    const { src, srcset } = node.properties as Record<string, unknown>;
    if (typeof src === "string") {
      node.properties.src = applyBase(src, base);
    }
    if (typeof srcset === "string") {
      node.properties.srcset = transformSrcSet(srcset, base);
    }
  }

  if (hasChildren(node) && Array.isArray(node.children)) {
    node.children.forEach((child) => {
      walk(child as WalkableNode, base);
    });
  }
};

export const rehypeBaseImages: Plugin<[Options?], Root> = (options = {}) => {
  const base = options.base ?? "/";

  return (tree: Root) => {
    walk(tree, base);
  };
};
