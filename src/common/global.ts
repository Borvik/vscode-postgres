'use strict';
import * as keytarType from 'keytar';
import * as vscode from 'vscode';
import { IConnection } from './IConnection';
import { Constants } from './constants';
import { ResultsManager } from '../resultsview/resultsManager';

export class Global {
  public static keytar: typeof keytarType = getCoreNodeModule('keytar');
  public static context: vscode.ExtensionContext = null;
  public static ResultManager: ResultsManager = null;

  public static get Configuration(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(Constants.ExtensionId);
  }
}

function getCoreNodeModule(moduleName: string) {
  try {
    return require(`${vscode.env.appRoot}/node_modules.asar/${moduleName}`);
  } catch(err) { }

  try {
    return require(`${vscode.env.appRoot}/node_modules/${moduleName}`);
  } catch(err) { }

  return null;
}