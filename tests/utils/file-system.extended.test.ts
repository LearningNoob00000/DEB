// tests/utils/file-system.extended.test.ts
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

describe('FileSystemUtils Extended', () => {
  let fileSystem: FileSystemUtils;

  beforeEach(() => {
    jest.clearAllMocks();
    fileSystem = new FileSystemUtils();
  });

  describe('writeFile', () => {
    it('should write file successfully', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      await fileSystem.writeFile('test.txt', 'content');
      
      expect(fs.mkdir).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith('test.txt', 'content', { encoding: 'utf8' });
    });

    it('should handle permission errors', async () => {
      const error = new Error('Permission denied');
      (error as NodeJS.ErrnoException).code = 'EACCES';
      
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockRejectedValue(error);

      await expect(fileSystem.writeFile('test.txt', 'content'))
        .rejects
        .toThrow(FileSystemError);
      
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('ensureDir', () => {
    it('should create directory if it does not exist', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);

      await fileSystem.ensureDir('/test/dir');
      
      expect(fs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should handle permission errors', async () => {
      const error = new Error('Permission denied');
      (error as NodeJS.ErrnoException).code = 'EACCES';
      
      (fs.mkdir as jest.Mock).mockRejectedValue(error);

      await expect(fileSystem.ensureDir('/test/dir'))
        .rejects
        .toThrow(FileSystemError);
    });
  });

  describe('listFiles', () => {
    it('should list files in directory', async () => {
      const mockFiles = [
        { name: 'file1.txt', isFile: () => true },
        { name: 'file2.txt', isFile: () => true },
        { name: 'dir1', isFile: () => false }
      ];
      
      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const results = await fileSystem.listFiles('/test');
      
      expect(results).toHaveLength(2);
      expect(results).toContain(path.join('/test', 'file1.txt'));
      expect(results).toContain(path.join('/test', 'file2.txt'));
    });

    it('should honor ignore option', async () => {
      const mockFiles = [
        { name: 'file1.txt', isFile: () => true },
        { name: 'ignored.txt', isFile: () => true },
        { name: 'dir1', isFile: () => false }
      ];
      
      (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);

      const results = await fileSystem.listFiles('/test', { ignore: ['ignored.txt'] });
      
      expect(results).toHaveLength(1);
      expect(results).toContain(path.join('/test', 'file1.txt'));
    });

    it('should handle directory not found', async () => {
      const error = new Error('Directory not found');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      
      (fs.readdir as jest.Mock).mockRejectedValue(error);

      await expect(fileSystem.listFiles('/nonexistent'))
        .rejects
        .toThrow(FileSystemError);
    });
  });

  describe('remove', () => {
    it('should remove a file', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false });
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await fileSystem.remove('test.txt');
      
      expect(fs.unlink).toHaveBeenCalledWith('test.txt');
    });

    it('should remove a directory recursively', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true });
      (fs.rm as jest.Mock).mockResolvedValue(undefined);

      await fileSystem.remove('/test/dir');
      
      expect(fs.rm).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    it('should handle non-existent path gracefully', async () => {
      const error = new Error('No such file or directory');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      
      (fs.stat as jest.Mock).mockRejectedValue(error);

      // Should not throw
      await fileSystem.remove('/nonexistent');
    });
  });

  describe('copy', () => {
    it('should copy a file', async () => {
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => false });
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.copyFile as jest.Mock).mockResolvedValue(undefined);

      await fileSystem.copy('source.txt', 'dest.txt');
      
      expect(fs.copyFile).toHaveBeenCalledWith('source.txt', 'dest.txt');
    });

    it('should copy a directory recursively', async () => {
      // First call is for the source directory
      (fs.stat as jest.Mock).mockResolvedValueOnce({ isDirectory: () => true });
      
      // Mock readdir to return some files
      (fs.readdir as jest.Mock).mockResolvedValue(['file1.txt', 'file2.txt']);
      
      // Subsequent stat calls for the files
      (fs.stat as jest.Mock).mockResolvedValueOnce({ isDirectory: () => false });
      (fs.stat as jest.Mock).mockResolvedValueOnce({ isDirectory: () => false });
      
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.copyFile as jest.Mock).mockResolvedValue(undefined);

      await fileSystem.copy('/source', '/dest');
      
      expect(fs.mkdir).toHaveBeenCalledWith('/dest', { recursive: true });
      expect(fs.copyFile).toHaveBeenCalledTimes(2);
    });

    it('should handle source not found', async () => {
      const error = new Error('Source not found');
      (error as NodeJS.ErrnoException).code = 'ENOENT';
      
      (fs.stat as jest.Mock).mockRejectedValue(error);

      await expect(fileSystem.copy('nonexistent.txt', 'dest.txt'))
        .rejects
        .toThrow(FileSystemError);
    });
  });
});