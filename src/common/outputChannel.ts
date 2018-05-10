import * as vscode from 'vscode';
import { QueryResults } from './database';
import { PreviewProvider } from './previewProvider';

export class OutputChannel {
  private static outputChannel = vscode.window.createOutputChannel('PostgreSQL');

  public static show(): void {
    OutputChannel.outputChannel.show(true);
  }
  
  public static appendLine(value: string, show?: boolean) {
    if (show) OutputChannel.outputChannel.show(true);
    OutputChannel.outputChannel.appendLine(value);
  }

  public static displayResults(uri: vscode.Uri, title: string, res: QueryResults[]): Thenable<any> {
    let hasSelectResult: boolean = false;
    res.forEach(result => {
      switch (result.command) {
        case 'INSERT': OutputChannel.appendLine(result.rowCount + ' rows inserted'); break;
        case 'UPDATE': OutputChannel.appendLine(result.rowCount + ' rows updated'); break;
        case 'CREATE': OutputChannel.appendLine(result.rowCount + ' rows created'); break;
        case 'DELETE': OutputChannel.appendLine(result.rowCount + ' rows deleted'); break;
        case 'EXPLAIN':
          result.rows.forEach(row => OutputChannel.appendLine(row['QUERY PLAN'], true));
          break;
        case 'SELECT':
          hasSelectResult = true;
          OutputChannel.appendLine(result.rowCount + ' rows selected'); break;
        default: OutputChannel.appendLine(JSON.stringify(result), true); break;
      }
    });

    if (!hasSelectResult) return Promise.resolve();

    let viewColumn = OutputChannel.getViewColumn();

    PreviewProvider.Instance.update(uri, res);
    return vscode.commands.executeCommand('vscode.previewHtml', uri, viewColumn, title)
      .then((success) => {}, (reason) => {
        vscode.window.showErrorMessage(reason);
      });
  }

  private static getViewColumn(): vscode.ViewColumn {
    if (vscode.window.activeTextEditor.viewColumn === vscode.ViewColumn.One)
      return vscode.ViewColumn.Two;
    else
      return vscode.ViewColumn.Three;
  }
}