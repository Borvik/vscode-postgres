# Change Log
All notable changes to the "vscode-postgres" extension will be documented in this file.

## [Unreleased]
- Turn off parsing of pg types `date`, `timestamp`, and `timestamptz` for more consistent formatting. Should fix #223 and #219.
- Removes keytar to SecretStorage API migration code and remove references to keytar. Fixes: #230.

## [1.4.2] - 2023-04-14
- Fix for JSON export formatting. Fixes issue #220

## [1.4.1] - 2023-04-08
- Make intellisense ignore tables that have 0 columns - thanks @polmonso.
- Fixed csv exporting of timestamps. Fixes issue #114.
- Added hex formatting for `bytea` columns - thanks @jragingfury.

## [1.4.0] - 2022-01-19
- Keytar migration tool. Previously, keytar was used manually via `${vscode.env.appRoot}/node_modules` - this is a switch to using the secrets api, but needed a migration to do so.

## [1.3.0] - 2022-01-03 (prerelease)
- Switch to pre-release/release version numbers `major.EVEN.patch` for release and `major.ODD.patch` for pre-release
- Keytar migration tool. Previously, keytar was used manually via `${vscode.env.appRoot}/node_modules` - this is a switch to using the secrets api, but needed a migration to do so.

## [1.1.19] - 2021-10-16
### Added
- Query timer and running message by Jakub Szostak

### Updated
- Updated webview URL creation for local files

## [1.1.18] - 2021-06-12
### Fixed
- Webview results not displaying

### Added
- Sticky table headers

## [1.1.17] - 2021-01-18
### Fixed
- Saving results to CSV, JSON, or XML when results have multiple columns with the same name - some columns were getting dropped (issue #164)
  Now all columns _should_ be output.  For the case of JSON or XML, repeated names have an increment suffix to the name. For CSV columns are positional
  and it uses the same name.

## [1.1.16] - 2021-01-18
### Added
- Foreign table support
- Ability to copy schema, table, column, and function names to the clipboard

### Changed
- Select [x] right click options - moved to submenu with extra options

## [1.1.15] - 2021-01-14
### Fixed
- Updated queries for breaking `has_schema_privilege` calls (issues #161, #129)
- Query updates to allow for materialized views to show (issue #112)

## [1.1.14] - 2020-10-24
### Fixed
- Update `pg` caused SSL mode to break for self-signed certs (issue #154), added `rejectUnauthorized: false`

## [1.1.13] - 2020-10-17
### Fixed
- Emergency update of dependencies

## [1.1.12] - 2020-10-17
### Fixed
- `[DEP0005] DeprecationWarning: Buffer()` (issue #147) - thanks in large part to @alisabzevari

## [1.1.11] - 2019-08-10
### Fixed
- Sidebar icon has been updated and should now size correctly for vscode 1.37.0.

## [1.1.10] - 2019-04-12
### Fixed
- Add DB connection process now handles more issues with connecting to a possibly secured `postgres` database (issue #97).

## [1.1.9] - 2019-03-17
### Changed
- Add DB connection process has been altered to be more user friendly. Also fixes ssl cert issues (issue #66).

## [1.1.8] - 2019-03-08
### Fixed
- PG 11 Version issues for language server (issue #92).

## [1.1.7] - 2019-03-05
### Fixed
- Delete results now properly show RETURNING data (issue #91).

## [1.1.6] - 2018-11-26
### Fixed
- Syntax highlighting when first character of query is a space (issue #79) by @votagus.

## [1.1.5] - 2018-11-26
### Added
- Capability to better separate main queries by pg version
- Support for default connections using settings which can be overridden at the project level (issue #69)
  - To better support default connections, the extension now activates on start vs. when a view/language/command is accessed for the first time.

### Fixed
- Support of PG 11 in function explorer (issue #72)

## [1.1.4] - 2018-10-29
### Added
- `Functions` virtual folder (must enable in configuration) by @lafriks
- Added schemas to autocompletion by @lafriks

### Fixed
- Better hiding of `pg_temp` and `pg_toast` tables by @lafriks

## [1.1.3] - 2018-10-06
### Added
- Better support for blank passwords - doesn't touch Keytar (thanks to @SWW13)

### Fixed
- Performance opening table to show columns degraded when the column query when support was added for v9.3.  Version detection was put in to allow a better performing query to work on 9.4+.

## [1.1.2] - 2018-09-24
### Added
- Support for PostgreSQL 9.3

## [1.1.1] - 2018-09-10
### Fixed
- `prettyPrintJSONfields` setting should work again

## [1.1.0] - 2018-09-03
### Updated
- Transitioned result pane from using TextDocumentContentProvider to using Webviews.

### Fixed
- Serialize results to JSON and XML should work properly again (broke with fix in 1.0.15).

### Added
- Support for `circle` and `point` geometric types.
- All query results now use the result pane.

## [1.0.16] - 2018-08-18
### Fixed
- Explain statements should now work again (broke with fix in 1.0.15)

### Added
- Icon for foreign keys in the database explorer.
- Display formatted type names in results grid headers by @lnicola

## [1.0.15] - 2018-08-16
### Fixed
- Display of results when running queries with multiple columns of the same name.

## [1.0.14] - 2018-08-10
### Fixed
- Display of `interval` data formats
- Changed using namespace name to oid for issue #33

## [1.0.13] - 2018-07-18
### Added
- Support for optionally providing a database when creating a connection (ends up with a single-database connection in the db explorer).
- Added configuration setting to control the sort order of table columns: database order, alphabetical, and reverse alpha.

## [1.0.12] - 2018-07-14
### Fixed
- Quoted schemas/tables in priviledge queries.

### Added
- Support for editing connection details.

## [1.0.11] - 2018-07-06
### Fixed 
- Preserve query focus code was spawning a new query editor.

## [1.0.10] - 2018-07-06
### Fixed 
- Windows bug causing "cannot read property of null" errors - solved simultaneously with @Yarith

## [1.0.9] - 2018-05-30
### Fixed
- Info/Error node - if an error occurred when expanding a node in the database explorer there wasn't an indication of what went wrong

### Added
- Support for PostgreSQL user permissions. Databases, schemas, tables, views should all be filtered based on the user used when setting up the connection.
- Support for quoted identifiers

## [1.0.8] - 2018-05-23
### Added
- Option to disable changing active connection when navigating the explorer by @mterring

## [1.0.7] - 2018-05-16
### Added
- Schema support to table nodes and capitalized table names by @jgoday

## [1.0.6] - 2018-05-12
### Fixed
- Code Completion: grouped fields of the same data type together and show all the tables/views they belong to in a list

## [1.0.5] - 2018-05-11
### Fixed
- Status bar text when connection is not labelled

## [1.0.4] - 2018-05-11
### Added
- Display label for postgres connections by @peterbam
- Rename command for display label

## [1.0.3] - 2018-05-10
### Added
- Show "Run Query" command errors using notifications

## [1.0.2] - 2018-05-09
### Added
- Support for DB Views in the database explorer and code completion

## [1.0.1] - 2018-05-07
### Added
- Support for custom activity bar

## [1.0.0] - 2018-05-05
### Fixed
- Connection button, now properly asks for the connection instead of the database.

### Added
- Syntax highlighting
- Connection aware code completion (keywords, functions, tables, and fields)
- In-line error detection powered by EXPLAIN (one error per query in editor)
- *__Basic__* function signature support (connection aware)

## [0.0.6] - 2018-04-30
### Fixed
- Repository link
- Output Console Name for Language Service

### Added
- Ability to save results to JSON, XML, or CSV.

## [0.0.5] - 2018-04-30
- Initial release