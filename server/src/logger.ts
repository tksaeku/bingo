/** Arbitrary structured fields attached to a log line. */
type LogFields = Record<string, unknown>;

/** Structured logger: object or error first, message second. */
export type Logger = {
  info: (fields: LogFields, message: string) => void;
  warn: (fields: LogFields, message: string) => void;
  error: (error: unknown, message: string) => void;
};

/** Converts a thrown value into loggable fields without losing the stack. */
function serializeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { value: String(error) };
}

const SEVERITY_BY_LEVEL: Record<string, string> = { info: 'INFO', warn: 'WARNING', error: 'ERROR' };

/** Writes one JSON log line with `level` and the Cloud Logging `severity` field. */
function write(stream: NodeJS.WriteStream, level: string, moduleName: string, fields: LogFields, message: string): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  const line = JSON.stringify({ severity: SEVERITY_BY_LEVEL[level], level, time: new Date().toISOString(), module: moduleName, message, ...fields });
  stream.write(`${line}\n`);
}

/**
 * Creates a structured JSON logger tagged with a module name.
 * Silent when NODE_ENV is "test".
 */
export function createLogger(moduleName: string): Logger {
  return {
    info: (fields, message): void => write(process.stdout, 'info', moduleName, fields, message),
    warn: (fields, message): void => write(process.stdout, 'warn', moduleName, fields, message),
    error: (error, message): void => write(process.stderr, 'error', moduleName, { error: serializeError(error) }, message),
  };
}
