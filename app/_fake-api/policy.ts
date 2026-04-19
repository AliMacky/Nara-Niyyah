import { z } from "zod";
import { createRng, delay } from "./seed";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const AnonymousAuthorSchema = z.object({
  anonymousId: z.string(),
  regionLabel: z.string(),
});

/**
 * Vote display follows DESIGN_SYSTEM.md § Vote UI threshold rules:
 * - Below 10 votes: hidden (null)
 * - 10–99: shown as ranges ("10+", "50+")
 * - 100+: shown as "100+", "500+", "1k+"
 */
export const VoteDisplaySchema = z.object({
  /** Raw count, used for sorting server-side. Never exposed directly in UI below threshold. */
  raw: z.number().int(),
  /** Display string or null if below threshold (< 10 votes). */
  display: z.string().nullable(),
});

export const PolicyDraftSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  author: AnonymousAuthorSchema,
  region: z.string(),
  category: z.enum([
    "housing",
    "transit",
    "environment",
    "education",
    "public-safety",
    "healthcare",
    "economic-development",
    "civil-rights",
  ]),
  votes: VoteDisplaySchema,
  commentCount: z.number().int().nonnegative(),
  aiAssisted: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PolicyFeedItemSchema = PolicyDraftSchema.omit({ body: true });

export const PolicyFeedSchema = z.object({
  items: z.array(PolicyFeedItemSchema),
  nextCursor: z.string().nullable(),
  total: z.number().int(),
});

