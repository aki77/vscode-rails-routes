"use strict";

import * as path from "path";
import * as vscode from "vscode";
import Routes from "./routes";
import RoutesDefinitionProvider from "./RoutesDefinitionProvider";
import RoutesCompletionProvider from "./RoutesCompletionProvider";

const refreshRoutes = (routes: Routes) => {
  const progressOptions = {
    location: vscode.ProgressLocation.Window,
    title: "Loading rails routes"
  };
  vscode.window.withProgress(progressOptions, () => routes.load());
};

export async function activate(context: vscode.ExtensionContext) {
  const routePaths = await vscode.workspace.findFiles("config/routes.rb");
  if (routePaths.length !== 1) {
    return;
  }

  const routes = new Routes(path.resolve(routePaths[0].fsPath, "../../"));
  setImmediate(() => {
    refreshRoutes(routes);
  });

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      ["ruby", "erb", "haml", "slim"],
      new RoutesDefinitionProvider(routes)
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ["erb", "haml", "slim"],
      new RoutesCompletionProvider(routes)
    )
  );
}

export function deactivate() {}
