// src/utils/file-system.ts
import { promises as fs } from 'fs';
import path from 'path';

export class FileSystemError extends Error {
  constructor(message: string, public readonly path: string) {
    super(`FileSystem Error: ${message} (path: ${path})`);
    this.name = 'FileSystemError';
  }
}

export interface FileSystemOptions {
  encoding?: BufferEncoding;
  ignore?: string[];
}

export class FileSystemUtils {
  /**
   * Safely reads a file with error handling
   * @param filePath - Path to the file
   * @param options - Optional file reading options
   */
  public async readFile(filePath: string, options: FileSystemOptions = {}): Promise<string> {
    try {
      const encoding = options.encoding || 'utf8';
      return await fs.readFile(filePath, { encoding });
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new FileSystemError('File not found', filePath);
        }
        if ((error as NodeJS.ErrnoException).code === 'EACCES') {
          throw new FileSystemError('Permission denied', filePath);
        }
      }
      throw new FileSystemError('Failed to read file', filePath);
    }
  }

  /**
   * Safely writes a file with error handling
   * @param filePath - Path to the file
   * @param content - Content to write
   * @param options - Optional file writing options
   */
  public async writeFile(filePath: string, content: string, options: FileSystemOptions = {}): Promise<void> {
    try {
      const encoding = options.encoding || 'utf8';
      // Ensure the directory exists before writing
      await this.ensureDir(path.dirname(filePath));
      await fs.writeFile(filePath, content, { encoding });
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') {
          throw new FileSystemError('Permission denied', filePath);
        }
      }
      throw new FileSystemError('Failed to write file', filePath);
    }
  }

  /**
   * Checks if a file exists
   * @param filePath - Path to the file
   */
  public async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensures a directory exists, creating it if necessary
   * @param dirPath - Path to the directory
   */
  public async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'EACCES') {
          throw new FileSystemError('Permission denied', dirPath);
        }
      }
      throw new FileSystemError('Failed to create directory', dirPath);
    }
  }

  /**
   * Lists files in a directory
   * @param dirPath - Path to the directory
   * @param options - Optional listing options
   */
  public async listFiles(dirPath: string, options: FileSystemOptions = {}): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true });
      const ignore = new Set(options.ignore || []);

      return files
        .filter(file => file.isFile() && !ignore.has(file.name))
        .map(file => path.join(dirPath, file.name));
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new FileSystemError('Directory not found', dirPath);
        }
        if ((error as NodeJS.ErrnoException).code === 'EACCES') {
          throw new FileSystemError('Permission denied', dirPath);
        }
      }
      throw new FileSystemError('Failed to list directory', dirPath);
    }
  }

  /**
   * Finds files matching specific patterns recursively
   * @param dir - Directory to search in
   * @param patterns - File patterns to match
   * @param options - Optional search options
   */
  public async findFiles(
    dir: string,
    patterns: string[],
    options: FileSystemOptions = {}
  ): Promise<string[]> {
    const results: string[] = [];
    const ignore = new Set(options.ignore || ['node_modules', '.git']);

    async function walk(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          // Skip ignored directories
          if (entry.isDirectory() && ignore.has(entry.name)) {
            continue;
          }

          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (patterns.some(pattern => {
            if (pattern.includes('*')) {
              const regex = new RegExp(pattern.replace('*', '.*'));
              return regex.test(entry.name);
            }
            return entry.name === pattern;
          })) {
            results.push(fullPath);
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          if ((error as NodeJS.ErrnoException).code === 'EACCES') {
            console.warn(`Warning: Permission denied for ${currentDir}`);
            return;
          }
        }
        throw new FileSystemError('Failed to scan directory', currentDir);
      }
    }

    await walk(dir);
    return results;
  }

  /**
   * Removes a file or directory
   * @param path - Path to remove
   * @param options - Optional removal options
   */
  public async remove(path: string, options: FileSystemOptions = {}): Promise<void> {
    try {
      const stats = await fs.stat(path);
      if (stats.isDirectory()) {
        await fs.rm(path, { recursive: true });
      } else {
        await fs.unlink(path);
      }
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          return; // File/directory doesn't exist, consider it removed
        }
        if ((error as NodeJS.ErrnoException).code === 'EACCES') {
          throw new FileSystemError('Permission denied', path);
        }
      }
      throw new FileSystemError('Failed to remove path', path);
    }
  }

  /**
   * Copies a file or directory
   * @param src - Source path
   * @param dest - Destination path
   * @param options - Optional copy options
   */
  public async copy(src: string, dest: string, options: FileSystemOptions = {}): Promise<void> {
    try {
      const stats = await fs.stat(src);

      if (stats.isDirectory()) {
        await this.ensureDir(dest);
        const files = await fs.readdir(src);

        await Promise.all(files.map(file =>
          this.copy(
            path.join(src, file),
            path.join(dest, file),
            options
          )
        ));
      } else {
        await this.ensureDir(path.dirname(dest));
        await fs.copyFile(src, dest);
      }
    } catch (error) {
      if (error instanceof Error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new FileSystemError('Source not found', src);
        }
        if ((error as NodeJS.ErrnoException).code === 'EACCES') {
          throw new FileSystemError('Permission denied', src);
        }
      }
      throw new FileSystemError('Failed to copy', src);
    }
  }
}
