// 질문을 AI 서비스로 보내기 전에 검사한다. 화면과 서버가 함께 쓴다.
import { MAX_QUESTION_LENGTH } from "@/lib/constants";

export type InputErrorCode = "INVALID_INPUT" | "TOO_LONG" | "PERSONAL_INFO";

// 앞뒤에 다른 숫자가 붙지 않은 경우만 잡아, 금액이나 긴 번호를 잘못 막지 않게 한다.
const PERSONAL_INFO_PATTERNS = [
  // 휴대전화 번호: 010-1234-5678, 01012345678
  /(?<!\d)01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}(?!\d)/,
  // 지역 전화번호: 02-123-4567. 일반 숫자와 구분하기 위해 구분 기호가 있을 때만 막는다.
  /(?<!\d)0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}(?!\d)/,
  // 주민등록번호: 900101-1234567, 13자리 연속 숫자
  /(?<!\d)\d{6}[-\s]?\d{7}(?!\d)/,
];

// 문제가 있으면 오류 코드를, 없으면 null을 돌려준다.
export function validateQuestion(question: unknown): InputErrorCode | null {
  if (typeof question !== "string" || question.trim() === "") {
    return "INVALID_INPUT";
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return "TOO_LONG";
  }
  if (PERSONAL_INFO_PATTERNS.some((pattern) => pattern.test(question))) {
    return "PERSONAL_INFO";
  }
  return null;
}
