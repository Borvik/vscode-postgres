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
        SELECT tablename as name, true as is_table FROM pg_tables WHERE schemaname not in ('information_schema', 'pg_catalog') ${filter}
        union all
        SELECT viewname as name, false as is_table FROM pg_views WHERE schemaname not in ('information_schema', 'pg_catalog') ${filter}
        order by name;`
      );
      return res.rows.map<TableNode>(table => {
        return new TableNode(this.connection, table.name, table.is_table);
      });
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}