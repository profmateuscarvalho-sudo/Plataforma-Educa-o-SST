// Ambient declaration so JSON translation files import cleanly under the
// project's locked tsconfig (resolveJsonModule is not set there). Vite handles
// the actual JSON import at build time; this just satisfies TypeScript.
declare module '*.json' {
  const value: Record<string, unknown>
  export default value
}
