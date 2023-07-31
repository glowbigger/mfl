// creates the examples.ts file
// NOTE webpack has issues with importing fs, so this script should be run
// to create the file, instead of having it read the files

import { readFileSync, readdirSync, writeFile } from 'fs';

// each example file is stored as an array with the first entry being the name
// and the second entry being the code
const examples: [string, string][] = [];

const EXAMPLES_DIRECTORY = `./src/web/examples/`;
const OUTPUT_FILENAME = './src/web/examples.ts';

if (require.main === module) {
  const examples_directory = EXAMPLES_DIRECTORY;
  const exampleFiles: string[] = readdirSync(examples_directory);

  // get the file name and contents of each example file in the examples folder
  for (const exampleFileName of exampleFiles) {
    const buffer = Buffer.from(examples_directory + exampleFileName, 'utf8')
    const content = readFileSync(buffer).toString();
    examples.push([exampleFileName, content]);
  }

  // the contents of the examples.ts file to be generated
  let created = '// created by build-examples.ts, do not edit directly\n\n';

  // create the file contents
  created += 'const examples: { [key: string]: string } = {\n';
  for (const example of examples) {
    created += `\t'${example[0]}':\n`;
    created += `\t\`${example[1]}\`,\n\n`;
  }
  created += '};\n\n';
  created += 'export default examples;';

  // create the file
  writeFile(OUTPUT_FILENAME, created, function (err) {
    if (err) throw err;
    console.log(`The file ${OUTPUT_FILENAME} was created.`);
  });
}
