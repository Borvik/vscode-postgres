import * as vscode from 'vscode';
import * as path from 'path';
import { INode } from './INode';
import { IConnection } from '../common/IConnection';
import { Database } from '../common/database';
import { DatabaseNode } from './databaseNode';
import { InfoNode } from './infoNode';

export class ConnectionNode implements INode {

  constructor(public readonly id: string, private readonly connection: IConnection) {}

  public getTreeItem(): vscode.TreeItem {
    return {
      label: this.connection.label || this.connection.host,
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
      contextValue: "vscode-postgres.tree.connection",
      command: {
        title: 'select-database',
        command: 'vscode-postgres.setActiveConnection',
        arguments: [ this.connection ]
      },
      iconPath: {
        light: path.join(__dirname, '../../resources/light/server.svg'),
        dark: path.join(__dirname, '../../resources/dark/server.svg')
      }
    };
  }

  public async getChildren(): Promise<INode[]> {
    if (this.connection.database) {
      return [new DatabaseNode(this.connection)];
    }
    const connection = await Database.createConnection(this.connection, 'postgres');

    try {
      // Get all database where permission was granted
      const res = await connection.query(`
      SELECT datname
      FROM pg_database
      WHERE
        datistemplate = false
        AND has_database_privilege(datname, 'TEMP, CONNECT') = true
      ORDER BY datname;`);
      
      return res.rows.map<DatabaseNode>(database => {
        return new DatabaseNode(Database.getConnectionWithDB(this.connection, database.datname));
      });
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}