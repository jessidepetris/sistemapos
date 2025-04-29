import { UseFormReturn } from "react-hook-form";

export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  children?: Category[];
  slug: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  contactName?: string | null;
  lastPriceUpdate?: Date | null;
  discount?: string | null;
}

export interface GeneralTabProps {
  form: UseFormReturn<any>;
  suppliers: Supplier[];
  onTabChange?: (tabValue: string) => void;
} 