export interface IForeignKey {
  constraint: string,
  catalog: string,
  schema: string,
  table: string,
  column: string
}

export interface IColumn {
  column_name: string;
  data_type: string;
  primary_key: boolean;
  foreign_key?: IForeignKey;
}