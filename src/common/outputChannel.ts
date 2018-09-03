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

  public static displayResults(uri: vscode.Uri, title: string, res: QueryResults[]): void {
    let viewColumn = OutputChannel.getViewColumn();
    Global.ResultManager.showResults(uri, viewColumn, res);
  }

  private static getViewColumn(): vscode.ViewColumn {
    const resourceColumn = (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn) || vscode.ViewColumn.One;
    return resourceColumn + 1;
  }
}