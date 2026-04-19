export interface ScrapedPost {
  source: "reddit" | "bluesky";
  externalId: string;
  authorHandle: string;
  content: string;
  url: string;
  subredditOrFeed: string | null;
  postedAt: Date;
}
