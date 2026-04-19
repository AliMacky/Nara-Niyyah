import { env } from "@/env";
import type { ScrapedPost } from "./types";

// ---------------------------------------------------------------------------
// Session cache
// ---------------------------------------------------------------------------

let cachedSession: { accessJwt: string; did: string; expiresAt: number } | null =
  null;

async function getSession(): Promise<{ accessJwt: string; did: string }> {
  if (cachedSession && Date.now() < cachedSession.expiresAt) {
    return cachedSession;
  }

  const res = await fetch(
    "https://bsky.social/xrpc/com.atproto.server.createSession",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: env.BLUESKY_HANDLE,
        password: env.BLUESKY_APP_PASSWORD,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Bluesky auth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedSession = {
    accessJwt: data.accessJwt,
    did: data.did,
    // AT Protocol JWTs are short-lived (~2hrs); refresh at 90min
    expiresAt: Date.now() + 90 * 60 * 1000,
  };
  return cachedSession;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function scrapeBluesky(
  term: string,
  locationScope?: string,
): Promise<ScrapedPost[]> {
  // Bluesky has no location scoping — skip when scoped
  if (locationScope) {
    return [];
  }

  const session = await getSession();

  const params = new URLSearchParams({
    q: term,
    limit: "50",
    sort: "latest",
  });

  const res = await fetch(
    `https://bsky.social/xrpc/app.bsky.feed.searchPosts?${params}`,
    {
      headers: {
        Authorization: `Bearer ${session.accessJwt}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Bluesky search failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const posts: ScrapedPost[] = (data.posts ?? []).map(
    (post: {
      uri: string;
      cid: string;
      author: { handle: string };
      record: { text: string; createdAt: string };
    }) => ({
      source: "bluesky" as const,
      externalId: post.cid,
      authorHandle: post.author.handle,
      content: post.record.text,
      url: atUriToUrl(post.uri, post.author.handle),
      subredditOrFeed: null,
      postedAt: new Date(post.record.createdAt),
    }),
  );

  return posts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function atUriToUrl(uri: string, handle: string): string {
  // at://did:plc:xxx/app.bsky.feed.post/rkey → https://bsky.app/profile/handle/post/rkey
  const parts = uri.split("/");
  const rkey = parts[parts.length - 1];
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}
