-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._deleted_data_backup (
  id integer NOT NULL DEFAULT nextval('_deleted_data_backup_id_seq'::regclass),
  table_name character varying,
  record_data jsonb,
  deleted_at timestamp with time zone DEFAULT now(),
  deleted_by character varying DEFAULT 'complete_setup_script'::character varying,
  CONSTRAINT _deleted_data_backup_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  role character varying DEFAULT 'admin'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  password_hash text,
  phone character varying,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.branches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  address text NOT NULL,
  governorate character varying NOT NULL,
  phone character varying NOT NULL,
  email character varying,
  working_hours text,
  google_maps_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT branches_pkey PRIMARY KEY (id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  type character varying DEFAULT 'other'::character varying UNIQUE,
  description text,
  image text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sort_order integer DEFAULT 0,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.hero_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  link_url character varying,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  duration integer DEFAULT 5,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hero_slides_pkey PRIMARY KEY (id)
);
CREATE TABLE public.homepage_section_products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL,
  product_id uuid NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT homepage_section_products_pkey PRIMARY KEY (id),
  CONSTRAINT homepage_section_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.homepage_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  section_type character varying NOT NULL CHECK (section_type::text = ANY (ARRAY['hero_carousel'::character varying, 'categories'::character varying, 'products'::character varying]::text[])),
  title character varying NOT NULL,
  subtitle text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  settings jsonb DEFAULT '{"layout": "grid", "columns": 4, "category_type": null, "product_count": 8, "show_view_all": true, "product_source": "manual"}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT homepage_sections_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  message text NOT NULL,
  type character varying NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name character varying,
  product_image text,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  total_price numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  old_status character varying,
  new_status character varying NOT NULL,
  changed_by character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_number character varying UNIQUE,
  customer_name character varying NOT NULL,
  customer_phone character varying NOT NULL,
  address text NOT NULL,
  governorate character varying,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'shipped'::character varying, 'delivered'::character varying, 'replacement_requested'::character varying, 'replaced'::character varying, 'returned'::character varying, 'cancelled'::character varying]::text[])),
  payment_method character varying NOT NULL,
  payment_status character varying DEFAULT 'pending'::character varying CHECK (payment_status::text = ANY (ARRAY['pending'::character varying, 'cash_on_delivery'::character varying, 'collected'::character varying, 'refund_pending'::character varying, 'refunded'::character varying]::text[])),
  total numeric NOT NULL,
  shipping_cost numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  shipping_company character varying,
  estimated_delivery date,
  actual_delivery_date timestamp with time zone,
  customer_notes text,
  admin_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  shipped_at timestamp with time zone,
  completed_at timestamp with time zone,
  shipping_method character varying DEFAULT 'standard'::character varying,
  delivery_type character varying DEFAULT 'shipping'::character varying CHECK (delivery_type::text = ANY (ARRAY['shipping'::character varying, 'pickup'::character varying]::text[])),
  pickup_branch_id uuid,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_pickup_branch_id_fkey FOREIGN KEY (pickup_branch_id) REFERENCES public.branches(id)
);
CREATE TABLE public.product_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  color_name character varying NOT NULL,
  color_code character varying NOT NULL CHECK (color_code::text ~ '^#[0-9A-Fa-f]{6}$'::text),
  is_available boolean DEFAULT true,
  stock_quantity integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_colors_pkey PRIMARY KEY (id),
  CONSTRAINT product_colors_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  image_url text NOT NULL,
  image_path text,
  file_name text,
  alt_text text,
  display_order integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  file_size bigint DEFAULT 0,
  original_file_size bigint DEFAULT 0,
  is_compressed boolean DEFAULT false,
  compression_quality integer DEFAULT 80,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  image text,
  category_id uuid,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_popular boolean DEFAULT false,
  is_new boolean DEFAULT false,
  discount_percentage numeric DEFAULT 0,
  rating numeric DEFAULT 0,
  reviews_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_featured boolean DEFAULT false,
  is_exclusive boolean DEFAULT false,
  sku character varying NOT NULL UNIQUE,
  slug character varying NOT NULL UNIQUE CHECK (slug::text ~ '^[a-z0-9\\-]+$'::text),
  category_type character varying,
  view_count integer DEFAULT 0,
  new_until timestamp with time zone,
  cost_price numeric DEFAULT 0 CHECK (cost_price >= 0::numeric),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT fk_products_category_type FOREIGN KEY (category_type) REFERENCES public.categories(type),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name character varying,
  email character varying,
  avatar_url text,
  phone character varying,
  role character varying DEFAULT 'customer'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.promotions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  image_url text,
  url character varying,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT promotions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  reviewer_name character varying NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.shipping_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  description text,
  logo_url text,
  logo_path text,
  base_shipping_cost numeric NOT NULL DEFAULT 0,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  delivery_time_min integer DEFAULT 1,
  delivery_time_max integer DEFAULT 3,
  contact_phone character varying,
  contact_email character varying,
  website_url character varying,
  terms_conditions text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  free_shipping_threshold numeric DEFAULT 500,
  CONSTRAINT shipping_companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.site_settings (
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (key)
);