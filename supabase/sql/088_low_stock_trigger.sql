-- ============================================
-- Low Stock Alert Trigger
-- Fires when stock_items.quantity is updated
-- and falls below min_quantity
-- ============================================

-- Step 1: Add reference_id to notifications for anti-spam deduplication
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS reference_id TEXT;

CREATE INDEX IF NOT EXISTS idx_notifications_reference
  ON public.notifications(reference_id)
  WHERE reference_id IS NOT NULL;

-- Step 2: Function to find logistique managers
CREATE OR REPLACE FUNCTION get_logistique_managers()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.profiles
  WHERE role_key = 'responsable_logistique'
    AND (deleted_at IS NULL OR deleted_at > NOW())
  UNION
  SELECT id FROM public.profiles
  WHERE role_key = 'super_admin'
    AND (deleted_at IS NULL OR deleted_at > NOW())
$$ LANGUAGE sql STABLE;

-- Step 3: Anti-spam check — TRUE if a low stock notif was sent for this item within 24h
CREATE OR REPLACE FUNCTION low_stock_notif_recent(p_item_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = p_user_id
      AND reference_id = p_item_id::TEXT
      AND type IN ('warning', 'approval_rejected')
      AND created_at > NOW() - INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 4: Main trigger function
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_min_qty INTEGER;
  v_manager_id UUID;
BEGIN
  -- Only fire when quantity actually changes
  IF TG_OP = 'UPDATE' AND OLD.quantity = NEW.quantity THEN
    RETURN NEW;
  END IF;

  -- Use min_quantity column (confirmed present in stock_items)
  v_min_qty := COALESCE(CAST(NEW.min_quantity AS INTEGER), 0);

  -- Only alert if stock is now below minimum AND non-negative
  IF NEW.quantity < v_min_qty AND NEW.quantity >= 0 THEN
    FOR v_manager_id IN SELECT get_logistique_managers() LOOP
      -- Anti-spam: skip if already notified in the last 24h
      IF NOT low_stock_notif_recent(NEW.id, v_manager_id) THEN
        INSERT INTO public.notifications (
          user_id,
          type,
          title,
          message,
          reference_id,
          link,
          read_at,
          created_at
        ) VALUES (
          v_manager_id,
          'approval_rejected',
          'Stock bas — ' || NEW.name,
          'Le stock de "' || NEW.name || '" est à ' || NEW.quantity
            || ' unité(s). Seuil minimum : ' || v_min_qty || ' unité(s).',
          NEW.id::TEXT,
          '/logistique/alertes',
          NULL,
          NOW()
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Attach trigger to stock_items (AFTER UPDATE OF quantity only)
DROP TRIGGER IF EXISTS trg_low_stock_alert ON public.stock_items;

CREATE TRIGGER trg_low_stock_alert
  AFTER UPDATE OF quantity
  ON public.stock_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_low_stock();

COMMENT ON FUNCTION notify_low_stock() IS
  'Fires on stock_items.quantity UPDATE. Inserts a warning notification for
   responsable_logistique when stock < min_quantity. Anti-spam: max 1 notification
   per item per user per 24h (deduplicated via reference_id).';

-- Manual test helper:
-- UPDATE public.stock_items SET quantity = 0 WHERE id = '<some-id>';
