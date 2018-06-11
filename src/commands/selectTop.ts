import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
//import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

export class selectTopCommand extends BaseCommand {
  async run(treeNode: TableNode, count: number = 0) {
    if (count == 0) {
      const countInput: string = await vscode.window.showInputBox({ prompt: "How many rows?", placeHolder: "port" });
      if (!countInput) return;
      count = parseInt(countInput);
      if (Number.isNaN(count)) {
        vscode.window.showErrorMessage('Invalid quantity for selection - should be a number');
        return;
      }
    }
    const connection = await Database.createConnection(treeNode.connection);
    try {
      const query = `
select a.attname as column_name
from pg_attribute a
left join pg_index primaryIndex on primaryIndex.indrelid = a.attrelid and a.attnum = any(primaryIndex.indkey) and primaryIndex.indisprimary = true
where 
  a.attrelid = '${treeNode.getQuotedTableName()}'::regclass
  and a.attnum > 0
  and not a.attisdropped
order by a.attnum;`;      
      const result = await connection.query(query);      
      const columns = result.rows.map(c => `${(c.column_name === c.column_name.toLowerCase()) ? c.column_name : '"' + c.column_name + '"' }`);
      const columnsDisplay = columns.join("\n  ,");
      const sql = `
select
  ${columnsDisplay}
from ${treeNode.getQuotedTableName()}
limit ${count}; `;
      const textDocument = await vscode.workspace.openTextDocument({content: sql, language: 'postgres'});
      await vscode.window.showTextDocument(textDocument);
      EditorState.connection = treeNode.connection;
      return Database.runQuery(sql, vscode.window.activeTextEditor, treeNode.connection);
    }
    catch(err) {
      return err;
    }
    finally {
      await connection.end();
    }
  }
}
