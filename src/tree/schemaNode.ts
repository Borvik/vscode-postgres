import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from "../common/database";
import { TableNode } from "./tableNode";
import { InfoNode } from "./infoNode";
import { Global } from '../common/global';
import { FunctionFolderNode } from './funcFolderNode';

export class SchemaNode implements INode {

  constructor(private readonly connection: IConnection, private readonly schemaName: string) {}
  
  public getTreeItem(): TreeItem {
    return {
      label: this.schemaName,
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.schema',
      command: {
        title: 'select-database',
        command: 'vscode-postgres.setActiveConnection',
        arguments: [ this.connection ]
      },
      iconPath: {
        light: path.join(__dirname, '../../resources/light/schema.svg'),
        dark: path.join(__dirname, '../../resources/dark/schema.svg')
      }
    };
  }

  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);
    const configVirtFolders = Global.Configuration.get<Array<string>>("virtualFolders");

    try {
      const res = await connection.query(`
      SELECT
          tablename as name,
          true as is_table,
          schemaname AS schema
        FROM pg_tables
        WHERE 
          schemaname = $1
          AND has_table_privilege(quote_ident(schemaname) || '.' || quote_ident(tablename), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
      UNION ALL
      SELECT
          viewname as name,
          false as is_table,
          schemaname AS schema
        FROM pg_views
        WHERE 
          schemaname = $1
          AND has_table_privilege(quote_ident(schemaname) || '.' || quote_ident(viewname), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
      ORDER BY name;`, [this.schemaName]);

      let childs = [];
      if (configVirtFolders != null)
      {
        if (configVirtFolders.indexOf("functions") !== -1) {
          childs.push(new FunctionFolderNode(this.connection, this.schemaName));
        }
      }
      // Append tables under virtual folders
      return childs.concat(res.rows.map<TableNode>(table => {
        return new TableNode(this.connection, table.name, table.is_table, table.schema);
      }));
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}