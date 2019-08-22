import * as path from "path";
import Routes from "./routes";
import {
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  TextDocument,
  Range,
  Position,
  Uri,
  workspace
} from "vscode";
import { buildSnippet } from "./util";

const LINE_REGEXP = /(?:link_to|redirect_to|button_to|\Wvisit[(\s]|(?:url|path):\s+|(?:url|path)\s*=)/;

const matchScore = (path1: string, path2: string): number => {
  const parts1 = path1.split(path.sep);
  const parts2 = path2.split(path.sep);

  let score = 0;
  parts1.some((part, index) => {
    if (part === parts2[index]) {
      score += 1;
      return false;
    }
    return true;
  });

  return score;
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

    return this.buildCompletinItems(document.uri);
  }

  private buildCompletinItems(currentUri: Uri) {
    const currentController = workspace
      .asRelativePath(currentUri)
      .replace(/app\/(?:controllers|views)\//, "");

    const itemsWithScore = Array.from(this.routes.getAll()).map(
      ([helper, { url, actions, params, controller }]) => {
        const item = new CompletionItem(
          `${helper}_path`,
          CompletionItemKind.Method
        );
        item.detail = Array.from(actions)
          .map(action => [controller, action].join("#"))
          .join(", ");
        item.insertText = buildSnippet(helper, params);
        return { item, score: matchScore(currentController, controller) };
      }
    );

    const scores = itemsWithScore.map(({ score }) => score);
    const maxScore = Math.max(...scores);
    const maxScoreItemWithScore = itemsWithScore.find(
      ({ score }) => score === maxScore
    );
    if (!maxScoreItemWithScore) {
      return null;
    }
    maxScoreItemWithScore.item.preselect = true;

    return itemsWithScore.map(({ item }) => item);
  }
}
