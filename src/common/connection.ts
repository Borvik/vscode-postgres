// Create a Common DB Connection library both
// the language server and the client can use

import { Client, ClientConfig, types } from 'pg';
import { parse as parseArray } from 'postgres-array';
function parseStringArray(value: string) {
  if (!value) { return null; }
  return parseArray(value, v => String(v));
}

types.setTypeParser(types.builtins.DATE, v => String(v));
types.setTypeParser(types.builtins.TIME, v => String(v));
types.setTypeParser(types.builtins.TIMESTAMP, v => String(v));
types.setTypeParser(types.builtins.TIMESTAMPTZ, v => String(v));
// @ts-ignore timestamp[]
types.setTypeParser(1115, parseStringArray);
// @ts-ignore _date (probably date[])
types.setTypeParser(1182, parseStringArray);
// @ts-ignore timestamptz[]
types.setTypeParser(1185, parseStringArray);

export class PgClient extends Client {
  pg_version: number;
  is_ended: boolean;

  constructor(config?: string | ClientConfig) {
    super(config);

    this.is_ended = false;
    this.on('end', () => {
      this.is_ended = true;
    });
  }
}