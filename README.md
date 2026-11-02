# 규정봇

신입사원이 휴가·경비 규정을 문장으로 물으면, 샘플 규정 문서 2종에서 찾아 근거와 함께 답하는 실습용 채팅 서비스입니다.

**지금은 실제 AI를 연결하지 않은 상태입니다.** 답변은 질문의 단어를 규정 문서와 비교해 만든 테스트용 가짜 답변이며, 비용이 나가지 않고 질문도 외부로 나가지 않습니다. 샘플 규정도 실습을 위해 지어낸 내용입니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다. API 키가 없어도 실행됩니다.

## 확인

```bash
npm run lint
npm run build
```

서버를 실행할 때 환경 변수 `MOCK_AI_SCENARIO`에 아래 값을 넣으면 특정 상황을 일부러 만들 수 있습니다.

`error`, `timeout`, `bad-format`, `fake-citation`, `no-citation`, `too-many-citations`, `clarify`

## 문서

- [PRD.md](PRD.md): 요구사항
- [PLAN.md](PLAN.md): 작업 순서와 진행 상태
- [DESIGN.md](DESIGN.md): 화면, 데이터 흐름, 기술 선택
- [CLAUDE.md](CLAUDE.md): 프로젝트 규칙
- [tests/questions.md](tests/questions.md): 테스트 질문과 정답표
