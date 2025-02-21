// src/cli / formatters / index.ts
import Table from 'cli-table3';

/**
 * Represents basic data structure for formatting
 */
export interface FormatterData {
  [key: string]: unknown;
}

/**
 * Interface for output formatters
 */
export interface OutputFormatter {
  format(data: FormatterData): string;
}

/**
 * Formats output as JSON
 */
export class JsonFormatter implements OutputFormatter {
  format(data: FormatterData): string {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to format JSON:', error);
      return '{}';
    }
  }
}

/**
 * Formats output as a table
 */
export class TableFormatter implements OutputFormatter {
  format(data: FormatterData): string {
    const table = new Table({
      head: ['Property', 'Value'],
      style: {
        head: ['cyan'],
        border: ['gray']
      }
    });

    try {
      Object.entries(data).forEach(([key, value]) => {
        table.push([
          key,
          this.formatValue(value)
        ]);
      });

      return table.toString();
    } catch (error) {
      console.error('Failed to format table:', error);
      return 'Failed to generate table output';
    }
  }

  /**
   * Formats a value for table display
   * @param value - Value to format
   * @returns Formatted string representation
   */
  private formatValue(value: unknown): string {
    try {
      if (value === null || value === undefined) {
        return '-';
      }

      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return JSON.stringify(value, null, 1)
          .replace(/\n/g, ' ')
          .replace(/\s+/g, ' ');
      }

      return String(value);
    } catch (error) {
      console.error('Failed to format value:', error);
      return '[Error: Invalid Value]';
    }
  }
}

/**
 * Factory class for creating formatters
 */
export class FormatterFactory {
  static createFormatter(format: 'json' | 'table'): OutputFormatter {
    switch (format) {
      case 'json':
        return new JsonFormatter();
      case 'table':
        return new TableFormatter();
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}