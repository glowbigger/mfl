import { readFileSync, readdirSync } from 'fs';
import run from './run';

// runs a given file or an interactive prompt
function test(): void {
  const testPath = `${__dirname}/../../test`;
  const successPath: string = `${testPath}/success/`;
  const failurePath: string = `${testPath}/failure/`;

  // files which ran when they shouldn't have or vice versa
  const files_to_examine: string[] = [];

  // run each file in the success directory, report whether the file ran or not
  console.log('Checking files which should run without errors:');
  const successFiles: string[] = readdirSync(successPath);
  for (const fileString of successFiles) {
    const contentBuffer = Buffer.from(fileString, 'utf8');
    const contentString = readFileSync(successPath + contentBuffer).toString();

    // run the file, report whether it was successful or not
    process.stdout.write(`Running ${fileString}... `);
    const output: [string, boolean] = run(contentString);
    const hadErrors: boolean = output[1];
    if (hadErrors) files_to_examine.push(`success/${fileString}`);
    console.log(hadErrors ? 'failed' : 'passed');
  }

  // process the failure directory, source code which should have errors
  console.log('\nChecking files which should have errors:');
  const failureFiles: string[] = readdirSync(failurePath);
  for (const fileString of failureFiles) {
    const contentBuffer = Buffer.from(fileString, 'utf8')
    const contentString = readFileSync(failurePath + contentBuffer).toString();

    // run the file, report whether it was successful or not
    process.stdout.write(`Running ${fileString}... `);
    const output: [string, boolean] = run(contentString);
    const hadErrors: boolean = output[1];
    if (!hadErrors) files_to_examine.push(`failure/${fileString}`);
    console.log(hadErrors ? 'passed' : 'failed');
  }

  if (files_to_examine.length > 0) {
    console.log('\nThe following files did not have the expected outcome:');
    console.log(files_to_examine);
  } else console.log('\nPassed all tests.');
}

if (require.main === module) {
  test();
}
