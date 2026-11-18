import { BaseEntity } from './api.models';
import { PopulatedUserRef } from './catalog.models';

export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'SALE' | 'RETURN';

export interface StockMovement extends BaseEntity {
  movementNumber: string;
  productId: string | PopulatedProductRef;
  branchId: string;
  movementType: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  orderId?: string;
  reference?: string;
  createdBy: string | PopulatedUserRef;
}

export interface PopulatedProductRef {
  _id?: string;
  sku: string;
  name: string;
  category: string;
  stockQuantity?: number;
}

export interface CreateStockMovementRequest {
  productId: string;
  movementType: Exclude<MovementType, 'SALE'>;
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface InventorySummary {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  stockValue: number;
  costValue: number;
}

export interface StockListItem {
  _id: string;
  sku: string;
  name: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  branchId: string;
  isActive: boolean;
}

export interface LowStockItem {
  _id: string;
  sku: string;
  name: string;
  category: string;
  stockQuantity: number;
  reorderLevel: number;
  branchId: string;
}
