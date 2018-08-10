import * as vscode from 'vscode';
import { QueryResults, FieldInfo } from './database';
import { Global } from './global';

export class PreviewProvider implements vscode.TextDocumentContentProvider {
  private static _provider: PreviewProvider;
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  private _queryResultsMap: Map<string, QueryResults[]> = new Map<string, QueryResults[]>();

  static get Instance() {
    if (!PreviewProvider._provider) PreviewProvider._provider = new PreviewProvider();
    return PreviewProvider._provider;
  }

  get onDidChange(): vscode.Event<vscode.Uri> { return this._onDidChange.event; }

  public update(uri: vscode.Uri, newResults: QueryResults[]): void {
    newResults = newResults.filter((result: QueryResults) => result.fields && result.fields.length);
    this._queryResultsMap.set(uri.toString(), newResults);
    this._onDidChange.fire(uri);
  }

  public provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): string {
    let url: string = uri.toString();
    if (!this._queryResultsMap.has(url)) return this.errorSnippet('Results not found: ' + url);
    return this.buildTable(this._queryResultsMap.get(url));
  }

  public onDidCloseTextDocument(doc: vscode.TextDocument): void {
    let keysToDelete: string[] = [];
    for (let [key, value] of this._queryResultsMap.entries()) {
      if (doc.uri.toString() === key) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this._queryResultsMap.delete(key);
    });
  }

  private errorSnippet(error: string): string { return `<body>${error}</body>`; }

  private getTableStyles(config: vscode.WorkspaceConfiguration): string {
    let jsonStyle = config.get<boolean>("prettyPrintJSONfields") ? `.jsonb-field, .json-field { white-space: pre; }` : ``;
    return `<style>
    .field-type {
      font-size: smaller;
    }

    table {
      border-collapse: collapse;
    }

    table + table { margin-top: 15px; }

    th, td {
      border-width: 1px;
      border-style: solid;
      border-color: #444444;
      padding: 3px 5px;
    }

    .timestamptz-field { white-space: nowrap; }
    ${jsonStyle}
    </style>`;
  }

  private htmlEntities(str: string): string {
    if (typeof str !== 'string') return str;
    return str ? str.replace(/[\u00A0-\u9999<>\&"']/gim, (i) => `&#${i.charCodeAt(0)};`) : undefined;
  }

  private formatData(field: FieldInfo, value: any, config: vscode.WorkspaceConfiguration): string {
    if (value === null) return `<i>null</i>`;
    if (typeof value === typeof undefined) return '';

    let canTruncate: boolean = false;
    console.log('Field Format: ', field.format);
    switch (field.format) {
      case 'interval':
        value = this.formatInterval(value, config); break;
      case 'json':
      case 'jsonb':
        if (config.get<boolean>("prettyPrintJSONfields"))
          value = JSON.stringify(value, null, 2);
        else
          value = JSON.stringify(value);
        break;
      case 'timestamptz': value = value.toJSON().toString(); break;
      case 'text': canTruncate = true; break;
      default:
        value = value.toString();
    }
    let formatted = this.htmlEntities(value);
    if (canTruncate) {
      if (formatted && formatted.length > 150)
        formatted = formatted.substring(0, 148) + '&hellip;';
    }
    return formatted;
  }

  private formatInterval(value: any, config: vscode.WorkspaceConfiguration) {
    let keys: string[] = ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'];
    let is_negative = false;
    for (let key of keys) {
      if (!value.hasOwnProperty(key))
        value[key] = 0;
      else if (value[key] < 0) {
        is_negative = true;
        value[key] = Math.abs(value[key]);
      }
    }

    switch (config.get<string>("intervalFormat")) {
      case 'humanize':
        return this.formatIntervalHumanize(value, is_negative);
      case 'succinct':
        return this.formatIntervalSuccinct(value, is_negative);
      default: // iso_8601
        return this.formatIntervalISO(value, is_negative);
    }
    // SELECT now() - start_date_time FROM "events" LIMIT 1;
  }

  private formatIntervalISO(value: any, is_negative: boolean): string {
    //{"days":4107,"hours":5,"minutes":56,"seconds":17,"milliseconds":681}
    let iso = 'P';
    if (value.years) iso += value.years.toString() + 'Y';
    if (value.months) iso += value.months.toString() + 'M';
    if (value.days) iso += value.days.toString() + 'D';

    if (iso === 'P' || (value.hours || value.minutes || value.seconds))
      iso += 'T';

    if (value.hours) iso += value.hours.toString() + 'H';
    if (value.minutes) iso += value.minutes.toString() + 'M';

    if (!value.hasOwnProperty('seconds')) value.seconds = 0;
    if (value.milliseconds) value.seconds += (value.milliseconds / 1000);

    if (value.seconds) iso += value.seconds.toString() + 'S';
    if (iso === 'PT') iso += '0S';
    return (is_negative ? '-' : '') + iso;
  }
  
  private formatIntervalHumanize(value: any, is_negative: boolean): string {
    let values: string[] = [];
    if (!value.hasOwnProperty('seconds')) value.seconds = 0;
    if (value.milliseconds) value.seconds += (value.milliseconds / 1000);

    if (value.years) values.push(value.years.toString() + ' years');
    if (value.months) values.push(value.months.toString() + ' months');
    if (value.days) values.push(value.days.toString() + ' days');
    if (value.hours) values.push(value.hours.toString() + ' hours');
    if (value.minutes) values.push(value.minutes.toString() + ' minutes');
    if (value.seconds) values.push(value.seconds.toString() + ' seconds');
    if (values.length < 1) values.push('0 seconds');
    if (is_negative) values.push('ago');
    return values.join(' ');
  }

  private formatIntervalSuccinct(value: any, is_negative: boolean): string {
    let values: string[] = [];
    if (value.milliseconds) value.seconds += (value.milliseconds / 1000);

    if (value.years) values.push(value.years.toString());
    if (values.length || value.months) values.push(value.months.toString());
    if (values.length || value.days) values.push(value.days.toString());
    if (values.length || value.hours) values.push(value.hours.toString());
    if (values.length || value.minutes) values.push(value.minutes.toString());
    if (values.length || value.seconds) values.push(value.seconds.toString());
    if (values.length < 1) values.push('0');
    if (is_negative) values.unshift('-');
    return values.join(':');
  }

  private buildTable(res: QueryResults[]) {
    let config = Global.Configuration;
    let html = `<html><head>`
    
    html += this.getTableStyles(config);

    html += `</head><body style="margin: 0; padding: 0;">`

    res.forEach(result => {
      html += `<table>`;
      // first the column headers
      html += `<thead><tr><th></th>`;
      result.fields.forEach((field) => {
        html += `<th><div class="field-name">${field.name}</div><div class="field-type">${field.format}</div></th>`;
      });
      html += `</tr></thead>`;

      // now the body
      let rowIndex = 1;
      html += `<tbody>`;
      if (result.rows && result.rows.length) {
        result.rows.forEach((row) => {
          html += `<tr><th class="row-header">${rowIndex++}</th>`;
          result.fields.forEach((field) => {
            let formatted = this.formatData(field, row[field.name], config);
            html += `<td class="${field.format}-field">${formatted ? formatted : ''}</td>`;
          });
          html += `</tr>`;
        });
      }
      html += `</tbody>`;
      html += `</table>`;
    });

    let timeNow = new Date().getTime();
    return html + '</body></html>';
  }

  public getResultData(uri: vscode.Uri): QueryResults[] {
    let url = uri.toString();
    if (!this._queryResultsMap.has(url)) return null;
    return this._queryResultsMap.get(url);
  }
}