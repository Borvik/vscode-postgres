import * as vscode from 'vscode';
import { QueryResults } from './database';
import { Global } from './global';

export class OutputChannel {
  private static outputChannel = vscode.window.createOutputChannel('PostgreSQL');

  public static show(): void {
    OutputChannel.outputChannel.show(true);
  }
  
  public static appendLine(value: string, show?: boolean) {
    if (show) OutputChannel.outputChannel.show(true);
    OutputChannel.outputChannel.appendLine(value);
  }

  public static displayResults(uri: vscode.Uri, title: string, res: QueryResults[], showInCurrentPanel: boolean = false): void {
    let viewColumn = OutputChannel.getViewColumn();
    if (showInCurrentPanel) viewColumn -= 1;
    Global.ResultManager.showResults(uri, viewColumn, res);
  }

  public static displayMessage(uri: vscode.Uri, title: string, message: string, showInCurrentPanel: boolean = false): void {
    let msgRes = new Array<QueryResults>();
    msgRes.push({
      rowCount: 0,
      command: 'ext-message',
      message: message
    });
    this.displayResults(uri, title, msgRes, showInCurrentPanel);
  }

  private static getViewColumn(): vscode.ViewColumn {
    const resourceColumn = (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn) || vscode.ViewColumn.One;
    return resourceColumn + 1;
  }
}