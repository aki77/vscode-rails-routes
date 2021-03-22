"use strict";

import * as path from "path";
import * as vscode from "vscode";
import Routes from "./routes";
import RoutesDefinitionProvider from "./RoutesDefinitionProvider";
import RoutesCompletionProvider from "./RoutesCompletionProvider";
import { buildSnippet } from "./util";
import debounce = require("lodash.debounce");

const GLOB_PATTERN = "config/routes.rb";
const SUB_GLOB_PATTERN = "config/routes/**/*.rb";

const refreshRoutes = (routes: Routes) => {
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

  [GLOB_PATTERN, SUB_GLOB_PATTERN].forEach((pattern) => {
    const fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        vscode.workspace.getWorkspaceFolder(routePath) as vscode.WorkspaceFolder,
        pattern
      )
    );
    const debouncedRefreshRoutes = debounce(() => refreshRoutes(routes), 3000);
    fileWatcher.onDidChange(debouncedRefreshRoutes);
    context.subscriptions.push(fileWatcher);
  });

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

  context.subscriptions.push(
    vscode.commands.registerCommand("railsRoutes.insert", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const items = Array.from(routes.getAll()).map(([helper, { params }]) => {
        const snippet = buildSnippet(helper, params);
        return {
          snippet,
          label: `${helper}_path`,
          description: snippet.value
        };
      });
      const item = await vscode.window.showQuickPick(items);
      if (!item) {
        return;
      }

      await editor.insertSnippet(item.snippet);
    })
  );
}

export function deactivate() {}
