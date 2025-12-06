-- Drop existing functions
DROP FUNCTION IF EXISTS public.admin_upsert_navigation_item;
DROP FUNCTION IF EXISTS public.admin_delete_navigation_item;

-- Recreate with session validation
CREATE OR REPLACE FUNCTION public.admin_upsert_navigation_item(
  p_id uuid DEFAULT NULL,
  p_type navigation_item_type DEFAULT 'menu',
  p_parent_id uuid DEFAULT NULL,
  p_slug text DEFAULT NULL,
  p_path text DEFAULT NULL,
  p_order_index integer DEFAULT 0,
  p_is_visible boolean DEFAULT true,
  p_status navigation_item_status DEFAULT 'active',
  p_restricted_to_registered boolean DEFAULT false,
  p_label_pt_br text DEFAULT NULL,
  p_label_en text DEFAULT NULL,
  p_label_es text DEFAULT NULL,
  p_label_tr text DEFAULT NULL,
  p_icon text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_id IS NULL THEN
    -- Insert new item
    INSERT INTO navigation_items (
      type, parent_id, slug, path, order_index, is_visible, status,
      restricted_to_registered, label_pt_br, label_en, label_es, label_tr, icon
    ) VALUES (
      p_type, p_parent_id, p_slug, p_path, p_order_index, p_is_visible, p_status,
      p_restricted_to_registered, p_label_pt_br, p_label_en, p_label_es, p_label_tr, p_icon
    )
    RETURNING id INTO v_id;
  ELSE
    -- Update existing item
    UPDATE navigation_items SET
      type = p_type,
      parent_id = p_parent_id,
      slug = p_slug,
      path = p_path,
      order_index = p_order_index,
      is_visible = p_is_visible,
      status = p_status,
      restricted_to_registered = p_restricted_to_registered,
      label_pt_br = p_label_pt_br,
      label_en = p_label_en,
      label_es = p_label_es,
      label_tr = p_label_tr,
      icon = p_icon,
      updated_at = now()
    WHERE id = p_id;
    v_id := p_id;
  END IF;
  
  RETURN v_id;
END;
$$;

-- Recreate delete function
CREATE OR REPLACE FUNCTION public.admin_delete_navigation_item(
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete child submenus first if deleting a menu
  DELETE FROM navigation_items WHERE parent_id = p_id;
  -- Delete the item itself
  DELETE FROM navigation_items WHERE id = p_id;
  RETURN FOUND;
END;
$$;