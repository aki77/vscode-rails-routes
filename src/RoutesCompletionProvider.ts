import Routes from "./routes";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  TextDocument,
  Range,
  Position,
  SnippetString
} from "vscode";

const LINE_REGEXP = /(?:link_to|redirect_to|button_to|\Wvisit[(\s]|(?:url|path):\s+|(?:url|path)\s*=)/;

const buildSnippet = (helper: string, params: string[]) => {
  let snippet = `${helper}_\${1:path}`;

  if (params.length > 0) {
    const args = params.map((param, index) => `\${${index + 2}:${param}}`);
    snippet = `${snippet}(${args.join(", ")})\${${params.length + 2}}`;
  }

  return new SnippetString(snippet);
};

export default class RoutesCompletionProvider
  implements CompletionItemProvider {
  constructor(private routes: Routes) {}

  public provideCompletionItems(document: TextDocument, position: Position) {
    const line = document.getText(
      new Range(
        new Position(position.line, 0),
        new Position(position.line, position.character)
      )
    );
    const matches = line.match(LINE_REGEXP);
    if (!matches) {
      return null;
    }

    return this.buildCompletinItems();
  }

  private buildCompletinItems() {
    const items = Array.from(this.routes.getAll()).map(
      ([helper, { url, actions, params, controller }]) => {
        const item = new CompletionItem(
          `${helper}_path`,
          CompletionItemKind.Method
        );
        item.detail = Array.from(actions)
          .map(action => [controller, action].join("#"))
          .join(", ");
        item.insertText = buildSnippet(helper, params);
        return item;
      }
    );

    return items;
  }
}
