export interface ExpressAnalysisResult {
  hasExpress: boolean;
  version: string;
  mainFile: string;
  port: number;
  middleware: string[];
  hasTypeScript: boolean;
}
