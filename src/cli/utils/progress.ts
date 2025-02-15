// src/cli/utils/progress.ts
export class ProgressIndicator {
  start(text: string): void {
    console.log(`⏳ ${text}`);
  }

  succeed(text: string): void {
    console.log(`✅ ${text}`);
  }

  fail(text: string): void {
    console.error(`❌ ${text}`);
  }
}
