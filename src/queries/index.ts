'use strict';

export class SqlQueries {
  TableColumns: string;
  GetFunctions: string;
  GetAllFunctions: string;

  public format(stringValue: string, ...formatParams: any[]): string {
    return stringValue.replace(/{(\d+)}/g, (match: string, number: string): string => {
      let num = parseInt(number);
      if (typeof formatParams[num] === 'undefined') {
        throw new Error(`Index ${number} not found in the argument list`);
      }
      if (formatParams[num] === null) return '';
      return formatParams[num].toString();
    });
  }
}

let queries = {
  0: <SqlQueries> {
    GetFunctions:
      `SELECT n.nspname as "schema",
        p.proname as "name",
        d.description,
        pg_catalog.pg_get_function_result(p.oid) as "result_type",
        pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
      CASE
        WHEN p.proisagg THEN 'agg'
        WHEN p.proiswindow THEN 'window'
        WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
        ELSE 'normal'
      END as "type"
      FROM pg_catalog.pg_proc p
          LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
      WHERE n.nspname = $1
        AND p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
        AND has_schema_privilege(quote_ident(n.nspname), 'USAGE') = true
        AND has_function_privilege(p.oid, 'execute') = true
      ORDER BY 1, 2, 4;`,
    GetAllFunctions:
      `SELECT n.nspname as "schema",
        p.proname as "name",
        d.description,
        pg_catalog.pg_get_function_result(p.oid) as "result_type",
        pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
      CASE
        WHEN p.proisagg THEN 'agg'
        WHEN p.proiswindow THEN 'window'
        WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
        ELSE 'normal'
      END as "type"
      FROM pg_catalog.pg_proc p
          LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
      WHERE n.nspname <> 'information_schema'
        AND pg_catalog.pg_function_is_visible(p.oid)
        AND p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
        AND has_schema_privilege(quote_ident(n.nspname), 'USAGE') = true
        AND has_function_privilege(p.oid, 'execute') = true
      ORDER BY 1, 2, 4;`,
    TableColumns: 
      `SELECT
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
      ORDER BY {0};`
  },
  90400: <SqlQueries> {
    TableColumns:
      `SELECT
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
      ORDER BY {0};`
  },
  110000: <SqlQueries> {
    GetFunctions: `
      SELECT n.nspname as "schema",
        p.proname as "name",
        d.description,
        pg_catalog.pg_get_function_result(p.oid) as "result_type",
        pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
      CASE
        WHEN p.prokind = 'a' THEN 'agg'
        WHEN p.prokind = 'w' THEN 'window'
        WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
        ELSE 'normal'
      END as "type"
      FROM pg_catalog.pg_proc p
          LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
      WHERE n.nspname = $1
        AND p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
        AND has_schema_privilege(quote_ident(n.nspname), 'USAGE') = true
        AND has_function_privilege(p.oid, 'execute') = true
      ORDER BY 1, 2, 4;`,
    GetAllFunctions: `
      SELECT n.nspname as "schema",
        p.proname as "name",
        d.description,
        pg_catalog.pg_get_function_result(p.oid) as "result_type",
        pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
      CASE
        WHEN p.prokind = 'a' THEN 'agg'
        WHEN p.prokind = 'w' THEN 'window'
        WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
        ELSE 'normal'
      END as "type"
      FROM pg_catalog.pg_proc p
          LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
          LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
      WHERE n.nspname <> 'information_schema'
        AND pg_catalog.pg_function_is_visible(p.oid)
        AND p.prorettype <> 'pg_catalog.trigger'::pg_catalog.regtype
        AND has_schema_privilege(quote_ident(n.nspname), 'USAGE') = true
        AND has_function_privilege(p.oid, 'execute') = true
      ORDER BY 1, 2, 4;`
  }
}

export class SqlQueryManager {

  static getVersionQueries(versionNumber: number): SqlQueries {
    let versionKeys = Object.keys(queries).map(k => parseInt(k));
    versionKeys.sort((a, b) => a - b);

    let queryResult = new SqlQueries();
    for (let version of versionKeys) {
      if (version > versionNumber)
        break;
      
      let queryKeys = Object.keys(queries[version]);
      for (let queryKey of queryKeys) {
        if (queries[version][queryKey]) {
          queryResult[queryKey] = queries[version][queryKey];
        }
      }
    }
    return queryResult;
  }

}