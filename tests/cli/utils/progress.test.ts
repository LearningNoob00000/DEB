// tests/cli/utils/progress.test.ts
import { ProgressIndicator } from '../../../src/cli/utils/progress';

describe('ProgressIndicator', () => {
  let progress: ProgressIndicator;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    progress = new ProgressIndicator();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should show start message', () => {
    progress.start('Loading...');
    expect(consoleLogSpy).toHaveBeenCalledWith('⏳ Loading...');
  });

  it('should show success message', () => {
    progress.succeed('Done!');
    expect(consoleLogSpy).toHaveBeenCalledWith('✅ Done!');
  });

  it('should show failure message', () => {
    progress.fail('Error!');
    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Error!');
  });
});
