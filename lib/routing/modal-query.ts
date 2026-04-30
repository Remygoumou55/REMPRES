function withQueryParam(href: string, key: string, value: string): string {
  const [path, hash = ""] = href.split("#");
  const separator = path.includes("?") ? "&" : "?";
  const base = path.includes(`${key}=`) ? path : `${path}${separator}${key}=${value}`;
  return hash ? `${base}#${hash}` : base;
}

export function withEditModalQuery(href: string): string {
  return withQueryParam(href, "edit", "1");
}

export function withCreateModalQuery(href: string): string {
  return withQueryParam(href, "create", "1");
}