export const CommentSchema = z.object({
  id: z.string(),
  draftId: z.string(),
  author: AnonymousAuthorSchema,
  text: z.string(),
  createdAt: z.string().datetime(),
  isPolitician: z.boolean(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnonymousAuthor = z.infer<typeof AnonymousAuthorSchema>;
export type VoteDisplay = z.infer<typeof VoteDisplaySchema>;
export type PolicyDraft = z.infer<typeof PolicyDraftSchema>;
export type PolicyFeedItem = z.infer<typeof PolicyFeedItemSchema>;
export type PolicyFeed = z.infer<typeof PolicyFeedSchema>;
export type Comment = z.infer<typeof CommentSchema>;

// ---------------------------------------------------------------------------
// Vote display logic
// ---------------------------------------------------------------------------

function formatVoteDisplay(raw: number): VoteDisplay {
  if (raw < 10) return { raw, display: null };
  if (raw < 50) return { raw, display: "10+" };
  if (raw < 100) return { raw, display: "50+" };
  if (raw < 500) return { raw, display: "100+" };
  if (raw < 1000) return { raw, display: "500+" };
  return { raw, display: `${Math.floor(raw / 1000)}k+` };
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const REGIONS = [
  "King County, WA",
  "Multnomah County, OR",
  "Los Angeles County, CA",
  "Maricopa County, AZ",
  "Cook County, IL",
  "Travis County, TX",
  "Denver County, CO",
  "Hennepin County, MN",
];

const POLICY_DEFS = [
  {
    title: "Community Land Trust Expansion Act",
    summary: "Establish county-funded community land trusts to preserve affordable housing in gentrifying neighborhoods.",
    body: "Section 1. Purpose\n\nThis policy establishes a framework for county-funded community land trusts (CLTs) in areas identified as high-risk for displacement due to rising property values.\n\nSection 2. Definitions\n\n(a) \"Community Land Trust\" means a nonprofit corporation that acquires and holds land for the benefit of a community, providing affordable housing in perpetuity.\n(b) \"High-risk displacement zone\" means any census tract where median home values have increased by 30% or more over the preceding 5-year period.\n\nSection 3. Establishment\n\nThe county shall allocate no less than $15 million annually from existing housing bond proceeds to establish and maintain CLTs in designated high-risk displacement zones.\n\nSection 4. Governance\n\nEach CLT board shall consist of: (a) one-third residents of CLT housing, (b) one-third community members from the surrounding neighborhood, (c) one-third appointed by the county executive with council confirmation.",
    category: "housing",
  },
  {
    title: "Zero-Fare Transit Pilot Program",
    summary: "Eliminate fares on all county bus routes for a 24-month pilot, funded by a commercial parking surcharge.",
    body: "Section 1. Purpose\n\nThis policy establishes a 24-month zero-fare pilot program for all fixed-route bus service operated by or contracted through the county transit authority.\n\nSection 2. Funding Mechanism\n\nA surcharge of $2.00 per day shall be applied to all commercial parking facilities with 50 or more spaces within the county. Revenue shall be deposited into a dedicated Zero-Fare Transit Fund.\n\nSection 3. Metrics and Evaluation\n\nThe transit authority shall track: (a) ridership changes by route, (b) demographic ridership data, (c) operating cost impacts, (d) traffic congestion measurements on parallel corridors.\n\nSection 4. Sunset\n\nThis pilot expires 24 months after implementation unless renewed by council vote.",
    category: "transit",
  },
  {
    title: "Urban Canopy Restoration Initiative",
    summary: "Mandate 40% tree canopy coverage in new developments and fund restoration in heat-island neighborhoods.",
    body: "Section 1. Findings\n\nUrban heat islands in the county cause up to 15°F temperature differentials between tree-covered and paved areas, disproportionately affecting low-income neighborhoods.\n\nSection 2. Requirements\n\n(a) All new residential developments exceeding 10 units shall achieve minimum 40% tree canopy coverage within 10 years of completion.\n(b) All new commercial developments shall achieve minimum 30% coverage.\n\nSection 3. Restoration Fund\n\nThe county shall establish an Urban Canopy Restoration Fund of $8 million annually, prioritizing neighborhoods with current canopy coverage below 15%.\n\nSection 4. Species Selection\n\nAll plantings shall use native or climate-adapted species approved by the county arborist, with priority given to species providing food habitat for native pollinators.",
    category: "environment",
  },
  {
    title: "Participatory Budgeting for School Districts",
    summary: "Allocate 5% of discretionary school budgets to student- and parent-directed participatory budgeting.",
    body: "Section 1. Purpose\n\nThis policy empowers students, parents, and community members to directly allocate a portion of school district budgets through a structured participatory process.\n\nSection 2. Allocation\n\nEach school district shall set aside 5% of its annual discretionary budget for participatory allocation. Minimum per-school allocation: $25,000.\n\nSection 3. Process\n\n(a) Idea collection phase: 4 weeks, open to all community members.\n(b) Proposal development: volunteer committees develop top 10 ideas into feasible proposals.\n(c) Voting: all students grade 6+ and all parents/guardians may vote. Each voter ranks their top 3 choices.\n\nSection 4. Oversight\n\nThe school board retains veto authority only for proposals that violate existing law or safety codes. Vetoes must be explained in writing.",
    category: "education",
  },
  {
    title: "Crisis Response Alternatives Program",
    summary: "Create a civilian-led crisis response team for mental health, substance use, and homelessness calls.",
    body: "Section 1. Purpose\n\nThis policy establishes a non-police crisis response program staffed by licensed mental health professionals, social workers, and trained peer counselors.\n\nSection 2. Scope\n\nThe program shall respond to 911 and 211 calls involving: (a) mental health crises without weapons, (b) substance use incidents, (c) welfare checks, (d) homelessness-related calls, (e) neighbor disputes without violence.\n\nSection 3. Staffing\n\nEach response team shall include: one licensed clinical social worker, one EMT, and one peer counselor with lived experience. Teams operate in clearly marked civilian vehicles.\n\nSection 4. Funding\n\nInitial funding of $12 million shall be reallocated from the existing public safety budget, specifically from overtime and equipment line items identified as lower-priority by the independent budget review.",
    category: "public-safety",
  },
  {
    title: "Universal Pre-K Through Community Partnerships",
    summary: "Guarantee free pre-kindergarten for all 3- and 4-year-olds through a network of licensed community providers.",
    body: "Section 1. Guarantee\n\nEvery child aged 3-4 residing in the county shall have access to free, high-quality pre-kindergarten education.\n\nSection 2. Delivery Model\n\nRather than building new facilities, the county shall contract with licensed childcare providers, community organizations, and faith-based institutions that meet quality standards.\n\nSection 3. Provider Standards\n\n(a) All lead teachers must hold a CDA credential or higher. (b) Maximum class size: 15 children. (c) Curriculum must be play-based and developmentally appropriate.\n\nSection 4. Funding\n\nFunded through a 0.1% county sales tax increase, estimated to generate $45 million annually.",
    category: "education",
  },
  {
    title: "Small Business Micro-Grant Equity Program",
    summary: "Provide $5,000–$15,000 micro-grants to first-generation and minority-owned small businesses.",
    body: "Section 1. Purpose\n\nThis policy addresses the documented disparity in small business formation rates among first-generation Americans and historically marginalized communities.\n\nSection 2. Eligibility\n\n(a) Business must be registered in the county. (b) Annual revenue under $500,000. (c) Owner must be a first-generation American, or the business must be located in a historically underinvested census tract.\n\nSection 3. Grant Structure\n\nGrants range from $5,000 to $15,000 based on business plan review. No repayment required. Funds may be used for: equipment, lease deposits, inventory, licensing, or marketing.\n\nSection 4. Annual Budget\n\n$3 million annually, funded through existing economic development allocations.",
    category: "economic-development",
  },
  {
    title: "Right to Counsel in Eviction Proceedings",
    summary: "Guarantee free legal representation for all tenants facing eviction in county courts.",
    body: "Section 1. Right Established\n\nEvery tenant facing an eviction proceeding in county courts shall have the right to legal representation at no cost.\n\nSection 2. Implementation\n\nThe county shall contract with legal aid organizations to provide representation. The public defender's office shall coordinate intake and assignment.\n\nSection 3. Scope\n\nRepresentation covers: (a) unlawful detainer actions, (b) lease termination disputes, (c) rent increase challenges where applicable, (d) habitability defense claims.\n\nSection 4. Funding\n\nFunded through a $75 surcharge on all eviction filings, supplemented by $4 million from the county general fund.",
    category: "civil-rights",
  },
  {
    title: "County Broadband as Public Utility",
    summary: "Classify broadband internet as a public utility and build a county-owned fiber network in underserved areas.",
    body: "Section 1. Declaration\n\nBroadband internet access is hereby classified as an essential public utility within the county.\n\nSection 2. Network Build-Out\n\nThe county shall build and operate a fiber-optic network in all census tracts where fewer than 80% of households have access to 100Mbps+ service.\n\nSection 3. Pricing\n\nResidential service shall not exceed $40/month for 100Mbps symmetric. Low-income households qualifying for existing assistance programs shall receive free service.\n\nSection 4. Governance\n\nA Broadband Utility Board of 7 members, appointed by the county executive with council approval, shall oversee operations. No board member may have financial ties to existing ISPs.",
    category: "economic-development",
  },
  {
    title: "Indigenous Land Acknowledgment and Consultation Framework",
    summary: "Require meaningful tribal consultation before any county land use decision affecting culturally significant sites.",
    body: "Section 1. Purpose\n\nThis policy moves beyond symbolic acknowledgment to establish enforceable consultation requirements with federally recognized tribes historically connected to county lands.\n\nSection 2. Scope\n\nConsultation is required before: (a) any rezoning affecting sites within 1 mile of documented cultural sites, (b) public infrastructure projects on historically tribal lands, (c) park and open space master plans.\n\nSection 3. Process\n\n(a) 90-day notice to all relevant tribal governments. (b) Minimum two in-person consultation meetings. (c) Written response to tribal concerns required before final approval. (d) Tribal representatives may request an independent cultural impact assessment at county expense.\n\nSection 4. Enforcement\n\nAny land use decision made without required consultation is voidable upon tribal petition to the county hearing examiner.",
    category: "civil-rights",
  },
  {
    title: "Heat Action Plan for Outdoor Workers",
    summary: "Mandate rest breaks, shade, and water access for outdoor workers when temperatures exceed 80°F.",
    body: "Section 1. Applicability\n\nThis policy applies to all employers in the county with employees performing outdoor work, including agriculture, construction, landscaping, and delivery services.\n\nSection 2. Requirements When Temperature Exceeds 80°F\n\n(a) Potable water: minimum 1 quart per worker per hour, readily accessible. (b) Shade: sufficient for all workers on break simultaneously, within 200 feet of work area. (c) Rest breaks: 10 minutes every 2 hours in addition to meal breaks.\n\nSection 3. Extreme Heat (95°F+)\n\n(a) All above requirements plus: mandatory 15-minute cool-down every hour. (b) Buddy system required. (c) On-site first aid trained supervisor.\n\nSection 4. Enforcement\n\nCounty labor standards division shall conduct proactive inspections. Violations: $1,000 first offense, $5,000 subsequent.",
    category: "healthcare",
  },
  {
    title: "Neighborhood Slow Streets Program",
    summary: "Convert residential streets to 15mph shared spaces with traffic calming, prioritizing pedestrian safety.",
    body: "Section 1. Purpose\n\nThis policy creates a Neighborhood Slow Streets program to reduce traffic violence on residential streets through physical design changes.\n\nSection 2. Eligibility\n\nAny residential street meeting these criteria: (a) not a designated arterial, (b) speed limit currently 25mph or lower, (c) petition signed by 60% of adjacent property owners/tenants.\n\nSection 3. Design Standards\n\n(a) Speed limit reduced to 15mph. (b) Physical traffic calming at intervals no greater than 300 feet (chicanes, raised crossings, planters). (c) Shared street markings indicating pedestrian priority. (d) No through-traffic signage at entries.\n\nSection 4. Funding\n\n$2 million annually from the transportation capital budget. Priority given to neighborhoods near schools and senior centers.",
    category: "transit",
  },
];

const COMMENT_TEMPLATES = [
  "This is well-written. Has anyone modeled the fiscal impact over a 5-year horizon?",
  "I support the intent but Section 3 needs tighter language around oversight.",
  "As someone directly affected by this issue — thank you for drafting this.",
  "How does this interact with the state preemption law from 2024?",
  "Strong proposal. My one concern is the implementation timeline seems aggressive.",
  "I'd like to see an equity analysis included before this moves forward.",
  "This passed in a neighboring county and the results have been positive.",
  "The funding mechanism is creative but might face legal challenges.",
  "Can we get a public hearing scheduled on this? Lots of community interest.",
  "Section 2(c) seems redundant with existing county code 4.12.030.",
  "I've been advocating for something like this for years. Count me as a strong supporter.",
  "The enforcement provisions need teeth. Without penalties, this is advisory at best.",
];

function generateDrafts(rng: ReturnType<typeof createRng>): PolicyDraft[] {
  return POLICY_DEFS.map((def, i) => {
    const rawVotes = rng.int(0, 2500);
    const region = rng.pick(REGIONS);
    const baseDate = new Date("2026-03-15T00:00:00Z");
    const daysAgo = rng.int(1, 30);
    const createdAt = new Date(
      baseDate.getTime() + daysAgo * 86400000,
    ).toISOString();
    const updatedAt = new Date(
      new Date(createdAt).getTime() + rng.int(0, 5) * 86400000,
    ).toISOString();

    return {
      id: `draft-${(i + 1).toString().padStart(3, "0")}`,
      title: def.title,
      summary: def.summary,
      body: def.body,
      author: {
        anonymousId: `citizen-${rng.int(1000, 9999)}`,
        regionLabel: region,
      },
      region,
      category: def.category as PolicyDraft["category"],
      votes: formatVoteDisplay(rawVotes),
      commentCount: rng.int(0, 85),
      aiAssisted: rng.next() > 0.6,
      createdAt,
      updatedAt,
    };
  });
}

function generateComments(
  rng: ReturnType<typeof createRng>,
  draftId: string,
  count: number,
): Comment[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `comment-${draftId.slice(-3)}-${(i + 1).toString().padStart(3, "0")}`,
    draftId,
    author: {
      anonymousId: `citizen-${rng.int(1000, 9999)}`,
      regionLabel: rng.pick(REGIONS),
    },
    text: rng.pick(COMMENT_TEMPLATES),
    createdAt: new Date(
      new Date("2026-04-01T00:00:00Z").getTime() + rng.int(0, 14) * 86400000,
    ).toISOString(),
    isPolitician: rng.next() > 0.85,
  }));
}

// ---------------------------------------------------------------------------
// Seeded data
// ---------------------------------------------------------------------------

const DRAFTS = generateDrafts(createRng(3000));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const PAGE_SIZE = 6;

export async function getPolicyFeed(
  region?: string,
  cursor?: string,
): Promise<PolicyFeed> {
  const rng = createRng(4001);
  await delay(rng);

  const filtered = region
    ? DRAFTS.filter((d) => d.region.toLowerCase().includes(region.toLowerCase()))
    : DRAFTS;

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const page = filtered.slice(startIndex, startIndex + PAGE_SIZE);
  const hasMore = startIndex + PAGE_SIZE < filtered.length;

  return {
    items: page.map(({ body: _body, ...rest }) => rest),
    nextCursor: hasMore ? String(startIndex + PAGE_SIZE) : null,
    total: filtered.length,
  };
}

export async function getPolicyDraft(id: string): Promise<PolicyDraft | null> {
  const rng = createRng(4002);
  await delay(rng);
  return DRAFTS.find((d) => d.id === id) ?? null;
}

export async function getComments(draftId: string): Promise<Comment[]> {
  const rng = createRng(4003 + hashCode(draftId));
  await delay(rng);
  const draft = DRAFTS.find((d) => d.id === draftId);
  if (!draft) return [];
  return generateComments(rng, draftId, Math.min(draft.commentCount, 12));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
