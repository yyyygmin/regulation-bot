// 규정 문서를 읽어 조항 단위로 나눈다. 파일을 읽으므로 서버 코드에서만 불러온다.
import { readFile } from "node:fs/promises";
import path from "node:path";

// 규정 조항 하나
export interface Article {
  id: string; // 예: "leave-3"
  document: string; // 예: "휴가 규정"
  number: string; // 예: "제3조"
  title: string; // 예: "연차휴가 일수"
  body: string;
}

const REGULATIONS_DIR = path.join(process.cwd(), "content", "regulations");
const REGULATION_FILES = ["leave", "expense"];

// "## 제3조 (연차휴가 일수)" 형태의 조항 제목
const ARTICLE_HEADING = /^## (제(\d+)조) \((.+)\)$/;

// 마크다운 문서 하나를 조항 목록으로 바꾼다. 형식이 어긋나면 잘못된 근거가 나가지 않도록 오류를 낸다.
export function parseRegulation(fileKey: string, markdown: string): Article[] {
  const articles: Article[] = [];
  let document = "";
  let bodyLines: string[] = [];

  const finishArticle = () => {
    const current = articles.at(-1);
    if (current) {
      current.body = bodyLines.join("\n").trim();
    }
    bodyLines = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("# ")) {
      document = line.slice(2).trim();
    } else if (line.startsWith("## ")) {
      const heading = line.match(ARTICLE_HEADING);
      if (!heading) {
        throw new Error(`${fileKey}: 조항 제목 형식이 잘못되었습니다.`);
      }
      finishArticle();
      articles.push({
        id: `${fileKey}-${heading[2]}`,
        document,
        number: heading[1],
        title: heading[3],
        body: "",
      });
    } else if (articles.length > 0) {
      bodyLines.push(line);
    }
  }
  finishArticle();

  if (!document || articles.length === 0) {
    throw new Error(`${fileKey}: 문서 이름이나 조항이 없습니다.`);
  }
  return articles;
}

// 규정 문서 2종의 전체 조항을 읽어 온다.
export async function loadArticles(): Promise<Article[]> {
  const documents = await Promise.all(
    REGULATION_FILES.map(async (fileKey) => {
      const markdown = await readFile(
        path.join(REGULATIONS_DIR, `${fileKey}.md`),
        "utf-8",
      );
      return parseRegulation(fileKey, markdown);
    }),
  );
  return documents.flat();
}
