interface PagesContext {
  request: Request;
  next(): Promise<Response>;
}

export function redirectWWW(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.hostname !== "www.orifude.com") {
    return null;
  }

  url.hostname = "orifude.com";
  return new Response(null, {
    status: 301,
    headers: {
      "Cache-Control": "public, max-age=3600",
      Location: url.toString(),
    },
  });
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return redirectWWW(context.request) ?? context.next();
}
