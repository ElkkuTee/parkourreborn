/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.
