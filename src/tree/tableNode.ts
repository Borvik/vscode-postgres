import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { InfoNode } from './infoNode';
import { ColumnNode } from './columnNode';

export class TableNode implements INode {

  constructor(public readonly connection: IConnection, public readonly table: string, public readonly is_table: boolean) {}

  public getTreeItem(): TreeItem {
    return {
      label: this.table,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.table',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/${this.is_table ? 'table' : 'view'}.svg`),
        dark: path.join(__dirname, `../../resources/dark/${this.is_table ? 'table' : 'view'}.svg`)
      }
    };
  }

  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);

    try {
      const res = await connection.query(`
      SELECT
        a.attname as column_name,
        format_type(a.atttypid, a.atttypmod) as data_type,
        coalesce(primaryIndex.indisprimary, false) as primary_key
      FROM
        pg_attribute a
        LEFT JOIN pg_index primaryIndex ON primaryIndex.indrelid = a.attrelid AND a.attnum = ANY(primaryIndex.indkey) AND primaryIndex.indisprimary = true
      WHERE
        a.attrelid = $1::regclass AND
        a.attnum > 0 AND
        NOT a.attisdropped
      ORDER BY a.attnum;`, [this.table]);
      
      return res.rows.map<ColumnNode>(column => {
        return new ColumnNode(this.connection, this.table, column);
      });
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}