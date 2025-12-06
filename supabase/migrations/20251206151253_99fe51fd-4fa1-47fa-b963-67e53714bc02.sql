-- Create enum for navigation item type
CREATE TYPE navigation_item_type AS ENUM ('menu', 'submenu');

-- Create enum for navigation item status
CREATE TYPE navigation_item_status AS ENUM ('active', 'inactive');

-- Create table for navigation items
CREATE TABLE public.navigation_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type navigation_item_type NOT NULL DEFAULT 'menu',
  parent_id UUID REFERENCES public.navigation_items(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  path TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  status navigation_item_status NOT NULL DEFAULT 'active',
  restricted_to_registered BOOLEAN NOT NULL DEFAULT false,
  label_pt_br TEXT NOT NULL,
  label_en TEXT,
  label_es TEXT,
  label_tr TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT navigation_items_slug_unique UNIQUE (slug),
  CONSTRAINT navigation_items_parent_check CHECK (
    (type = 'menu' AND parent_id IS NULL) OR
    (type = 'submenu' AND parent_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "navigation_items_public_read" 
ON public.navigation_items 
FOR SELECT 
USING (true);

CREATE POLICY "navigation_items_admin_all" 
ON public.navigation_items 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create index for ordering
CREATE INDEX idx_navigation_items_order ON public.navigation_items (type, parent_id, order_index);
CREATE INDEX idx_navigation_items_parent ON public.navigation_items (parent_id);

-- Create RPC for admin upsert
CREATE OR REPLACE FUNCTION admin_upsert_navigation_item(
  p_id UUID DEFAULT NULL,
  p_type navigation_item_type DEFAULT 'menu',
  p_parent_id UUID DEFAULT NULL,
  p_slug TEXT DEFAULT NULL,
  p_path TEXT DEFAULT NULL,
  p_order_index INTEGER DEFAULT 0,
  p_is_visible BOOLEAN DEFAULT true,
  p_status navigation_item_status DEFAULT 'active',
  p_restricted_to_registered BOOLEAN DEFAULT false,
  p_label_pt_br TEXT DEFAULT NULL,
  p_label_en TEXT DEFAULT NULL,
  p_label_es TEXT DEFAULT NULL,
  p_label_tr TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_id IS NULL THEN
    INSERT INTO navigation_items (
      type, parent_id, slug, path, order_index, is_visible, status,
      restricted_to_registered, label_pt_br, label_en, label_es, label_tr, icon
    ) VALUES (
      p_type, p_parent_id, p_slug, p_path, p_order_index, p_is_visible, p_status,
      p_restricted_to_registered, p_label_pt_br, p_label_en, p_label_es, p_label_tr, p_icon
    )
    RETURNING id INTO v_id;
  ELSE
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

-- Create RPC for admin delete
CREATE OR REPLACE FUNCTION admin_delete_navigation_item(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM navigation_items WHERE id = p_id;
  RETURN FOUND;
END;
$$;