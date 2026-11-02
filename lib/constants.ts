// 화면과 서버가 함께 쓰는 고정 문구와 제한값. 문구는 PRD에 적힌 그대로 유지한다.

// 문서에서 답을 찾지 못했을 때의 답변
export const NOT_FOUND_MESSAGE =
  "규정 문서에서 찾지 못했습니다. 휴가는 인사팀, 경비는 재무팀에 문의해 주세요.";

// 답변 아래에 고정으로 표시하는 주의 문구
export const DISCLAIMER_MESSAGE =
  "실습용 샘플 규정 기준이며, 실제 처리 전에는 담당자에게 확인하세요.";

// 30초 안에 답이 없거나 오류가 났을 때의 안내
export const ERROR_MESSAGE =
  "지금은 답변할 수 없습니다. 잠시 후 다시 시도하거나 담당자에게 문의해 주세요.";

// 입력창에 항상 표시하는 안내
export const PERSONAL_INFO_NOTICE = "개인정보를 입력하지 마세요.";

// 질문 최대 글자 수
export const MAX_QUESTION_LENGTH = 500;

// 답변을 기다리는 최대 시간 (밀리초)
export const RESPONSE_TIMEOUT_MS = 30_000;

// 규정 내용을 답할 때 표시하는 근거 개수
export const MIN_CITATIONS = 1;
export const MAX_CITATIONS = 3;
