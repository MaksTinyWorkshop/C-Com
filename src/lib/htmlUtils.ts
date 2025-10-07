export const replaceScopedClasses = (
  input: string | null | undefined,
  styles: Record<string, string>,
): string | null => {
  if (!input) {
    return input ?? null;
  }

  return input.replace(/\{styles\.([\w-]+)\}/g, (_, token) => {
    const resolved = styles[token as keyof typeof styles];
    return typeof resolved === "string" ? resolved : token;
  });
};
