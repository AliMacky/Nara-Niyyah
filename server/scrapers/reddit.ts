import { env } from "@/env";
import type { ScrapedPost } from "./types";

// ---------------------------------------------------------------------------
// Location → subreddit mapping
// ---------------------------------------------------------------------------

const LOCATION_SUBREDDITS: Record<string, string[]> = {
  washington: ["washington", "seattle", "pnw", "bellevue", "tacoma"],
  california: ["california", "losangeles", "sanfrancisco", "bayarea", "sandiego"],
  oregon: ["oregon", "portland", "eugene", "salem"],
  texas: ["texas", "austin", "houston", "dallas", "sanantonio"],
  "new york": ["newyorkcity", "nyc", "newyork", "buffalo"],
  florida: ["florida", "miami", "orlando", "tampa"],
  illinois: ["chicago", "illinois"],
  colorado: ["colorado", "denver", "boulder"],
};

// ---------------------------------------------------------------------------
// OAuth token cache
// ---------------------------------------------------------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(
    `${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`,
  ).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": env.REDDIT_USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Reddit OAuth failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

// ---------------------------------------------------------------------------
// Search helpers
// ---------------------------------------------------------------------------

interface RedditListing {
  data: {
    children: Array<{
      data: {
        id: string;
        author: string;
        selftext: string;
        title: string;
        subreddit: string;
        permalink: string;
        created_utc: number;
      };
    }>;
  };
}

function parseListingToPosts(
  listing: RedditListing,
): ScrapedPost[] {
  return listing.data.children.map((child) => {
    const d = child.data;
    const text = d.selftext
      ? `${d.title}\n\n${d.selftext}`
      : d.title;
    return {
      source: "reddit" as const,
      externalId: d.id,
      authorHandle: d.author,
      content: text,
      url: `https://reddit.com${d.permalink}`,
      subredditOrFeed: `r/${d.subreddit}`,
      postedAt: new Date(d.created_utc * 1000),
    };
  });
}

async function searchSubreddit(
  token: string,
  subreddit: string,
  term: string,
  limit: number,
  sort: string,
  timeRange: string,
): Promise<ScrapedPost[]> {
  const params = new URLSearchParams({
    q: term,
    restrict_sr: "1",
    sort,
    t: timeRange,
    limit: String(limit),
    type: "link",
  });

  const res = await fetch(
    `https://oauth.reddit.com/r/${subreddit}/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": env.REDDIT_USER_AGENT,
      },
    },
  );

  if (!res.ok) {
    console.error(`Reddit search r/${subreddit} failed: ${res.status}`);
    return [];
  }

  const listing: RedditListing = await res.json();
  return parseListingToPosts(listing);
}

async function searchGlobal(
  token: string,
  term: string,
  limit: number,
  sort: string,
  timeRange: string,
): Promise<ScrapedPost[]> {
  const params = new URLSearchParams({
    q: term,
    sort,
    t: timeRange,
    limit: String(limit),
    type: "link",
  });

  const res = await fetch(
    `https://oauth.reddit.com/search?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": env.REDDIT_USER_AGENT,
      },
    },
  );

  if (!res.ok) {
    throw new Error(`Reddit global search failed: ${res.status}`);
  }

  const listing: RedditListing = await res.json();
  return parseListingToPosts(listing);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function scrapeReddit(
  term: string,
  locationScope?: string,
  options?: { sort?: "relevance" | "new"; timeRange?: "hour" | "day" | "week" | "month" | "year" | "all"; limit?: number },
): Promise<ScrapedPost[]> {
  const token = await getAccessToken();
  const sort = options?.sort ?? "relevance";
  const timeRange = options?.timeRange ?? "month";
  const limit = options?.limit ?? 50;

  if (locationScope) {
    const key = locationScope.toLowerCase();
    const subs = LOCATION_SUBREDDITS[key];
    if (!subs) {
      console.warn(
        `No subreddit mapping for location "${locationScope}", falling back to global`,
      );
      return searchGlobal(token, term, limit, sort, timeRange);
    }

    const perSub = Math.max(10, Math.ceil(limit / subs.length));
    const results = await Promise.all(
      subs.map((sub) => searchSubreddit(token, sub, term, perSub, sort, timeRange)),
    );
    const merged = results.flat();

    const seen = new Set<string>();
    return merged.filter((p) => {
      if (seen.has(p.externalId)) return false;
      seen.add(p.externalId);
      return true;
    });
  }

  return searchGlobal(token, term, limit, sort, timeRange);
}
