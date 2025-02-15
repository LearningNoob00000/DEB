// tests/helpers/test-utils.ts
import { join } from 'path';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';

export class TestUtils {
  /**
   * Creates a temporary test directory
   */
  static async createTempDir(): Promise<string> {
    const testDir = join(tmpdir(), `deb-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    return testDir;
  }

  /**
   * Creates a mock project structure for testing
   */
  static async createMockProject(dir: string, files: Record<string, string>): Promise<void> {
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = join(dir, filePath);
      await fs.mkdir(join(fullPath, '..'), { recursive: true });
      await fs.writeFile(fullPath, content);
    }
  }

  /**
   * Cleans up test directories
   */
  static async cleanup(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup ${dir}:`, error);
    }
  }
}
