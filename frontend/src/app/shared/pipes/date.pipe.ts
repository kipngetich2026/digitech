import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'appDate', standalone: true })
export class DatePipe implements PipeTransform {
  transform(value: string | null | undefined, withTime = false): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return withTime
      ? d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      : d.toLocaleDateString('en-GB', { dateStyle: 'medium' });
  }
}
