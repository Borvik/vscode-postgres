'use strict';
import * as vscode from 'vscode';
import { Constants } from './constants';
import { ResultsManager } from '../resultsview/resultsManager';

export class Global {
  public static context: vscode.ExtensionContext = null;
  public static ResultManager: ResultsManager = null;

  public static get Configuration(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(Constants.ExtensionId);
  }
}