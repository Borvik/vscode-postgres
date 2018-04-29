import * as fs from 'fs';
import {Pool, Client, types } from 'pg';
import { IConnection } from "./IConnection";

export class Database {
  
  static getConnectionWithDB(connection:IConnection, dbname?: string): IConnection {
    if (!dbname) return connection;
    return {
      host: connection.host,
      user: connection.user,
      password: connection.password,
      port: connection.port,
      database: dbname,
      multipleStatements: connection.multipleStatements,
      certPath: connection.certPath
    };
  }

  public static async createConnection(connection: IConnection, dbname?: string): Promise<Client> {
    const connectionOptions: any = Object.assign({}, connection);
    connectionOptions.database = dbname ? dbname : connection.database;
    if (connectionOptions.certPath && fs.existsSync(connectionOptions.certPath)) {
      connectionOptions.ssl = {
        ca: fs.readFileSync(connectionOptions.certPath).toString()
      }
    }

    let client = new Client(connectionOptions);
    await client.connect();
    return client;
  }
}