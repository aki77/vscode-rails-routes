"use strict";

import * as promisify from "util.promisify";
import * as child_process from "child_process";
import * as vscode from "vscode";

const exec = promisify(child_process.exec);

export async function activate(context: vscode.ExtensionContext) {
  const routePaths = await vscode.workspace.findFiles("config/routes.rb");
  if (routePaths.length < 1) {
    return;
  }

  // FIXME: rootpath
  exec("bundle exec rake routes", {
    cwd: vscode.workspace.rootPath,
    env: process.env
  }).then(
    stdout => {
      console.log(stdout);
    },
    error => {
      console.error(error);
    }
  );

  // let disposable = vscode.commands.registerCommand('extension.sayHello', () => {
  //     vscode.window.showInformationMessage('Hello World!');
  // });

  // context.subscriptions.push(disposable);
}

export function deactivate() {}
