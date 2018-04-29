import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { TableNode } from './tableNode';
import { InfoNode } from './infoNode';

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
    const connection = await Database.createConnection(this.connection);

    try {
      const res = await connection.query(`SELECT tablename FROM pg_tables WHERE schemaname not in ('information_schema', 'pg_catalog') ORDER BY tablename;`);
      
      return res.rows.map<TableNode>(table => {
        return new TableNode(this.connection, table.tablename);
      });
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}