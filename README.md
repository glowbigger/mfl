# mfl: my first language

mfl is a typescript implementation of Bob Nystrom's Lox from his book
Crafting Interpreters.

# Building and Running

Have node installed on your machine.

Then

```
git clone https://github.com/glowbigger/mfl
cd mfl
npm install
tsc
```

Then run the demo with `npm run demo`, the interactive mode with 
`npm run lang`, or run a file with `npm run lang {file_path}`.

There are a number of test files located in the test folder.

# Features

The data types supported are floating-point numbers, booleans, strings 
and nil (null in other languages).

Basic arithmetic is supported:

```
print 1 + 2; // 3
print 1 - 2; // -1
print 1 * 2; // 2
print 1 / 2; // 0.5
```

String concatenation:

```
print "hello" + " " + "world"; // hello world
```

Boolean operators:

```
print true or false; // true
print true and false; // true
```

Variable declaration:

```
var x = 5;
print x; // 5
```

Control flow:

```
if (1 > 0) {
  print "yes";
} else {
  print "no";
}
```
