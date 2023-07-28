// creates the examples.ts file
// NOTE webpack has issues with importing fs, so this script should be run
// to create the file, instead of having it read the files

import { readFileSync, readdirSync, writeFile } from 'fs';

// each example file is stored as an array with the first entry being the name
// and the second entry being the code
const examples: [string, string][] = [
  ['hello world', 'print \'hello world\';'],
];

const examples_directory = `${__dirname}/../examples/`;

if (require.main === module) {
  const exampleFiles: string[] = readdirSync(examples_directory);

  for (const exampleFileName of exampleFiles) {
    const buffer = Buffer.from(examples_directory + exampleFileName, 'utf8')
    const content = readFileSync(buffer).toString();
    examples.push([exampleFileName, content]);
  }

  // the contents of the examples.ts file to be generated
  let created = '// created by build-examples.ts, do not edit directly\n\n';
  created += 'const examples: [string, string][] = [\n';

  for (const example of examples) {
    created += `\t['${example[0]}',\n\t\`${example[1]}\`],\n`;
  }

  created += '];\n\n';
  created += 'export default examples;';

  // create the file
  writeFile('./src/ts/examples.ts', created, function (err) {
    if (err) throw err;
    console.log('The file ./src/ts/examples.ts was created.');
  });
}
