export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  image_url: string | null;
  unit: string;
  price_gnf: number;
  cost_price_gnf: number | null;
  margin_pct: number | null;
  stock_quantity: number;
  stock_threshold: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by?: string | null;
};
