import * as vscode from 'vscode';
import * as path from 'path';
import { QueryResults, FieldInfo } from '../common/database';
import { Global } from '../common/global';

export function disposeAll(disposables: vscode.Disposable[]) {
  while (disposables.length) {
    const item = disposables.pop();
    if (!item) continue;
    item.dispose();
  }
}

export function generateResultsHtml(sourceUri: vscode.Uri, results: QueryResults[], state?: any) {
  let pageScript = getExtensionResourcePath('index.js');
  let pageStyle = getExtensionResourcePath('style.css');
  const nonce = new Date().getTime() + '' + new Date().getMilliseconds();

  let html = `<!DOCTYPE html>
  <html>
    <head>
      <meta http-equiv="Content-type" content="text/html;charset=UTF-8" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https: data:; media-src vscode-resource: https: data:; script-src 'nonce-${nonce}'; style-src vscode-resource: 'unsafe-inline' https: data:; font-src vscode-resource: https: data:;">
      <meta id="vscode-postgres-results-data"
        data-settings=""
        data-state="${JSON.stringify(state || {}).replace(/"/g, '&quot;')}" />
      <script src="${pageScript}" nonce="${nonce}"></script>
      <base href="${sourceUri.with({scheme: 'vscode-resource'}).toString(true)}" />
      ${getStyles(nonce)}
    </head>
    <body class="vscode-body">
      ${getResultsTables(results)}
    </body>
  </html>`;
  return html;
}

function getStyles(nonce) {
  let config = Global.Configuration;
  let prettyJsonFieldStyle = '';
  if (config.get<boolean>('prettyPrintJSONfields')) {
    prettyJsonFieldStyle = `
    .jsonb-field, .json-field {
      white-space: pre;
    }
    `;
  }
  return `<style nonce="${nonce}">
    body {
      margin: 0;
      padding: 0;
    }

    pre.vscode-postgres-result {
      margin: 5px;
    }
    
    pre.vscode-postgres-result-insert {
    
    }
    
    pre.vscode-postgres-result-update {
      
    }
    
    pre.vscode-postgres-result-create {
      
    }
    
    pre.vscode-postgres-result-delete {
      
    }
    
    pre.vscode-postgres-result-explain {
      
    }
    
    pre.vscode-postgres-result-generic {
      
    }
    
    pre.vscode-postgres-result-message {
      
    }

    pre.vscode-postgres-result-select {
      
    }

    .field-type {
      font-size: smaller;
    }

    ${prettyJsonFieldStyle}
    
    table {
      border-collapse: collapse;
    }
    
    th, td {
      border-width: 1px;
      border-style: solid;
      border-color: var(--vscode-panel-border);
      padding: 3px 5px;
    }
    
    .timestamptz-field { white-space: nowrap; }

    .result-divider {
      padding: 0;
      border: none;
      border-top: medium double var(--vscode-panel-border);
    }
  </style>`;
}
function getExtensionResourcePath(mediaFile: string): string {
  let filePath = path.join('media', mediaFile);
  let absFilePath = Global.context.asAbsolutePath(filePath);
  let uri = vscode.Uri.file(absFilePath);
  uri = uri.with({ scheme: 'vscode-resource' });
  let url = uri.toString();
  return url;
}

function getResultsTables(results: QueryResults[]): string {
  let html = '', first = true;
  for (const result of results) {
    if (!first)
      html += '<hr class="result-divider" />'
    switch (result.command) {
      case 'ext-message': html += generateMessage(result); break;
      case 'INSERT': html += generateInsertResults(result); break;
      case 'UPDATE': html += generateUpdateResults(result); break;
      case 'CREATE': html += generateCreateResults(result); break;
      case 'DELETE': html += generateDeleteResults(result); break;
      case 'EXPLAIN': html += generateExplainResult(result); break;
      case 'SELECT': html += generateSelectResult(result); break;
      default:
        html += generateGenericResult(result);
        break;
    }
    first = false;
  }
  return html;
}

function generateInsertResults(result: QueryResults): string {
  let html = getRowCountResult(result.rowCount, 'inserted', 'insert');
  if (result.fields && result.fields.length && result.rows && result.rows.length)
    html += generateSelectTableResult(result);
  return html;
}

