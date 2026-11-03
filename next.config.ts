import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// 부분 사전 렌더링(partialPrefetching)과 맞지 않는 nonce 방식 대신, Next.js 문서의 "nonce 없는" CSP를 쓴다.
// 개발 서버는 오류 정보를 만들 때 eval을 쓰므로 개발 중에만 'unsafe-eval'을 허용한다.
// upgrade-insecure-requests는 http://localhost 개발 화면을 깨뜨릴 수 있어 운영에서만 켠다.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  // 스크립트와 연결을 같은 사이트로 제한하고, 다른 사이트가 이 화면을 iframe에 넣지 못하게 한다.
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // CSP를 모르는 옛 브라우저를 위한 같은 목적의 헤더
  { key: "X-Frame-Options", value: "DENY" },
  // 파일 종류를 브라우저가 멋대로 추측하지 못하게 한다.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 다른 사이트로 이동할 때 주소 전체를 넘기지 않는다.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 쓰지 않는 기기 기능(카메라, 마이크, 위치)을 막는다.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // 운영(https)에서만 브라우저가 항상 https로 접속하게 한다.
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 응답에 사용 중인 프레임워크 이름(x-powered-by)을 싣지 않는다.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
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
