import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { TableNode } from "../tree/tableNode";
import { EditorState } from "../common/editorState";
import { Database } from "../common/database";
import { Global } from '../common/global';
import { SqlQueryManager } from '../queries';
import { QueryResult } from "pg";

export class selectTopCommand extends BaseCommand {

  async run(treeNode: TableNode, count: number = 0, withNames: boolean = false, runOnly: boolean = false) {
    if (count === 0) {
      // prompt for count
      const countInput: string = await vscode.window.showInputBox({ prompt: "Select how many rows?", placeHolder: "limit" });
      if (!countInput) return;

      count = parseInt(countInput);

      if (Number.isNaN(count)) {
        vscode.window.showErrorMessage('Invalid quantity for selection - should be a number');
        return;
      }
    }

    let columnsToSelect: string[] = ['*'];
    if (withNames) {
      const connection = await Database.createConnection(treeNode.connection);

      const configSort = Global.Configuration.get<string>("tableColumnSortOrder");
      const sortOptions = {
        "db-order": 'a.attnum',
        "alpha": 'a.attname',
        "reverse-alpha": 'a.attname DESC'
      };
      if (!sortOptions[configSort]) sortOptions[configSort] = 'a.attnum';

      let tableSchema = treeNode.schema ?? 'public';
      let query = SqlQueryManager.getVersionQueries(connection.pg_version);

      try {
        let res: QueryResult = null;

        res = await connection.query(query.format(query.TableColumns, sortOptions[configSort]), [
          treeNode.getQuotedTableName(),
          treeNode.connection.database,
          tableSchema,
          treeNode.table
        ]);

        columnsToSelect = res.rows.map<string>(column => Database.getQuotedIdent(column.column_name));
      }
      catch (err) {
        return err;
      }
      finally {
        await connection.end();
      }
    }

    const sql = `SELECT ${columnsToSelect.join(', ')} FROM ${treeNode.getQuotedTableName()} LIMIT ${count};`
    if (!runOnly) {
      const textDocument = await vscode.workspace.openTextDocument({content: sql, language: 'postgres'});
      await vscode.window.showTextDocument(textDocument);
      EditorState.connection = treeNode.connection;
    }

    return Database.runQuery(sql, vscode.window.activeTextEditor, treeNode.connection, runOnly);
  }

}