function generateUpdateResults(result: QueryResults): string {
  let html = getRowCountResult(result.rowCount, 'updated', 'update');
  if (result.fields && result.fields.length && result.rows && result.rows.length)
    html += generateSelectTableResult(result);
  return html;
}

function generateCreateResults(result: QueryResults): string {
  return getRowCountResult(result.rowCount, 'created', 'create');
}

function generateDeleteResults(result: QueryResults): string {
  let html = getRowCountResult(result.rowCount, 'deleted', 'delete');
  if (result.fields && result.fields.length && result.rows && result.rows.length)
    html += generateSelectTableResult(result);
  return html;
}

function getRowCountResult(rowCount: number, text: string, preClass: string): string {
  let rowOrRows = rowCount === 1 ? 'row' : 'rows';
  return `<pre class="vscode-postgres-result vscode-postgres-result-${preClass}">${rowCount} ${rowOrRows} ${text}</pre>`;
}

function generateExplainResult(result: QueryResults): string {
  return `<pre class="vscode-postgres-result vscode-postgres-result-explain">${result.rows.join("\n")}</pre>`;
}

function generateGenericResult(result: QueryResults): string {
  return `<pre class="vscode-postgres-result vscode-postgres-result-generic">${JSON.stringify(result)}</pre>`;
}

function generateMessage(result: QueryResults): string {
  return `<pre class="vscode-postgres-result vscode-postgres-result-message">${result.message}</pre>`;
}

function generateSelectResult(result: QueryResults): string {
  let html = getRowCountResult(result.rowCount, 'returned', 'select');
  html += generateSelectTableResult(result);
  return html;
}

function generateSelectTableResult(result: QueryResults): string {
  let html = `<table>`;
  // first the colum headers
  html += `<thead><tr><th></th>`;
  for (const field of result.fields) {
    html += `<th><div class="field-name">${field.name}</div><div class="field-type">${field.display_type}</div></th>`;
  }
  html += `</tr></thead>`;

  // now the body
  let rowIndex = 1;
  html += `<tbody>`;
  if (result.rows && result.rows.length) {
    for (const row of result.rows) {
      html += `<tr><th class="row-header">${rowIndex++}</th>`;
      result.fields.forEach((field, idx) => {
        let formatted = formatFieldValue(field, row[idx]);
        html += `<td class="${field.format}-field">${formatted ? formatted : ''}</td>`;
      });
      html += `</tr>`;
    }
  }
  html += `</tbody>`;

  html += `</table>`;
  return html;
}

function formatFieldValue(field: FieldInfo, value: any): string {
  if (value === null) return `<i>null</i>`;
  if (typeof value === typeof undefined) return '';

  let canTruncate: boolean = false;
  switch (field.format) {
    case 'interval':
      value = formatInterval(value); break;
    case 'json':
    case 'jsonb':
    case 'point':
    case 'circle':
      if (Global.Configuration.get<boolean>("prettyPrintJSONfields"))
        value = JSON.stringify(value, null, 2);
      else
        value = JSON.stringify(value);
      break;
    case 'timestamptz': value = value.toJSON().toString(); break;
    case 'text': canTruncate = true; break;
    default:
      value = value.toString();
  }
  let formatted = htmlEntities(value);
  if (canTruncate) {
    if (formatted && formatted.length > 150)
      formatted = formatted.substring(0, 148) + '&hellip;';
  }
  return formatted;
}

function htmlEntities(str: string): string {
  if (typeof str !== 'string') return str;
  return str ? str.replace(/[\u00A0-\u9999<>\&"']/gim, (i) => `&#${i.charCodeAt(0)};`) : undefined;
}

// #region "Format Interval"
function formatInterval(value): string {
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

  switch (Global.Configuration.get<string>("intervalFormat")) {
    case 'humanize':
      return formatIntervalHumanize(value, is_negative);
    case 'succinct':
      return formatIntervalSuccinct(value, is_negative);
    default: // iso_8601
      return formatIntervalISO(value, is_negative);
  }
}

function formatIntervalISO(value: any, is_negative: boolean): string {
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

function formatIntervalHumanize(value: any, is_negative: boolean): string {
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

function formatIntervalSuccinct(value: any, is_negative: boolean): string {
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
// #endregion
