"use strict";

import * as path from "path";
import * as vscode from "vscode";
import Routes from "./routes";
import RoutesDefinitionProvider from "./RoutesDefinitionProvider";
import RoutesCompletionProvider from "./RoutesCompletionProvider";

const GLOB_PATTERN = "config/routes.rb";

const refreshRoutes = (routes: Routes) => {
  console.log("refresh");
  const progressOptions = {
    location: vscode.ProgressLocation.Window,
    title: "Loading rails routes"
  };
  vscode.window.withProgress(progressOptions, () => routes.load());
};

export async function activate(context: vscode.ExtensionContext) {
  const routePaths = await vscode.workspace.findFiles(GLOB_PATTERN);
  if (routePaths.length !== 1) {
    return;
  }
  const routePath = routePaths[0];

  const routes = new Routes(path.resolve(routePath.fsPath, "../../"));
  context.subscriptions.push(routes);

  setImmediate(() => {
    refreshRoutes(routes);
  });

  const fileWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.getWorkspaceFolder(routePath) as vscode.WorkspaceFolder,
      GLOB_PATTERN
    )
  );
  fileWatcher.onDidChange(() => refreshRoutes(routes));
  context.subscriptions.push(fileWatcher);

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      ["ruby", "erb", "haml", "slim"],
      new RoutesDefinitionProvider(routes)
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ["ruby", "erb", "haml", "slim"],
      new RoutesCompletionProvider(routes)
    )
  );
}

export function deactivate() {}
