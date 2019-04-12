import BaseCommand from "../common/baseCommand";
import * as vscode from 'vscode';
import { PostgreSQLTreeDataProvider } from "../tree/treeProvider";
import { IConnection } from "../common/IConnection";
import { Constants } from "../common/constants";
import * as uuidv1 from "uuid/v1";
import { Global } from "../common/global";
import { MultiStepInput, InputFlowAction } from "../common/multiStepInput";
import { Database, PgClient } from "../common/database";

'use strict';

interface SSLQuickPickItem extends vscode.QuickPickItem {
  ssl: boolean
}

interface DatabaseQuickPickItem extends vscode.QuickPickItem {
  dbname?: string
}

const sslOptions: SSLQuickPickItem[] = [
  {label: 'Use Secure Connection', ssl: true},
  {label: 'Standard Connection', ssl: false}
]

export class addConnectionCommand extends BaseCommand {

  readonly TITLE: string = 'Add Database Connection';
  readonly TotalSteps: number = 7;

  async run() {
    const state = {port: 5432} as Partial<ConnectionState>;
    if (!(await MultiStepInput.run(input => this.setHostName(input, state)))) {
      // command cancelled
      return;
    }
    
    // create the db connection
    const tree = PostgreSQLTreeDataProvider.getInstance();

    let connections = tree.context.globalState.get<{ [key: string]: IConnection }>(Constants.GlobalStateKey);
    if (!connections) connections = {};

    const id = uuidv1();
    connections[id] = {
      label: state.label,
      host: state.host,
      user: state.user,
      port: state.port,
      ssl: state.secure,
      database: state.database
    };

    connections[id].hasPassword = !!state.password;
    if (connections[id].hasPassword) {
      await Global.keytar.setPassword(Constants.ExtensionId, id, state.password);
    }

    await tree.context.globalState.update(Constants.GlobalStateKey, connections);
    tree.refresh();
  }

  async setHostName(input: MultiStepInput, state: Partial<ConnectionState>) {
    state.host = await input.showInputBox({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      prompt: 'The hostname of the database',
      placeholder: 'ex. 127.0.0.1',
      ignoreFocusOut: true,
      value: (typeof state.host === 'string') ? state.host : '',
      validate: async (value) => (!value || !value.trim()) ? 'Hostname is required' : '' 
    });
    state.label = state.host;
    return (input: MultiStepInput) => this.setUsername(input, state);
  }

  async setUsername(input: MultiStepInput, state: Partial<ConnectionState>) {
    state.user = await input.showInputBox({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      prompt: 'The PostgreSQL user to authenticate as',
      placeholder: 'ex. root',
      ignoreFocusOut: true,
      value: (typeof state.user === 'string') ? state.user : '',
      validate: async (value) => (!value || !value.trim()) ? 'Username is required' : ''
    });
    return (input: MultiStepInput) => this.setPassword(input, state);
  }

  async setPassword(input: MultiStepInput, state: Partial<ConnectionState>) {
    state.password = await input.showInputBox({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      prompt: 'The password of the PostgreSQL user',
      placeholder: '',
      ignoreFocusOut: true,
      password: true,
      value: (typeof state.password === 'string') ? state.password : '',
      validate: async (value) => ''
    });
    return (input: MultiStepInput) => this.setPort(input, state);
  }

  async setPort(input: MultiStepInput, state: Partial<ConnectionState>) {
    state.port = await input.showInputBox({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      prompt: 'The port number to connect to',
      placeholder: 'ex. 5432',
      ignoreFocusOut: true,
      value: (typeof state.port === 'number') ? state.port.toString() : '',
      validate: async (value) => {
        if (!value || !value.trim()) return 'Port number is required';
        return Number.isNaN(Number.parseInt(value)) ? 'The port number specified was not a number': '';
      },
      convert: async (value) => Number.parseInt(value)
    });
    return (input: MultiStepInput) => this.setSSL(input, state);
  }

  async setSSL(input: MultiStepInput, state: Partial<ConnectionState>) {
    let active = sslOptions.find(s => s.ssl === !!state.secure);
    state.secure = await input.showQuickPick({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      placeholder: 'Use an ssl connection?',
      ignoreFocusOut: true,
      items: sslOptions,
      activeItem: active || undefined,
      convert: async (value: SSLQuickPickItem) => value.ssl
    });
    if (typeof state.secure === 'undefined')
      state.secure = false;
    return (input: MultiStepInput) => this.setDatabase(input, state);
  }

  async setDatabase(input: MultiStepInput, state: Partial<ConnectionState>) {
    // first need the databases
    let connection: PgClient = null;

    let databases: DatabaseQuickPickItem[] = [];
    let connectionError: any = null;
    try {
      connection = await Database.createConnection({
        label: '',
        host: state.host,
        user: state.user,
        password: state.password,
        port: state.port,
        ssl: state.secure
      }, 'postgres');
      const res = await connection.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
      databases = res.rows.map<DatabaseQuickPickItem>(database => ({label: database.datname, dbname: database.datname}));
    } catch(err) {
      if (err.message === `permission denied for database "postgres"`) {
        // Heroku message anyway... probably varies
        // is there another common parameter could be checked?
      } else {
        // vscode.window.showErrorMessage(err.message);
      }
    } finally {
      if (connection) {
        await connection.end();
        connection = null;
      }
    }

    if (databases.length < 1) {
      // specify database via text input - may not have permission to list databases
      let connectionOK = false;
      do {
        state.database = await input.showInputBox({
          title: this.TITLE,
          step: input.CurrentStepNumber,
          totalSteps: this.TotalSteps,
          prompt: '[Optional] The database to connect to. Leave empty to enumerate databases on the server',
          placeholder: '',
          ignoreFocusOut: true,
          value: (typeof state.database === 'string') ? state.database : '',
          validate: async (value) => ''
        });

        try {
          let databaseToTry = state.database && state.database.trim() ? state.database : 'postgres';
          connection = await Database.createConnection({
            label: '',
            host: state.host,
            user: state.user,
            password: state.password,
            port: state.port,
            ssl: state.secure
          }, databaseToTry);
          connectionOK = true;
        } catch(err) {
          connectionError = err;
          vscode.window.showErrorMessage(err.message);
        } finally {
          if (connection) {
            await connection.end();
            connection = null;
          }
        }
      } while(!connectionOK)
      return (input: MultiStepInput) => this.setDisplayName(input, state);
    }

    if (connectionError) {
      input.redoLastStep();
    }

    databases.unshift({label: 'Show All Databases'});

    let active = databases.find(d => d.dbname && d.dbname === state.database);
    let selected = await input.showQuickPick({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      placeholder: '',
      ignoreFocusOut: true,
      items: databases,
      activeItem: active || undefined,
      convert: async (value: DatabaseQuickPickItem) => value.dbname
    });
    state.database = selected || '';
    return (input: MultiStepInput) => this.setDisplayName(input, state);
  }

  async setDisplayName(input: MultiStepInput, state: Partial<ConnectionState>) {
    state.label = await input.showInputBox({
      title: this.TITLE,
      step: input.CurrentStepNumber,
      totalSteps: this.TotalSteps,
      prompt: 'The display name of the database connection',
      placeholder: 'ex. My Local DB (optional)',
      ignoreFocusOut: true,
      value: (typeof state.label === 'string') ? state.label : '',
      validate: async (value) => '' // empty error message (no error)
    });
  }

}

interface ConnectionState {
  label: string;
  host: string;
  user: string;
  password: string;
  port: number;
  database: string;
  secure: boolean
}