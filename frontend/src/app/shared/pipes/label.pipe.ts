import { Pipe, PipeTransform } from '@angular/core';

/** Turns enum-like strings into Title Case labels (PENDING → Pending). */
@Pipe({ name: 'label', standalone: true })
export class LabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return value
      .toLowerCase()
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
