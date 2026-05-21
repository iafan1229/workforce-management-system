type ResolveRouteAccessInput = {
  pathname: string;
  hasSession: boolean;
};

type RouteAccessResult =
  | { allow: true }
  | { allow: false; redirectTo: string };

export function resolveRouteAccess({
  pathname,
  hasSession,
}: ResolveRouteAccessInput): RouteAccessResult {
  if (!hasSession && pathname !== "/login") {
    if (pathname === "/") {
      return {
        allow: false,
        redirectTo: "/login",
      };
    }

    const next = encodeURIComponent(pathname);

    return {
      allow: false,
      redirectTo: `/login?next=${next}`,
    };
  }

  if (hasSession && pathname === "/login") {
    return {
      allow: false,
      redirectTo: "/",
    };
  }

  return { allow: true };
}
