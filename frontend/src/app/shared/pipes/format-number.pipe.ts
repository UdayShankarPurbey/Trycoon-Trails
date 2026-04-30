import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ttFormatNumber' })
export class FormatNumberPipe implements PipeTransform {
  transform(value: number | string | null | undefined, decimals = 1): string {
    if (value === null || value === undefined) return '0';
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) return '0';
    if (Math.abs(n) < 1000) return n.toLocaleString('en-US');
    if (Math.abs(n) < 1_000_000) return `${(n / 1000).toFixed(decimals)}k`;
    if (Math.abs(n) < 1_000_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`;
    return `${(n / 1_000_000_000).toFixed(decimals)}B`;
  }
}
