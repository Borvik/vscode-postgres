import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { InfoNode } from './infoNode';
import { ColumnNode } from './columnNode';
import { Global } from '../common/global';

export class TableNode implements INode {

  constructor(public readonly connection: IConnection
            , public readonly table: string
            , public readonly is_table: boolean
            , public readonly schema?: string)
  {}

  public getQuotedTableName(): string {
    let quotedSchema = this.schema && this.schema !== 'public' ? Database.getQuotedIdent(this.schema) : null;
    let quotedTable = Database.getQuotedIdent(this.table);
    return quotedSchema ? `${quotedSchema}.${quotedTable}` : quotedTable;
  }

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
    //config.get<boolean>("prettyPrintJSONfields") ? `.jsonb-field, .json-field { white-space: pre; }` : ``;
    const configSort = Global.Configuration.get<string>("tableColumnSortOrder");
    const sortOptions = {
      "db-order": 'a.attnum',
      "alpha": 'a.attname',
      "reverse-alpha": 'a.attname DESC'
    };
    if (!sortOptions[configSort]) sortOptions[configSort] = 'a.attnum';

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
        NOT a.attisdropped AND
        has_column_privilege($1, a.attname, 'SELECT, INSERT, UPDATE, REFERENCES')
      ORDER BY ${sortOptions[configSort]};`, [this.getQuotedTableName()]);

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