import { performance } from 'perf_hooks';

export interface BenchmarkResult {
  name: string;
  duration: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  operationsPerSecond: number;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  name?: string;
}

export class Benchmark {
  private static defaultOptions: Required<BenchmarkOptions> = {
    iterations: 1000,
    warmupIterations: 100,
    name: 'Unnamed Benchmark'
  };

  /**
   * Run a benchmark test on the provided function
   * @param fn Function to benchmark
   * @param options Benchmark options
   */
  static async run(
    fn: () => Promise<void> | void,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    const opts = { ...this.defaultOptions, ...options };

    // Warmup phase
    for (let i = 0; i < opts.warmupIterations; i++) {
      await fn();
    }

    // Clear garbage before starting
    if (global.gc) {
      global.gc();
    }

    const startMemory = process.memoryUsage();
    const startTime = performance.now();

    // Main benchmark
    for (let i = 0; i < opts.iterations; i++) {
      await fn();
    }

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const duration = endTime - startTime;
    const operationsPerSecond = (opts.iterations / duration) * 1000;

    const memoryUsage = {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external,
      rss: endMemory.rss - startMemory.rss
    };

    return {
      name: opts.name,
      duration,
      memoryUsage,
      operationsPerSecond
    };
  }

  /**
   * Compare multiple functions performance
   * @param tests Record of named test functions
   * @param options Benchmark options
   */
  static async compare(
    tests: Record<string, () => Promise<void> | void>,
    options: Omit<BenchmarkOptions, 'name'> = {}
  ): Promise<Record<string, BenchmarkResult>> {
    const results: Record<string, BenchmarkResult> = {};

    for (const [name, fn] of Object.entries(tests)) {
      results[name] = await this.run(fn, { ...options, name });
    }

    return results;
  }

  /**
   * Format benchmark results for display
   * @param results Benchmark results to format
   */
  static formatResults(
    results: BenchmarkResult | Record<string, BenchmarkResult>
  ): string {
    if ('name' in results) {
      return this.formatSingleResult(results as BenchmarkResult);
    }

    return Object.entries(results as Record<string, BenchmarkResult>)
      .map(([_, result]) => this.formatSingleResult(result))
      .join('\n\n');
  }

  private static formatSingleResult(result: BenchmarkResult): string {
    const mb = 1024 * 1024;
    return `
Benchmark: ${result.name}
Duration: ${result.duration.toFixed(2)}ms
Operations/sec: ${result.operationsPerSecond.toFixed(2)}
Memory Usage:
  Heap Used: ${(result.memoryUsage.heapUsed / mb).toFixed(2)} MB
  Heap Total: ${(result.memoryUsage.heapTotal / mb).toFixed(2)} MB
  External: ${(result.memoryUsage.external / mb).toFixed(2)} MB
  RSS: ${(result.memoryUsage.rss / mb).toFixed(2)} MB
`.trim();
  }
}
