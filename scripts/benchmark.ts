import { Benchmark } from '../src/utils/benchmark';
import { ProjectScanner } from '../src/analyzers/project-scanner';
import { ExpressAnalyzer } from '../src/analyzers/express-analyzer';
import { ExpressDockerGenerator } from '../src/generators/express-docker-generator';
import path from 'path';

async function runBenchmarks() {
  const projectPath = path.join(__dirname, '../examples/basic-express');
  const scanner = new ProjectScanner();
  const analyzer = new ExpressAnalyzer();
  const generator = new ExpressDockerGenerator();

  console.log('Running benchmarks...\n');

  // Benchmark Project Scanner
  const scannerResult = await Benchmark.run(
    async () => {
      await scanner.scan(projectPath);
    },
    {
      name: 'Project Scanner',
      iterations: 100,
      warmupIterations: 10
    }
  );

  // Benchmark Express Analyzer
  const analyzerResult = await Benchmark.run(
    async () => {
      await analyzer.analyze(projectPath);
    },
    {
      name: 'Express Analyzer',
      iterations: 100,
      warmupIterations: 10
    }
  );

  // Benchmark Docker Generator
  const projectInfo = await analyzer.analyze(projectPath);
  const generatorResult = await Benchmark.run(
    () => {
      generator.generate(projectInfo, {
        nodeVersion: '18-alpine',
        port: 3000,
        hasTypeScript: true,
        isDevelopment: true
      });
    },
    {
      name: 'Docker Generator',
      iterations: 1000,
      warmupIterations: 100
    }
  );

  // Print results
  console.log('\nBenchmark Results:');
  console.log('-----------------');
  console.log(Benchmark.formatResults({
    scanner: scannerResult,
    analyzer: analyzerResult,
    generator: generatorResult
  }));
}

runBenchmarks().catch(console.error);
