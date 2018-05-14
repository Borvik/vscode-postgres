import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { TableNode } from './tableNode';
import { InfoNode } from './infoNode';
import { Global } from '../common/global';

export class DatabaseNode implements INode {

  constructor(private readonly connection: IConnection) {}

  public getTreeItem(): TreeItem {
    return {
      label: this.connection.database,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.database',
      command: {
        title: 'select-database',
        command: 'vscode-postgres.setActiveConnection',
        arguments: [ this.connection ]
      },
      iconPath: {
        light: path.join(__dirname, '../../resources/light/database.svg'),
        dark: path.join(__dirname, '../../resources/dark/database.svg')
      }
    }
  }

  public async getChildren(): Promise<INode[]> {
    let config = Global.Configuration;
    const schemaFilter = config.get<string[]>("schemaFilter");
    var filter = '';
    if (schemaFilter) {
      filter = ` and schemaname in ('${schemaFilter.join("', '")}')`;
    }

    const connection = await Database.createConnection(this.connection);

    try {
      const res = await connection.query(`
        select schemaname as schema, tablename as name, true as is_table 
        from pg_tables 
        where schemaname not in ('information_schema', 'pg_catalog') ${filter}
        union all
        select schemaname, viewname, false
        from pg_views
        where schemaname not in ('information_schema', 'pg_catalog') ${filter}
        order by schema, name;`
      );
      return res.rows.map<TableNode>(table => {
        return new TableNode(this.connection, table.schema, table.name, table.is_table);
      });
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}