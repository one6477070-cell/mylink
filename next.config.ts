import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 개발 중 왼쪽 아래에 뜨는 Next.js 개발 도구 버튼(영어)을 숨긴다. 배포된 사이트에는 원래 안 보인다
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
