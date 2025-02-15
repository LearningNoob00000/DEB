// src/cli / formatters / index.ts
import Table from 'cli-table3';

export interface OutputFormatter {
  format(data: any): string;
}

export class JsonFormatter implements OutputFormatter {
  format(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}

export class TableFormatter implements OutputFormatter {
  format(data: any): string {
    const table = new Table({
      head: ['Property', 'Value']
    });

    Object.entries(data).forEach(([key, value]) => {
      table.push([key, this.formatValue(value)]);
    });

    return table.toString();
  }

  private formatValue(value: any): string {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
