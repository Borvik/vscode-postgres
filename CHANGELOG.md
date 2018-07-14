# Change Log
All notable changes to the "vscode-postgres" extension will be documented in this file.

## [Unreleased]
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