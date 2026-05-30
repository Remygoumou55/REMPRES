-- ============================================
-- Performance Reviews — Évaluations RH
-- ============================================

CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL
    REFERENCES public.employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  period_label TEXT NOT NULL,
  score_quality INTEGER NOT NULL
    CHECK (score_quality BETWEEN 1 AND 5),
  score_punctuality INTEGER NOT NULL
    CHECK (score_punctuality BETWEEN 1 AND 5),
  score_teamwork INTEGER NOT NULL
    CHECK (score_teamwork BETWEEN 1 AND 5),
  score_initiative INTEGER NOT NULL
    CHECK (score_initiative BETWEEN 1 AND 5),
  score_objectives INTEGER NOT NULL
    CHECK (score_objectives BETWEEN 1 AND 5),
  overall_score NUMERIC(3, 2) GENERATED ALWAYS AS (
    (
      score_quality + score_punctuality + score_teamwork
      + score_initiative + score_objectives
    )::numeric / 5.0
  ) STORED,
  comments TEXT,
  objectives_next_period TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'finalized')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reviews_employee
  ON public.performance_reviews(employee_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_period
  ON public.performance_reviews(period_label)
  WHERE deleted_at IS NULL;

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_read ON public.performance_reviews;
CREATE POLICY reviews_read
  ON public.performance_reviews
  FOR SELECT
  TO authenticated
  USING (
    public.is_super_admin()
    OR public.user_has_module_permission('rh', 'read')
  );

DROP POLICY IF EXISTS reviews_write ON public.performance_reviews;
CREATE POLICY reviews_write
  ON public.performance_reviews
  FOR ALL
  TO authenticated
  USING (
    public.is_super_admin()
    OR public.user_has_module_permission('rh', 'create')
  )
  WITH CHECK (
    public.is_super_admin()
    OR public.user_has_module_permission('rh', 'create')
  );
