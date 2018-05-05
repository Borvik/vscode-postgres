# PostgreSQL

This project is still in beta stage, as I transition from my old code-base and flush out the features that I have planned for it.  As such some features are placeholders, or are missing.

Management and query tool for PostgreSQL databases.

## Features

* Management of PostgreSQL connections
* List Servers/Database/Tables/Columns (primary key/type)
* Quickly select top * (with limit) of a table
* Run Queries
  * All queries in a pgsql file (; delimited)
  * Selected query in pgsql file
  * Selected query in ANY file (via context menu or command palette)
* Individual editors can have different connections
* Quickly change connection database by clicking the DB in the status bar
* Syntax Highlighting
* Connection aware code completion (keywords, functions, tables, and fields)
* In-line error detection powered by EXPLAIN (one error per query in editor)
* *__Basic__* function signature support (connection aware)

## Usage

Still working on a usage guide.

## Extension Settings

This extension contributes the following settings:

* `vscode-postgres.showExplorer`: enable/disable the database explorer.
* `vscode-postgres.prettyPrintJSONfields`: set to `true` to enable nicely formatted JSON in the query results window.

## Known Issues

* VS Code 1.23 appears to have a bug with "when" contexts for commands.  This is preventing the "Select Connection" to be hidden all the time and "Run Query" commands to only show when there is selected text (even with multi-selection, which it shouldn't).