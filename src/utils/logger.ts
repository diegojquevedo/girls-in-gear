const isDevelopment = import.meta.env.DEV;

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`%c${message}`, 'background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 4px;', ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`%c${message}`, 'background: #ffebee; color: #c62828; padding: 2px 8px; border-radius: 4px;', ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`%c${message}`, 'background: #fffde7; color: #f9a825; padding: 2px 8px; border-radius: 4px;', ...args);
  },
  success: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.log(`%c${message}`, 'background: #e3f2fd; color: #2e7d32; padding: 2px 8px; border-radius: 4px;', ...args);
    }
  }
}; 