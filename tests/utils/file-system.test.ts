// tests/utils/file-system.test.ts
import { FileSystemUtils, FileSystemError } from '../../src/utils/file-system';
import { promises as fs } from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
    rm: jest.fn(),
    copyFile: jest.fn(),
  }
}));

describe('FileSystemUtils', () => {
  let fileSystem: FileSystemUtils;

  beforeEach(() => {
    fileSystem = new FileSystemUtils();
    jest.clearAllMocks();
  });

  describe('readFile', () => {
    it('should read file successfully', async () => {
      const content = 'file content';
      (fs.readFile as jest.Mock).mockResolvedValue(content);

      const result = await fileSystem.readFile('test.txt');
      expect(result).toBe(content);
    });

    it('should handle file not found error', async () => {
      const error: NodeJS.ErrnoException = new Error('ENOENT');
      error.code = 'ENOENT';
      (fs.readFile as jest.Mock).mockRejectedValue(error);

      await expect(fileSystem.readFile('nonexistent.txt'))
        .rejects
        .toThrow(FileSystemError);
    });
  });

  describe('findFiles', () => {
    it('should find files matching patterns', async () => {
      const mockFiles = [
        { name: 'test.ts', isDirectory: () => false },
        { name: 'test.js', isDirectory: () => false },
      ];
      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const results = await fileSystem.findFiles('.', ['*.ts']);
      expect(results).toHaveLength(1);
      expect(results[0]).toContain('test.ts');
    });

    it('should ignore specified directories', async () => {
      const mockFiles = [
        { name: 'node_modules', isDirectory: () => true },
        { name: 'test.ts', isDirectory: () => false },
      ];
      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const results = await fileSystem.findFiles('.', ['*.ts'], {
        ignore: ['node_modules']
      });
      expect(results).toHaveLength(1);
    });
  });
});
