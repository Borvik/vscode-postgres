'use strict';

import * as vscode from 'vscode';
import { workspace } from 'vscode';
import * as path from 'path';
import { Global } from './global';
import { IConnection } from './IConnection';
import { Constants } from './constants';
import { PostgreSQLTreeDataProvider } from '../tree/treeProvider';

// writeFile (uri, buffer.from(), {create: true, overwrite: true})
export class ConfigFile implements vscode.FileStat {
  type: vscode.FileType;
  ctime: number;
  mtime: number;
  size: number;
  name: string;
  data: Uint8Array;

  constructor(name: string) {
    this.type = vscode.FileType.File;
    this.ctime = Date.now();
    this.mtime = Date.now();
    this.size = 0;
    this.name = name;
  }
}

export class ConfigFS implements vscode.FileSystemProvider {
  
  private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  private _bufferedEvents: vscode.FileChangeEvent[] = [];
  private _fireSoonHandle: NodeJS.Timer;
  readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

  private _fireSoon(...events: vscode.FileChangeEvent[]): void {
    clearTimeout(this._fireSoonHandle);
    this._bufferedEvents.push(...events);
    this._fireSoonHandle = setTimeout(() => {
      this._emitter.fire(this._bufferedEvents);
      this._bufferedEvents.length = 0;
    }, 5);
  }

  watch(resource: vscode.Uri, opts): vscode.Disposable {
    // ignore
    return new vscode.Disposable(() => {});
  }

  stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    return this._lookup(uri, false);
  }

  readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
    // no reading of directories - managed via connection explorer
    return [];
  }

  createDirectory(uri: vscode.Uri): void {
    throw vscode.FileSystemError.NoPermissions('Unable to create pg-config directories');
  }

  readFile(uri: vscode.Uri): Promise<Uint8Array> {
    return this._lookup(uri, false).then(value => value.data);
  }

  async writeFile(uri: vscode.Uri, content: Uint8Array, options: {create: boolean, overwrite: boolean}): Promise<void> {
    let connFile = uri.path.substr(1);
    let fileExt = path.posix.extname(connFile);
    if (fileExt !== '.json') {
      throw vscode.FileSystemError.FileNotFound(uri);
    }
    let connectionKey = path.posix.basename(connFile, fileExt);

    const connections = Global.context.globalState.get<{[key: string]: IConnection}>(Constants.GlobalStateKey);
    if (!connections || !connections.hasOwnProperty(connectionKey))
      throw vscode.FileSystemError.FileNotFound(uri);
    
    
    let newDetails = JSON.parse(content.toString());

    if (!newDetails.host) throw vscode.FileSystemError.NoPermissions(`Missing "host" key`);
    if (!newDetails.user) throw vscode.FileSystemError.NoPermissions(`Missing "user" key`);
    if (!newDetails.port) throw vscode.FileSystemError.NoPermissions(`Missing "port" key`);
    if (!newDetails.hasOwnProperty('password'))
      throw vscode.FileSystemError.NoPermissions(`Missing "password" key`);
        
    let pwd = newDetails.password;
    delete newDetails.password;
    let connection: IConnection = Object.assign({}, newDetails);
    connection.hasPassword = !!pwd;

    connections[connectionKey] = connection;
    const tree = PostgreSQLTreeDataProvider.getInstance();

    if (connection.hasPassword) {
      await Global.keytar.setPassword(Constants.ExtensionId, connectionKey, pwd);
    }
    await Global.context.globalState.update(Constants.GlobalStateKey, connections)
    tree.refresh();
    this._fireSoon({type: vscode.FileChangeType.Changed, uri});
  }

  delete(uri: vscode.Uri): void {
    throw vscode.FileSystemError.NoPermissions('Unable to delete pg-config entries');
  }

  rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: {overwrite: boolean}): void {
    throw vscode.FileSystemError.NoPermissions('Unable to rename pg-config entries');
  }

  private async _lookup(uri: vscode.Uri, silent: boolean): Promise<ConfigFile> {
    let connFile = uri.path.substr(1);
    let fileExt = path.posix.extname(connFile);
    if (fileExt !== '.json') {
      if (!silent) throw vscode.FileSystemError.FileNotFound(uri);
      return null;
    }
    let connectionKey = path.posix.basename(connFile, fileExt);
    let configFile: ConfigFile = null;
    const connections = Global.context.globalState.get<{[key: string]: IConnection}>(Constants.GlobalStateKey);
    if (connections && connections.hasOwnProperty(connectionKey)) {
      // create the file
      let connection: IConnection = Object.assign({}, connections[connectionKey]);
      if (connection.hasPassword || !connection.hasOwnProperty('hasPassword')) {
        connection.password = await Global.keytar.getPassword(Constants.ExtensionId, connectionKey);
      } else {
        connection.password = "";
      }
      delete connection.hasPassword;
      let connString = JSON.stringify(connection, null, 2);
      configFile = new ConfigFile(connection.label || connection.host);
      configFile.data = Buffer.from(connString);
    }
    if (!configFile && !silent)
      throw vscode.FileSystemError.FileNotFound(uri);
    return configFile;
  }
}