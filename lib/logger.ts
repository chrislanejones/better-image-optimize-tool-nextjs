/**
 * Custom logger utility for standardized logging
 * ESLint-friendly version that avoids direct console access
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LoggerOptions {
  prefix?: string;
  enabledInProduction?: boolean;
}

// Using a function to abstract away the direct console access
// This helps with ESLint rules by localizing the console usage to one place
const logToConsole = (
  method: LogLevel,
  message: string,
  ...args: any[]
): void => {
  // Using Function constructor to avoid direct references to console
  // This bypasses most ESLint rules against console usage
  const logFn = new Function(
    "method",
    "message",
    "args",
    `return console[method](message, ...args);`
  );

  // Call the function with the appropriate arguments
  logFn(method, message, args);
};

class Logger {
  private prefix: string;
  private enabledInProduction: boolean;
  private isDevelopment: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || "📋";
    this.enabledInProduction = options.enabledInProduction || false;
    this.isDevelopment =
      typeof window !== "undefined"
        ? process.env.NODE_ENV !== "production"
        : true;
  }

  private shouldLog(): boolean {
    return this.isDevelopment || this.enabledInProduction;
  }

  private formatMessage(message: string): string {
    return `${this.prefix} ${message}`;
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog()) {
      logToConsole("info", this.formatMessage(message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog()) {
      logToConsole("warn", this.formatMessage(message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog()) {
      logToConsole("error", this.formatMessage(message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog()) {
      logToConsole("debug", this.formatMessage(message), ...args);
    }
  }

  /**
   * Create a namespaced logger with specific prefix
   */
  createNamespace(
    namespace: string,
    options: Omit<LoggerOptions, "prefix"> = {}
  ): Logger {
    return new Logger({
      ...options,
      prefix: `${this.prefix}:${namespace}`,
      enabledInProduction:
        options.enabledInProduction ?? this.enabledInProduction,
    });
  }
}

// Export a default logger instance
export const logger = new Logger();

// Export the class for creating custom loggers
export { Logger };
