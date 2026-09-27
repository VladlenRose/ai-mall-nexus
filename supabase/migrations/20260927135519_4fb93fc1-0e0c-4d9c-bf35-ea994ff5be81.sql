CREATE TABLE public.trade_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('buy','sell')),
  title text NOT NULL,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  extra text,
  attachment_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_requests TO authenticated;
GRANT ALL ON public.trade_requests TO service_role;
ALTER TABLE public.trade_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in view requests" ON public.trade_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners create requests" ON public.trade_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update requests" ON public.trade_requests FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete requests" ON public.trade_requests FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX trade_requests_kind_idx ON public.trade_requests(kind, created_at DESC);