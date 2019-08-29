import { SnippetString } from "vscode";

export function buildSnippet(helper: string, params: string[]) {
  let snippet = `${helper}_\${1|path,url|}`;

  if (params.length > 0) {
    const args = params.map((param, index) => `\${${index + 2}:${param}}`);
    snippet = `${snippet}(${args.join(", ")})\${${params.length + 2}}`;
  }

  return new SnippetString(snippet);
}
