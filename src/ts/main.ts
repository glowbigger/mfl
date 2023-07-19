import { readFileSync } from 'fs';
import run from './run';

// runs a given file or an interactive prompt
function main(): void {
  // ignore the first two elements of args, which are node and the script path
  const args: string[] = process.argv.slice(2);

  // if no arguments are given, run in interactive mode
  // if an argument is given, 
  if (args.length === 0) {
    const prompt = require('prompt-sync')({ sigint: true });
    console.log('Interactive mode started (Ctrl-c to exit):');
    while (true) {
      const input: string = prompt('> ');
      run(input);
    }
  } else if (args.length === 1) {
    const filePath: string = args[0];
    const contentBuffer = Buffer.from(filePath, 'utf8')
    const contentString = readFileSync(contentBuffer).toString();
    run(contentString);
  } else {
    console.log('mfl: enter a file name or none for interactive mode.');
  }
}

if (require.main === module) {
  main();
}
