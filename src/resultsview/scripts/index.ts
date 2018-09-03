import { getData } from './settings';

declare var acquireVsCodeApi: any;

const vscode = acquireVsCodeApi();

// Set VS Code state
const state = getData('data-state');
vscode.setState(state);