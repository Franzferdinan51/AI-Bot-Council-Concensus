import { promises as fs } from 'fs';
import { randomBytes } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CodeExecutionRequest {
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'go' | 'rust';
  code: string;
  input?: string;
  timeout?: number;
  tests?: string[];
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  memoryUsage?: number;
  testsPassed: number;
  testsFailed: number;
  testResults?: Array<{
    name: string;
    passed: boolean;
    error?: string;
  }>;
  suggestions: string[];
  securityWarnings?: string[];
  performanceMetrics?: {
    cpuTime: number;
    wallTime: number;
    memoryPeak: number;
  };
}

export class LiveCodeExecutionService {
  private tempDir: string = './temp-exec';
  private executionCount: number = 0;

  constructor() { }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.error('[LiveCodeExec] Service initialized');
    } catch (error) {
      console.error('[LiveCodeExec] Failed to initialize:', error);
    }
  }

  async executeCode(request: CodeExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();

    try {
      // Security validation
      const securityWarnings = await this.validateSecurity(request.code, request.language);
      if (securityWarnings.length > 0) {
        return {
          success: false,
          output: '',
          error: `Security warnings detected: ${securityWarnings.join(', ')}`,
          executionTime: Date.now() - startTime,
          testsPassed: 0,
          testsFailed: 0,
          suggestions: ['Review security warnings', 'Remove potentially unsafe operations']
        };
      }

      // Write code to temporary file
      const filePath = await this.writeCodeToFile(request, sessionId);

      // Execute the code
      const result = await this.runCode(request, filePath, sessionId);

      // Run tests if provided
      if (request.tests && request.tests.length > 0) {
        const testResults = await this.runTests(request, filePath, sessionId);
        result.testsPassed = testResults.filter(t => t.passed).length;
        result.testsFailed = testResults.filter(t => !t.passed).length;
        result.testResults = testResults;

        if (result.testsFailed > 0) {
          result.suggestions.push('Review failing tests', 'Fix edge cases');
        }
      }

      // Generate suggestions based on result
      result.suggestions = this.generateSuggestions(result);

      // Cleanup
      await this.cleanup(sessionId);

      return result;
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        testsPassed: 0,
        testsFailed: 0,
        suggestions: ['Check code syntax', 'Verify dependencies', 'Review error logs']
      };
    }
  }

  async runSecurityScan(code: string, language: string): Promise<string[]> {
    const warnings: string[] = [];

    // Check for dangerous operations
    const dangerousPatterns = [
      { pattern: /require\s*\(\s*['"]fs['"]/, warning: 'File system access detected' },
      { pattern: /require\s*\(\s*['"]child_process['"]/, warning: 'Process execution detected' },
      { pattern: /eval\s*\(/, warning: 'Dynamic code evaluation (eval) detected' },
      { pattern: /Function\s*\(/, warning: 'Dynamic function creation detected' },
      { pattern: /import\s+.*\s+from\s+['"]fs['"]/, warning: 'File system import detected' },
      { pattern: /__dirname|__filename/, warning: 'File path exposure detected' }
    ];

    dangerousPatterns.forEach(({ pattern, warning }) => {
      if (pattern.test(code)) {
        warnings.push(warning);
      }
    });

    return warnings;
  }

  async generateTestSuite(code: string, language: string): Promise<string[]> {
    const tests: string[] = [];

    switch (language) {
      case 'javascript':
      case 'typescript':
        tests.push(`
const assert = require('assert');

// Test Suite
console.error('Running tests...');

// Test 1: Basic functionality
try {
  // Add your tests here
  console.error('Test 1: PASS');
} catch (error) {
  console.error('Test 1: FAIL -', error.message);
}
`);
        break;

      case 'python':
        tests.push(`
import unittest

class TestCode(unittest.TestCase):
    def test_basic(self):
        # Add your tests here
        self.assertTrue(True)

if __name__ == '__main__':
    unittest.main()
`);
        break;

      case 'java':
        tests.push(`
public class TestCode {
    public static void main(String[] args) {
        System.out.println("Running tests...");
        // Add your tests here
        System.out.println("Test 1: PASS");
    }
}
`);
        break;
    }

    return tests;
  }

  async benchmark(code: string, language: CodeExecutionRequest['language'], iterations: number = 100): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    standardDeviation: number;
  }> {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await this.executeCode({ language, code });
      times.push(Date.now() - start);
    }

    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const variance =
      times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      averageTime,
      minTime,
      maxTime,
      standardDeviation
    };
  }

  private async writeCodeToFile(request: CodeExecutionRequest, sessionId: string): Promise<string> {
    const extension = this.getFileExtension(request.language);
    const filePath = `${this.tempDir}/${sessionId}${extension}`;

    await fs.writeFile(filePath, request.code);

    return filePath;
  }

  private async runCode(request: CodeExecutionRequest, filePath: string, sessionId: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      let command = this.getExecutionCommand(request.language, filePath, request.input);

      const { stdout, stderr } = await execAsync(command, {
        timeout: request.timeout || 10000,
        maxBuffer: 1024 * 1024
      });

      return {
        success: true,
        output: stdout || stderr,
        executionTime: Date.now() - startTime,
        testsPassed: 0,
        testsFailed: 0,
        suggestions: []
      };
    } catch (error: any) {
      return {
        success: false,
        output: '',
        error: error.message,
        executionTime: Date.now() - startTime,
        testsPassed: 0,
        testsFailed: 0,
        suggestions: ['Fix runtime errors', 'Check input parameters']
      };
    }
  }

  private async runTests(
    request: CodeExecutionRequest,
    filePath: string,
    sessionId: string
  ): Promise<Array<{ name: string; passed: boolean; error?: string }>> {
    const results: Array<{ name: string; passed: boolean; error?: string }> = [];

    for (const test of request.tests!) {
      try {
        const testCommand = this.getTestCommand(request.language, filePath, test);
        await execAsync(testCommand, { timeout: 5000 });

        results.push({ name: test, passed: true });
      } catch (error) {
        results.push({
          name: test,
          passed: false,
          error: error instanceof Error ? error.message : 'Test failed'
        });
      }
    }

    return results;
  }

  private async validateSecurity(code: string, language: string): Promise<string[]> {
    return this.runSecurityScan(code, language);
  }

  private generateSuggestions(result: ExecutionResult): string[] {
    const suggestions: string[] = [];

    if (!result.success && result.error) {
      if (result.error.includes('SyntaxError')) {
        suggestions.push('Fix syntax errors');
      } else if (result.error.includes('TypeError')) {
        suggestions.push('Check variable types');
      } else if (result.error.includes('ReferenceError')) {
        suggestions.push('Verify variable declarations');
      }
    }

    if (result.testsFailed > 0) {
      suggestions.push('Review failing tests');
      suggestions.push('Add edge case handling');
    }

    if (result.success && result.output) {
      suggestions.push('Code executed successfully');
      suggestions.push('Consider adding more test coverage');
    }

    return suggestions;
  }

  private getExecutionCommand(language: string, filePath: string, input?: string): string {
    const cmd = {
      javascript: `node ${filePath}`,
      typescript: `ts-node ${filePath}`,
      python: `python3 ${filePath}`,
      java: `javac ${filePath} && java ${filePath.replace('.java', '')}`,
      go: `go run ${filePath}`,
      rust: `rustc ${filePath} && ./${filePath.replace('.rs', '')}`
    };

    let command = cmd[language as keyof typeof cmd] || `node ${filePath}`;

    if (input) {
      command += ` <<< '${input}'`;
    }

    return command;
  }

  private getTestCommand(language: string, filePath: string, test: string): string {
    return this.getExecutionCommand(language, filePath);
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      java: '.java',
      go: '.go',
      rust: '.rs'
    };
    return extensions[language] || '.txt';
  }

  private async cleanup(sessionId: string): Promise<void> {
    try {
      const files = await fs.readdir(this.tempDir);
      await Promise.all(
        files
          .filter((f) => f.startsWith(sessionId))
          .map((f) => fs.unlink(`${this.tempDir}/${f}`))
      );
    } catch (error) {
      console.error('[LiveCodeExec] Cleanup error:', error);
    }
  }

  private generateSessionId(): string {
    this.executionCount++;
    return `exec_${Date.now()}_${this.executionCount}`;
  }
}

// Export singleton instance
export const liveCodeExecutionService = new LiveCodeExecutionService();
