import { IConnection as IDBConnection } from '../common/IConnection';

export interface ISetConnection { 
  connection: IDBConnection
  documentUri?: string;
}

export interface ExplainResults {
  rowCount: number;
  command: string;
  rows?: any[];
  fields?: any[];
}

export interface DBField {
  attisdropped: boolean,
  attname: string,
  attnum: number,
  attrelid: string,
  data_type: string
}

export interface DBTable {
  tablename: string,
  is_table: boolean,
  columns: DBField[]
}

export interface DBFunctionsRaw {
  schema: string
  name: string
  result_type: string
  argument_types: string
  type: string,
  description: string
}

export interface DBFunctionArgList {
  args: string[],
  description: string
}

export interface DBFunction {
  schema: string
  name: string
  result_type: string
  overloads: DBFunctionArgList[],
  type: string
}