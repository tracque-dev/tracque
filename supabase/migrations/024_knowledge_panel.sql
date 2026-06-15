-- ============================================================
-- TRACQUE — Knowledge Panel detection (TRQ-25)
-- Whether Google "knows" the brand as an entity (has a knowledge panel)
-- is a strong predictor of AI citation. Stored on domain_metrics so it
-- flows through the existing client-scoped domain_overview view.
-- ============================================================

alter table domain_metrics add column if not exists has_knowledge_panel boolean;
alter table domain_metrics add column if not exists knowledge_type text;
