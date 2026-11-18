import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'kes', standalone: true })
export class KesPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 2,
    }).format(value);
  }
}
