-- Enable RLS on all policy tables
ALTER TABLE policy_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_comments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- policy_drafts
--
-- Any authenticated user may read all drafts (citizens browsing + politicians).
-- Any authenticated user may submit a draft. No user_id column exists on this
-- table by design — there is no RLS predicate linking rows to their author.
-- ---------------------------------------------------------------------------

CREATE POLICY "policy_drafts_select" ON policy_drafts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "policy_drafts_insert" ON policy_drafts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- policy_votes
--
-- Any authenticated user may read vote rows (needed for client-side state).
-- Insert and update are gated to the voter's own rows so users cannot vote
-- on behalf of others.
-- ---------------------------------------------------------------------------

CREATE POLICY "policy_votes_select" ON policy_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "policy_votes_insert" ON policy_votes
  FOR INSERT WITH CHECK (voter_id = auth.uid());

CREATE POLICY "policy_votes_update" ON policy_votes
  FOR UPDATE USING (voter_id = auth.uid())
  WITH CHECK (voter_id = auth.uid());

-- ---------------------------------------------------------------------------
-- policy_comments
--
-- Any authenticated user may read all comments.
-- Any authenticated user may submit a comment. No user_id is stored — same
-- anonymization model as policy_drafts.
-- ---------------------------------------------------------------------------

CREATE POLICY "policy_comments_select" ON policy_comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "policy_comments_insert" ON policy_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
