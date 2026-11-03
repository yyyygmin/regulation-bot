// 접속 주소(IP)별 호출 횟수를 센다. 서버에서만 불러온다.
// 횟수는 서버 메모리에 두므로 서버가 다시 시작되면 0으로 돌아가고, 서버 인스턴스가 여러 개면 인스턴스마다 따로 센다.
// 그래서 비용을 지키는 마지막 방어선이 아니다. 실제 AI를 연결할 때는 Vercel의 방화벽 규칙과 AI 서비스의 지출 한도를 함께 쓴다.
import { RATE_LIMIT_PER_HOUR, RATE_LIMIT_PER_MINUTE } from "@/lib/constants";

interface Counter {
  count: number;
  resetAt: number;
}

const LIMITS = [
  { name: "minute", max: RATE_LIMIT_PER_MINUTE, windowMs: 60_000 },
  { name: "hour", max: RATE_LIMIT_PER_HOUR, windowMs: 3_600_000 },
];
// 기억해 두는 주소 수의 상한. 넘으면 지난 기록부터 지워 서버 메모리가 계속 늘지 않게 한다.
const MAX_TRACKED_KEYS = 10_000;

const counters = new Map<string, Counter>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function removeExpired(now: number) {
  for (const [key, counter] of counters) {
    if (counter.resetAt <= now) {
      counters.delete(key);
    }
  }
}

// 이번 요청을 세고, 허용할지 알려준다. 거절된 요청은 횟수에 더하지 않는다.
export function checkRateLimit(
  ip: string,
  now: number = Date.now(),
): RateLimitResult {
  if (counters.size > MAX_TRACKED_KEYS) {
    removeExpired(now);
    while (counters.size > MAX_TRACKED_KEYS) {
      const oldest = counters.keys().next().value;
      if (oldest === undefined) {
        break;
      }
      counters.delete(oldest);
    }
  }

  const current = LIMITS.map(({ name, max, windowMs }) => {
    const key = `${name}:${ip}`;
    const existing = counters.get(key);
    const counter =
      existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + windowMs };
    return { key, max, counter };
  });

  const exceeded = current.filter(({ counter, max }) => counter.count >= max);
  if (exceeded.length > 0) {
    const waitMs = Math.max(
      ...exceeded.map(({ counter }) => counter.resetAt - now),
    );
    return { allowed: false, retryAfterSeconds: Math.ceil(waitMs / 1000) };
  }

  for (const { key, counter } of current) {
    counter.count += 1;
    counters.set(key, counter);
  }
  return { allowed: true };
}

// 요청을 보낸 접속 주소. Vercel은 이 헤더를 직접 채우므로 사용자가 바꿀 수 없다.
// 다른 곳에 올릴 때는 앞단의 서버가 이 헤더를 믿을 수 있게 채워 주는지 확인해야 한다.
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

// 시험에서 횟수를 처음으로 되돌리는 데 쓴다.
export function resetRateLimits() {
  counters.clear();
}
