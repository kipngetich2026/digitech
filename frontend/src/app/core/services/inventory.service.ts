import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CreateStockMovementRequest,
  InventorySummary,
  LowStockItem,
  StockListItem,
  StockMovement,
} from '../models/inventory.models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly api = inject(ApiService);

  summary(): Observable<InventorySummary> {
    return this.api.get<InventorySummary>('/inventory/summary');
  }
  stock(): Observable<StockListItem[]> {
    return this.api.get<StockListItem[]>('/inventory/stock');
  }
  lowStock(): Observable<LowStockItem[]> {
    return this.api.get<LowStockItem[]>('/inventory/low-stock');
  }
  outOfStock(): Observable<LowStockItem[]> {
    return this.api.get<LowStockItem[]>('/inventory/out-of-stock');
  }
  movements(): Observable<StockMovement[]> {
    return this.api.get<StockMovement[]>('/inventory/movements');
  }
  productMovements(productId: string): Observable<StockMovement[]> {
    return this.api.get<StockMovement[]>(`/inventory/product/${productId}/movements`);
  }
  createMovement(req: CreateStockMovementRequest): Observable<StockMovement> {
    return this.api.post<StockMovement>('/inventory/movement', req);
  }
}
