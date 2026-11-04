-- Apply to a NEW dedicated Supabase project only. Never reuse an unrelated database.
-- Guest responses are private: no public table policies or direct anonymous access.
CREATE TABLE IF NOT EXISTS public.rsvp_submissions (
  receipt uuid PRIMARY KEY,
  guest_name varchar(60) NOT NULL CHECK(length(trim(guest_name)) BETWEEN 1 AND 60),
  attendance text NOT NULL CHECK(attendance IN ('yes','no')),
  guests smallint NOT NULL CHECK(guests BETWEEN 0 AND 5),
  wish varchar(300) NOT NULL DEFAULT '',
  consent boolean NOT NULL DEFAULT false,
  approval text NOT NULL DEFAULT 'pending' CHECK(approval IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_guest_count CHECK (
    (attendance='yes' AND guests BETWEEN 1 AND 5) OR
    (attendance='no' AND guests=0)
  )
);
ALTER TABLE public.rsvp_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rsvp_submissions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rsvp_submissions TO service_role;
CREATE INDEX IF NOT EXISTS rsvp_approved_wishes_idx
  ON public.rsvp_submissions (created_at DESC)
  WHERE approval='approved' AND consent=true AND length(wish)>0;
-- Approve individual wishes from the secured Supabase Dashboard only.
-- Never expose service-role or secret keys in frontend HTML, JS or GitHub.
