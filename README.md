# Nara

Nara is a civic platform built to connect public feeling to public action.

Most tools in this space stop at one side of the problem. They either help organizations understand the public, or they help communities organize themselves. Nara is built to do both.

It has two connected experiences inside one product:

- **Organization side** for sentiment analysis, campaign tracking, and reporting
- **Community side** for policy proposals and volunteer coordination

## What problem this solves

Public opinion moves fast, but institutions are slow.

Campaigns, nonprofits, and advocacy groups need a better way to understand what people are actually saying online.

At the same time, communities need a better path from reaction to action. It is not enough to know that people are frustrated. They need a place to turn that energy into proposals, organizing, and momentum.

Nara is designed as that bridge.

## Core features

### Organization side

This is the analytics layer.

**Sentiment dashboard**
- Search any public issue or topic
- Pull live discussion from Reddit and Bluesky
- Run AI-powered sentiment analysis
- Show a clear overall readout with sample size and confidence
- Extract recurring themes from the conversation

**Campaign tracking**
- Create campaigns around one or more search terms
- Re-run them over time to build a bigger view of the issue
- Avoid duplicate posts across repeated runs
- Expand the time window across runs so the campaign builds a broader historical picture

**Reports**
- Review completed searches
- Compare historical runs
- Return to past results without re-running analysis

### Community side

This is the action layer.

**Policy proposals**
- Anonymous citizens can publish policy ideas
- Readers can support and discuss proposals
- Proposal pages are designed to feel civic and protected, not like social media
- The anonymity model is a product feature, not an afterthought

**Nara Ground**
- Volunteer dashboard for campaign organizing
- Lane-based structure for different types of work
- Points, streaks, and leaderboard
- Demo-ready fallback behavior for live presentations

## Why this project is different

Nara is not just a dashboard.
Nara is not just a forum.
Nara is not just a volunteer app.

It is a full loop:

**public sentiment → civic proposal → organized action**

That is the heart of the product.

## Best demo flow

If you are reviewing the project quickly, this is the strongest walkthrough:

1. **Dashboard**  
   Run a sentiment search on a live civic issue.

2. **Campaigns**  
   Show how repeated runs build a broader issue view over time.

3. **Policy**  
   Switch to the citizen-facing side and show how people can turn public frustration into concrete proposals.

4. **Ground**  
   Open the volunteer dashboard to show how the platform extends into actual organizing.

This sequence shows the full idea behind Nara.

## What is working today

- live topic search
- Reddit and Bluesky ingestion
- sentiment analysis
- theme extraction
- campaign creation and repeated runs
- report views
- proposal feed and proposal submission
- Ground dashboard and demo flow

## Built with

- Next.js 16
- TypeScript
- Tailwind CSS v4
- Supabase Auth
- Drizzle ORM + Postgres
- Amazon Bedrock
- n8n webhooks for Ground

## Final note

Nara is built around a simple belief: people should not disappear between the moment they speak and the moment power responds.

The product tries to keep that person in view the entire way.
