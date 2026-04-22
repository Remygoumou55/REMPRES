export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  image_url: string | null;
  unit: string;
  price_gnf: number;
  stock_quantity: number;
  stock_threshold: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
