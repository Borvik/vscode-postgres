import * as path from 'path';
import { INode } from "./INode";
import { IConnection } from "../common/IConnection";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Database } from '../common/database';
import { InfoNode } from './infoNode';
import { ColumnNode } from './columnNode';
import { Global } from '../common/global';
import { QueryResult } from 'pg';

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

    let tableSchema = this.schema ? this.schema : 'public';
    let hasJsonBuildObject = false;
    try {
      const versionRes = await connection.query(`SELECT current_setting('server_version_num') as ver_num;`);
      /*
      return res.rows.map<ColumnNode>(column => {
        return new ColumnNode(this.connection, this.table, column);
      });
      */
      let versionNumber = parseInt(versionRes.rows[0].ver_num);
      hasJsonBuildObject = versionNumber >= 90400;
    }
    catch {}

    try {
      let res: QueryResult = null;

      if (hasJsonBuildObject) {
        res = await connection.query(`
        SELECT
          a.attname as column_name,
          format_type(a.atttypid, a.atttypmod) as data_type,
          coalesce(primaryIndex.indisprimary, false) as primary_key,
          CASE
            WHEN fk.constraint_name IS NULL THEN NULL
            ELSE json_build_object(
              'constraint', fk.constraint_name,
              'catalog', fk.fk_catalog,
              'schema', fk.fk_schema,
              'table', fk.fk_table,
              'column', fk.fk_column
            ) 
          END as foreign_key
        FROM
          pg_attribute a
          LEFT JOIN pg_index primaryIndex ON primaryIndex.indrelid = a.attrelid AND a.attnum = ANY(primaryIndex.indkey) AND primaryIndex.indisprimary = true
          LEFT JOIN (
            SELECT tc.constraint_name, kcu.column_name,
              ccu.table_catalog as fk_catalog,
              ccu.table_schema as fk_schema,
              ccu.table_name as fk_table,
              ccu.column_name as fk_column
            FROM
              information_schema.key_column_usage kcu
              INNER JOIN information_schema.table_constraints tc ON (
                tc.constraint_name = kcu.constraint_name AND
                tc.table_catalog = kcu.table_catalog AND
                tc.table_schema = kcu.table_schema AND
                tc.table_name = kcu.table_name
              )
              INNER JOIN information_schema.constraint_column_usage ccu ON (
                ccu.constraint_catalog = tc.constraint_catalog AND
                ccu.constraint_schema = tc.constraint_schema AND
                ccu.constraint_name = tc.constraint_name
              )
            WHERE
              kcu.table_catalog = $2 AND
              kcu.table_schema = $3 AND
              kcu.table_name = $4 AND
              tc.constraint_type = 'FOREIGN KEY'
          ) as fk ON fk.column_name = a.attname
        WHERE
          a.attrelid = $1::regclass AND
          a.attnum > 0 AND
          NOT a.attisdropped AND
          has_column_privilege($1, a.attname, 'SELECT, INSERT, UPDATE, REFERENCES')
        ORDER BY ${sortOptions[configSort]};`, [this.getQuotedTableName(), this.connection.database, tableSchema, this.table]);
      } else {
        res = await connection.query(`
        SELECT
          a.attname as column_name,
          format_type(a.atttypid, a.atttypmod) as data_type,
          coalesce(primaryIndex.indisprimary, false) as primary_key,
          (
            SELECT row_to_json(fk_sq)
            FROM (
              SELECT
                tc.constraint_name as "constraint",
                ccu.table_catalog as "catalog",
                ccu.table_schema as "schema",
                ccu.table_name as "table",
                ccu.column_name as "column"
              FROM
                information_schema.key_column_usage kcu
                INNER JOIN information_schema.table_constraints tc ON (
                  tc.constraint_name = kcu.constraint_name AND
                  tc.table_catalog = kcu.table_catalog AND
                  tc.table_schema = kcu.table_schema AND
                  tc.table_name = kcu.table_name
                )
                INNER JOIN information_schema.constraint_column_usage ccu ON (
                  ccu.constraint_catalog = tc.constraint_catalog AND
                  ccu.constraint_schema = tc.constraint_schema AND
                  ccu.constraint_name = tc.constraint_name
                )
              WHERE
                kcu.table_catalog = $2 AND
                kcu.table_schema = $3 AND
                kcu.table_name = $4 AND
                tc.constraint_type = 'FOREIGN KEY' AND
                kcu.column_name = a.attname
            ) as fk_sq
          ) as foreign_key
        FROM
          pg_attribute a
          LEFT JOIN pg_index primaryIndex ON primaryIndex.indrelid = a.attrelid AND a.attnum = ANY(primaryIndex.indkey) AND primaryIndex.indisprimary = true
        WHERE
          a.attrelid = $1::regclass AND
          a.attnum > 0 AND
          NOT a.attisdropped AND
          has_column_privilege($1, a.attname, 'SELECT, INSERT, UPDATE, REFERENCES')
        ORDER BY ${sortOptions[configSort]};`, [this.getQuotedTableName(), this.connection.database, tableSchema, this.table]);
      }

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