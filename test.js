function logErrors(api, header) {
  console.log("\n" + header + ":" + api.errorsToAscii());
  console.log("\nORIGINAL GRAMMER:");
  console.log(api.linesToAscii());
}

try {
  var fs = require('fs');
  var api = require('apg-api');
  var apglib = require('apg-lib');

  let abnfString = fs.readFileSync('syntaxes/pgsql.abnf');

  let generator = new api(abnfString.toString());
  generator.generate();
  if (generator.errors.length) {
    logErrors(generator, 'GRAMMAR ERRORS');
    throw new Error('grammar has errors');
  }

  var grammarObj = generator.toObject();
  var parser = new apglib.parser();
  var result = parser.parse(grammarObj, 0, 'SELECT tst', function() {
    let oo = 'result';
  });
  var o = result;
} catch(e) {
  console.error(e);
}
// var abnr = require('abnf');
// abnr.ParseFile('syntaxes/pgsql.abnf', function(er, rules) {
//   if (er) {
//     console.error(er);
//   } else {
//     let o = rules;
//   }
// })