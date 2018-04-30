import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import * as EasyXml from 'easyxml';
import * as csv from 'csv-stringify';
import { PreviewProvider } from "../common/previewProvider";
import { SaveTableQuickPickItem } from "../common/IConnQuickPick";

export class saveResultCommand extends BaseCommand {
  async run(uri: vscode.Uri) {
    // const tree = PostgreSQLTreeDataProvider.getInstance();
    // tree.refresh(treeNode);
    let results = PreviewProvider.Instance.getResultData(uri);
    if (!results) {
      vscode.window.showWarningMessage('Unable to save data - dataset not found');
      return;
    }

    let resultIndex = 0;
    if (results.length > 1) {
      let tables: SaveTableQuickPickItem[] = [];
      for (let i = 1; i <= results.length; i++) {
        tables.push({
          label: 'Table ' + i,
          index: i - 1
        });
      }
      
      let selected = await vscode.window.showQuickPick(tables);
      if (!selected) return;
      resultIndex = selected.index;
    }

    if (results[resultIndex].rowCount < 1) {
      vscode.window.showWarningMessage('Unable to save data - table has no data');
      return;
    }

    let formats = ['json', 'xml', 'csv'];
    let selFormat = await vscode.window.showQuickPick(formats);
    if (!selFormat) return;

    let fileData: string = null;
    if (selFormat === 'json') {
      fileData = JSON.stringify(results[resultIndex].rows, null, 2);
    } else if (selFormat === 'xml') {
      var ser = new EasyXml({
        singularize: true,
        rootElement: 'results',
        dateFormat: 'ISO',
        manifest: true
      });
      fileData = ser.render(results[resultIndex].rows);
    } else if (selFormat === 'csv') {
      let columns = {};
      results[resultIndex].fields.forEach(field => {
        columns[field.name] = field.name
      });

      let csvError: any = false;
      fileData = await new Promise<string>((resolve) => {
        csv(results[resultIndex].rows, {
          header: true,
          columns: columns,
          formatters: {
            bool: (value: boolean):string => {
              return value ? 'true' : 'false';
            }
          }
        }, (err, output: string) => {
          if (err) { csvError = err; resolve(''); return;}
          resolve(output);
        });
      });
    }

    try {
      let doc: vscode.TextDocument = await vscode.workspace.openTextDocument({language: selFormat});
      let editor: vscode.TextEditor = await vscode.window.showTextDocument(doc, 1, false);
      let result = await editor.edit(edit => edit.insert(new vscode.Position(0, 0), fileData));
      if (!result)
        vscode.window.showErrorMessage('Error occurred opening content in editor');
    }
    catch(err) {
      vscode.window.showErrorMessage(err);
    }
  }
}