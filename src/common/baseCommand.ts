'use strict';

import * as vscode from 'vscode';

export default abstract class BaseCommand {

  constructor(context: vscode.ExtensionContext) {
    let commandName = this.constructor.name.replace(/Command$/, '');
    let disposable = vscode.commands.registerCommand('vscode-postgres.' + commandName, this.run, this);
    context.subscriptions.push(disposable);
  }
  
  abstract run(...args: any[]) : void;
}