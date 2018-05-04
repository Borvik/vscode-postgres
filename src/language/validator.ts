export interface ISqlDetails {
  statement: string,
  line: number,
  column: number,
  readonly lines: string[]
};

export class Validator {

  /**
   * We need to track the following:
   *  - Each Statement
   *  - Starting Line
   *  - Starting Column
   */

  public static* prepare_sql(sql: string): IterableIterator<ISqlDetails> {
    let lines = sql.split(/\r?\n/),
      startLine = 0,
      startColumn = 0,
      commandLines: string[] = [];

    let in_statement = false, in_line_comment = false, in_block_comment = false,
      in_identifier = false, in_quote = false, was_in_line_comment = false;

    for (let currentLine = 0; currentLine < lines.length; currentLine++) {
      for (let data of Validator.split_sql(lines[currentLine])) {
        if (!in_statement && !in_line_comment && !in_block_comment) {
          if (data.first !== '--' && data.first !== '/*' && data.contents.trim().length > 0) {
            startColumn = data.start;
            startLine = currentLine;
            in_statement = true;
            commandLines = [];
          }
        }

        if (!in_line_comment && !in_block_comment && !in_identifier && !in_quote) {
          if (data.first === '--') in_line_comment = true;
          else if (data.first === '/*') in_block_comment = true;
          else if (data.first === '"') in_identifier = true;
          else if (data.first === "'") in_quote = true;
        }

        commandLines.push((data.first ? data.first : '') + data.contents + (data.last ? data.last : ''))

        if (!in_line_comment && !in_block_comment && !in_identifier && !in_quote && in_statement && data.last === ';') {
          in_statement = false;
          yield {
            statement: commandLines.join("\n"),
            line: startLine,
            column: startColumn,
            lines: commandLines
          };
        }

        if (in_block_comment && data.last === '*/') in_block_comment = false;
        if (in_identifier && data.last === '""') in_identifier = false;
        if (in_quote && data.last === "''") in_quote = false;
      }
      // if (in_statement) currentStatement += "\n";
      was_in_line_comment = in_line_comment;
      in_line_comment = false;
    }
    if (in_statement && !in_block_comment && !in_identifier && !in_quote) {
      commandLines.push(';');
    }
    if (in_statement) {
      yield {
        statement: commandLines.join("\n"),
        line: startLine,
        column: startColumn,
        lines: commandLines
      };
    }
    //   let response = results.join("\n");
  //   if (in_statement && !in_block_comment) {
  //     if (in_line_comment)
  //       response += "\n";
  //     response += ';';
  //   }
  //   return response;
  }

  // public static preparer_sql(sql) {
  //   let in_statement = false,
  //       in_line_comment = false,
  //       in_block_comment = false;
    
  //   let results: string[] = [];
  //   for (let data of Validator.split_sql(sql)) {
  //     let precontents = null, start_str = null;
  //     if (!in_statement && !in_line_comment && !in_block_comment) {
  //       if (data.start != "--" && data.start != "/*" && data.contents.trim().length > 0) {
  //         in_statement = true;
  //         precontents = 'EXPLAIN ';
  //       }
  //     }

  //     if (data.start == "/*") in_block_comment = true;
  //     else if (data.start == '--' && !in_block_comment) {
  //       in_line_comment = true;
  //       if (!in_statement)
  //         start_str = "//";
  //     }

  //     start_str = start_str || data.start || '';
  //     precontents = precontents || '';

  //     results.push(start_str + precontents + data.contents)

  //     if (!in_line_comment && !in_block_comment && in_statement && data.end === ';')
  //       in_statement = false;
      
  //     if (in_block_comment && data.end === '*/')
  //       in_block_comment = false;

  //     if (in_line_comment && data.end == "\n")
  //       in_line_comment = false;
  //   }
  //   let response = results.join("\n");
  //   if (in_statement && !in_block_comment) {
  //     if (in_line_comment)
  //       response += "\n";
  //     response += ';';
  //   }
  //   return response;
  // }

  public static* split_sql(sql: string) {
    let bookends = [";", '"', '""', "'", "''", "--", "/*", "*/"];
    let last_bookend_found = null;
    let start = 0;

    while (sql && start <= sql.length) {
      let results = Validator.get_next_occurence(sql, start, bookends);
      if (!results) {
        yield {
          first: last_bookend_found,
          last: null,
          contents: sql.substr(start),
          start,
          end: start + sql.substr(start).length
        };
        start = sql.length + 1; //? is this right?
      } else {
        yield {
          first: last_bookend_found,
          last: results.bookend,
          contents: sql.substring(start, results.end),
          start,
          end: results.end
        };
        start = results.end + results.bookend.length + 1;
        last_bookend_found = (results.bookend !== ';') ? results.bookend : null;
      }
    }
  }

  private static get_next_occurence(haystack: string, offset: number, needles: string[]) {
    let firstCharMap = {};
    needles.forEach(n => { firstCharMap[n[0]] = n; });
    let firstChars = Object.keys(firstCharMap);
    while (haystack && offset < haystack.length) {
      if (firstChars.indexOf(haystack[offset]) >= 0) {
        let possible_needle = firstCharMap[haystack[offset]];
        if (haystack.substr(offset, possible_needle.length) === possible_needle)
          return {end: offset, bookend: possible_needle};
      }
      offset++;
    }
    return null;
  }

}