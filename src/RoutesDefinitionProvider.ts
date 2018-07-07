import Routes from "./routes";
import {
  DefinitionProvider,
  TextDocument,
  Location,
  Position,
  workspace,
  Uri
} from "vscode";

const METHOD_REGEXP = /\w+_(?:path|url)/;

const getActionPosition = async (controllerPath: Uri, action: string) => {
  const document = await workspace.openTextDocument(controllerPath);
  const regex = new RegExp(`^ *def\\s+${action}\\s*$`);
  for (let index = 0; index < document.lineCount; index++) {
    const line = document.lineAt(index);
    if (regex.test(line.text)) {
      return new Position(index, 0);
    }
  }
  return new Position(0, 0);
};

export default class RoutesDefinitionProvider implements DefinitionProvider {
  constructor(private routes: Routes) {}

  public async provideDefinition(document: TextDocument, position: Position) {
    const range = document.getWordRangeAtPosition(position, METHOD_REGEXP);
    if (!range) {
      return;
    }

    const helper = document.getText(range).replace(/_(?:path|url)$/, "");
    const route = this.routes.get(helper);
    if (!route) {
      return;
    }

    const controllerPaths = await workspace.findFiles(
      `app/controllers/${route.controller}_controller.rb`
    );
    if (controllerPaths.length < 1) {
      return;
    }

    const promises = Array.from(route.actions).map(async action => {
      const uri = controllerPaths[0];
      const position = await getActionPosition(uri, action);
      return new Location(controllerPaths[0], position);
    });

    return Promise.all(promises);
  }
}
