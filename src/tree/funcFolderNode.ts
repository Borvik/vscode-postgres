import * as path from 'path';
import { IConnection } from "../common/IConnection";
import { INode } from "./INode";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from "../common/database";
import { FunctionNode } from "./functionNode";
import { InfoNode } from "./infoNode";
import { SqlQueryManager } from '../queries';

export class FunctionFolderNode implements INode {
  constructor(public readonly connection: IConnection
    , public readonly schemaName: string)
  {}

  public getTreeItem(): TreeItem | Promise<TreeItem> {
    return {
      label: "Functions",
      collapsibleState: TreeItemCollapsibleState.Collapsed,
      contextValue: 'vscode-postgres.tree.function-folder',
      iconPath: {
        light: path.join(__dirname, `../../resources/light/func-folder.svg`),
        dark: path.join(__dirname, `../../resources/dark/func-folder.svg`)
      }
    };
  }
  
  public async getChildren(): Promise<INode[]> {
    const connection = await Database.createConnection(this.connection);

    try {
      // const res = await connection.query(`
      // SELECT n.nspname as "schema",
      //   p.proname as "name",
      //   d.description,
      //   pg_catalog.pg_get_function_result(p.oid) as "result_type",
      //   pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
      // CASE
      //   WHEN p.proisagg THEN 'agg'
      //   WHEN p.proiswindow THEN 'window'
      //   WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
      //   ELSE 'normal'
      // END as "type"
      // FROM pg_catalog.pg_proc p
      //     LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
      //     LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
      // WHERE n.nspname = $1
      //   AND p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
      //   AND has_schema_privilege(quote_ident(n.nspname), 'USAGE') = true
      //   AND has_function_privilege(p.oid, 'execute') = true
      // ORDER BY 1, 2, 4;`, [this.schemaName]);
      let query = SqlQueryManager.getVersionQueries(connection.pg_version);
      const res = await connection.query(query.GetFunctions, [this.schemaName]);

      return res.rows.map<FunctionNode>(func => {
        var args = func.argument_types != null ? func.argument_types.split(',').map(arg => {
          return String(arg).trim();
        }) : [];
        return new FunctionNode(this.connection, func.name, args, func.result_type, func.schema, func.description);
      })
    } catch(err) {
      return [new InfoNode(err)];
    } finally {
      await connection.end();
    }
  }
}