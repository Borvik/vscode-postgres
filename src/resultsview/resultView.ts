import * as vscode from 'vscode';
import * as path from 'path';
import { disposeAll, generateResultsHtml } from './common';
import { QueryResults } from '../common/database';
import { Global } from '../common/global';

export class ResultView {
  public static viewType = 'vscode-postgres.results';

  private _resource: vscode.Uri;
  private _results: QueryResults[] = [];
  private _disposed: boolean = false;
  private firstUpdate: boolean = true;
  private forceUpdate: boolean = false;
  private throttleTimer: any;
  private readonly editor: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  private readonly _onDisposeEmitter = new vscode.EventEmitter<void>();
	public readonly onDispose = this._onDisposeEmitter.event;

	private readonly _onDidChangeViewStateEmitter = new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
	public readonly onDidChangeViewState = this._onDidChangeViewStateEmitter.event;

  public static async revive(webview: vscode.WebviewPanel, state: any): Promise<ResultView> {
    const resource = vscode.Uri.parse(state.resource);

    const view = new ResultView(webview, resource);

    view.editor.webview.options = ResultView.getWebviewOptions(resource);
    view._results.push({
      command: 'ext-message',
      message: 'Please rerun your queries',
      rowCount: 0
    });
    await view.doUpdate();
    return view;
  }

  public static create(resource: vscode.Uri, viewColumn: vscode.ViewColumn) {
    const view = vscode.window.createWebviewPanel(
      ResultView.viewType,
      ResultView.getViewTitle(resource),
      viewColumn,
      {
        enableFindWidget: true,
        ...ResultView.getWebviewOptions(resource)
      });
    
    return new ResultView(view, resource);
  }

  private constructor(webview: vscode.WebviewPanel, resource: vscode.Uri) {
    this._resource = resource;
    this.editor = webview;

    this.editor.onDidDispose(() => this.dispose(), null, this.disposables);
    this.editor.onDidChangeViewState(e => this._onDidChangeViewStateEmitter.fire(e), null, this.disposables);
  }

  public get resource(): vscode.Uri {
    return this._resource;
  }

  public get state() {
    return {
      resource: this.resource.toString()
    };
  }

  public get currentResults(): QueryResults[] {
    return this._results;
  }

  public dispose() {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    this._onDisposeEmitter.fire();

    this._onDisposeEmitter.dispose();
    this._onDidChangeViewStateEmitter.dispose();
    this.editor.dispose();
    disposeAll(this.disposables);
  }

  public update(resource: vscode.Uri, res: QueryResults[]) {
    clearTimeout(this.throttleTimer);
    this.throttleTimer = undefined;

    this._results = res;
    this._resource = resource;

    this.throttleTimer = setTimeout(() => this.doUpdate(), 300);
    this.firstUpdate = false;
  }

  public refresh(): void {
    this.forceUpdate = true;
    this.update(this._resource, this._results);
  }

  public matchesResource(otherResource: vscode.Uri): boolean {
    return this.isResultsFor(otherResource);
  }

  public matches(otherView: ResultView): boolean {
    return this.matchesResource(otherView._resource);
  }

  public reveal(viewColumn: vscode.ViewColumn): void {
    this.editor.reveal(viewColumn, true);
  }

  private isResultsFor(resource: vscode.Uri): boolean {
    return this._resource.toString() === resource.toString();
  }

  private static getViewTitle(resource: vscode.Uri): string {
    return 'Results: ' + path.basename(resource.toString());
  }

  private async doUpdate(): Promise<void> {
    const resource = this._resource;
    const results = this._results;

    clearTimeout(this.throttleTimer);
    this.throttleTimer = undefined;
    this.forceUpdate = false;

    // build HTML for results
    let html = generateResultsHtml(resource, results, this.state);
    this.editor.title = ResultView.getViewTitle(resource);
    this.editor.webview.options = ResultView.getWebviewOptions(resource);
    this.editor.webview.html = html;
  }

  private static getWebviewOptions(resource: vscode.Uri): vscode.WebviewOptions {
    let localRoot = vscode.Uri.file(Global.context.asAbsolutePath('media'));
    return {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [
        localRoot
      ]
    };
  }
}