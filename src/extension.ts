"use strict";

import * as path from "path";
import * as vscode from "vscode";
import Routes from "./routes";
import RoutesDefinitionProvider from "./RoutesDefinitionProvider";

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
      ["erb", "haml", "slim"],
      new RoutesDefinitionProvider(routes)
    )
  );

  // let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
  //     vscode.window.showInformationMessage('Hello World!');
  // });

  // context.subscriptions.push(disposable);
}

export function deactivate() {}
