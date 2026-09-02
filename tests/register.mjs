// The source uses extensionless relative imports (what Next/TypeScript resolve
// against). Node's ESM resolver needs the real filename, so retry with the
// extensions the repo actually uses instead of rewriting every import.
import { registerHooks } from 'node:module';

const SUFFIXES = ['.ts', '/index.ts'];

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.')) throw error;

      for (const suffix of SUFFIXES) {
        try {
          return nextResolve(specifier + suffix, context);
        } catch {
          // try the next candidate
        }
      }

      throw error;
    }
  },
});
