const baseHref = import.meta.env.BASE_URL;

export const withTrailingSlash = (value: string): string =>
  value.endsWith("/") ? value : `${value}/`;

export const baseWithSlash = withTrailingSlash(baseHref);

const hasProtocol = (path: string): boolean => /^[a-z][a-z0-9+.-]*:/i.test(path);

export const isExternalUrl = (path: string): boolean =>
  /^(?:[a-z+]+:)?\/\//i.test(path) || hasProtocol(path);

export const resolveUrl = <T extends string | null | undefined>(path: T): T => {
  if (!path || path === "") {
    return path;
  }
  if (path.startsWith("#")) {
    return path;
  }
  if (isExternalUrl(path) || path.startsWith("data:")) {
    return path;
  }
  if (path === "/") {
    return baseWithSlash as T;
  }
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${baseWithSlash}${normalized}` as T;
};

export const stripBaseFromPath = (pathname: string): string =>
  pathname.startsWith(baseWithSlash)
    ? pathname.slice(baseWithSlash.length - 1)
    : pathname;
