// Tells TypeScript that *.css files are valid side-effect imports (handled by Vite at runtime).
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
