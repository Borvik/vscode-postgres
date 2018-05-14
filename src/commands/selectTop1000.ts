import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";

export class selectTop1000Command extends BaseCommand {
  async run(treeNode: TableNode, count = 1000) {
    const connection = await Database.createConnection(treeNode.connection);

    try {
      const res = await connection.query(`
select a.attname as column_name
from pg_attribute a
left join pg_index primaryIndex ON primaryIndex.indrelid = a.attrelid and a.attnum = any(primaryIndex.indkey) and primaryIndex.indisprimary = true
where 
  a.attrelid = $1::regclass AND
  a.attnum > 0 AND
  not a.attisdropped
order by a.attnum;
      `, [`${treeNode.schema}.${treeNode.table}`]);
      
      var columns = res.rows.map(c => `${c.column_name}`);
      var columnsDisplay = columns.join("\n  ,");
      const sql = `
select
  ${columnsDisplay}
from ${treeNode.schema}.${treeNode.table}
limit ${count};
    `
      const textDocument = await vscode.workspace.openTextDocument({content: sql, language: 'postgres'});
      await vscode.window.showTextDocument(textDocument);
      EditorState.connection = treeNode.connection;
      return Database.runQuery(sql, vscode.window.activeTextEditor, treeNode.connection);
  
    } catch(err) {
      return err;
    } finally {
      await connection.end();
    }
  }
}