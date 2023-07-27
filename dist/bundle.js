/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ts/environment.ts":
/*!*******************************!*\
  !*** ./src/ts/environment.ts ***!
  \*******************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


// a wrapper for a map to look up values associated with variable ids
Object.defineProperty(exports, "__esModule", ({ value: true }));
const error_1 = __webpack_require__(/*! ./error */ "./src/ts/error.ts");
class Environment {
    constructor(enclosing) {
        this.enclosing = enclosing;
        this.idMap = new Map;
    }
    define(id, value) {
        this.idMap.set(id, value);
    }
    get(id) {
        const maybeValue = this.idMap.get(id);
        if (maybeValue !== undefined)
            return maybeValue;
        if (this.enclosing !== null)
            return this.enclosing.get(id);
        // this error is to be transformed into a LangError by the caller
        // throw new Error(`Undefined variable \'${id}\'.`);
        return undefined;
    }
    assign(id, value) {
        if (this.idMap.has(id)) {
            this.idMap.set(id, value);
            return;
        }
        if (this.enclosing !== null) {
            this.enclosing.assign(id, value);
            return;
        }
        // this error is to be transformed into a LangError by the caller
        throw Error('Undefined variable.');
    }
    // NOTE the following three methods are only used in LOEnvironment, but 
    // typescript thinks LOEnvironment and Environment<LangObject> are different
    // get the variable at the environment the given distance away
    getAt(distance, identifier) {
        const maybeValue = this.ancestor(distance).idMap.get(identifier);
        if (maybeValue === undefined) {
            throw new error_1.ImplementationError(`Incorrect distance given for ${identifier}.`);
        }
        return maybeValue;
    }
    // assign the variable at the environment the given distance away
    assignAt(distance, identifier, value) {
        this.ancestor(distance).idMap.set(identifier, value);
    }
    // get the environment the given distance away
    ancestor(distance) {
        let environment = this;
        for (let i = 0; i < distance; i++) {
            if (environment.enclosing === null)
                throw new error_1.ImplementationError('Given distance to interpreter ancestor function is too high.');
            environment = environment.enclosing;
        }
        return environment;
    }
}
exports["default"] = Environment;


/***/ }),

/***/ "./src/ts/error.ts":
/*!*************************!*\
  !*** ./src/ts/error.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ImplementationError = exports.SyntaxTreeNodeError = exports.TokenRangeError = exports.TokenError = exports.CharacterError = exports.LangError = void 0;
class LangError extends Error {
    constructor(message) {
        super();
        this.message = message;
    }
    ;
}
exports.LangError = LangError;
class CharacterError extends LangError {
    constructor(message, lineString, lineIndex, column) {
        super(message);
        this.lineString = lineString;
        this.lineIndex = lineIndex;
        this.column = column;
    }
    toString() {
        const offset = ' '.repeat(this.column - 1);
        const lineIndex = this.lineIndex;
        const column = this.column;
        const message = this.message;
        return `[line ${lineIndex}, column ${column}] ${message}\n` +
            this.lineString + '\n' + offset + '^';
    }
}
exports.CharacterError = CharacterError;
class TokenError extends LangError {
    constructor(message, token) {
        super(message);
        this.token = token;
    }
    toString() {
        if (this.token.type === 'EOF') {
            return `(at the end of the file) ${this.message}`;
        }
        else {
            const indicator = indicatorString(this.token.column, this.token.column + this.token.lexeme.length - 1);
            const lineIndex = this.token.lineIndex;
            const column = this.token.column;
            const message = this.message;
            return `[line ${lineIndex}, column ${column}] ${message}\n` +
                this.token.lineString + '\n' + indicator;
        }
    }
}
exports.TokenError = TokenError;
class TokenRangeError extends LangError {
    constructor(message, tokenStart, tokenEnd) {
        super(message);
        this.tokenStart = tokenStart;
        this.tokenEnd = tokenEnd;
    }
    toString() {
        const tokenStart = this.tokenStart;
        const tokenEnd = this.tokenEnd;
        // NOTE reminder that the indices follow 1-based indexing
        const startLineString = this.tokenStart.lineString;
        const startLineIndex = this.tokenStart.lineIndex;
        const endLineString = this.tokenEnd.lineString;
        const endLineIndex = tokenEnd.lineIndex;
        const startCol = tokenStart.column;
        const endCol = tokenEnd.column;
        // validate the token ranges
        if (endLineIndex < startLineIndex ||
            tokenStart.type === 'EOF' ||
            tokenEnd.type === 'EOF') {
            throw new ImplementationError('Bad ranges for TokenRangeError.');
        }
        // the error is on one line
        if (startLineIndex === endLineIndex) {
            if (endCol < startCol) {
                const msg = 'Ending column comes before starting column.';
                throw new ImplementationError(msg);
            }
            // create the message
            const indicator = indicatorString(startCol, endCol);
            let message = `[line ${startLineIndex}, column ${startCol} to column ${endCol}] `;
            message += `${this.message}\n${startLineString}\n${indicator}`;
            return message;
        }
        // the error is on consecutive lines
        if (endLineIndex - startLineIndex === 1) {
            // create the indicators
            const startLineIndicator = indicatorString(startCol, startCol + startLineString.length - 1);
            const endLineIndicator = indicatorString(1, endCol);
            // create the message
            let message = `[line ${startLineIndex}, column ${startCol} ` +
                `to line ${endLineIndex}, column ${endCol}] `;
            message += `${this.message}\n`;
            message += `${startLineString}\n${startLineIndicator}\n`;
            message += `${endLineString}\n${endLineIndicator}`;
            return message;
        }
        // the error spans multiple lines
        // create the indicators
        const startLineIndicator = indicatorString(startCol, startCol + tokenStart.lexeme.length - 1);
        const endLineIndicator = indicatorString(1, endCol);
        // create the message
        let message = `[line ${startLineIndex}, column ${startCol} ` +
            `to line ${endLineIndex}, column ${endCol}] `;
        message += `${this.message}\n`;
        message += `${startLineString}\n${startLineIndicator}`;
        message += `\n\n... (inner lines omitted) ...\n\n`;
        message += `${endLineString}\n${endLineIndicator}`;
        return message;
    }
}
exports.TokenRangeError = TokenRangeError;
class SyntaxTreeNodeError extends TokenRangeError {
    constructor(message, treeNode) {
        super(message, treeNode.lToken, treeNode.rToken);
    }
    toString() {
        return super.toString();
    }
}
exports.SyntaxTreeNodeError = SyntaxTreeNodeError;
// for errors in the interpreter code proper and not the source code to be ran 
class ImplementationError extends Error {
    constructor(message) {
        super("Implementation error: " + message);
    }
}
exports.ImplementationError = ImplementationError;
// given two indices, create a ^^^ indicator string to be displayed below text
// NOTE expects the indices to be 1-based
function indicatorString(start, end) {
    if (end < start)
        throw new ImplementationError('Invalid indices given for offset.');
    const offset = ' '.repeat(start - 1);
    const indicator = '^'.repeat(end - start + 1);
    return offset + indicator;
}


/***/ }),

/***/ "./src/ts/expr.ts":
/*!************************!*\
  !*** ./src/ts/expr.ts ***!
  \************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VariableExpr = exports.UnaryExpr = exports.LiteralExpr = exports.LogicalExpr = exports.GroupingExpr = exports.FunctionObjectExpr = exports.CallExpr = exports.BinaryExpr = exports.AssignExpr = exports.ArrayObjectExpr = exports.ArrayAssignExpr = exports.ArrayAccessExpr = exports.Expr = void 0;
const syntaxTreeNode_1 = __importDefault(__webpack_require__(/*! ./syntaxTreeNode */ "./src/ts/syntaxTreeNode.ts"));
class Expr extends syntaxTreeNode_1.default {
}
exports.Expr = Expr;
class ArrayAccessExpr extends Expr {
    constructor(arrayExpr, index, rightBracket) {
        super(arrayExpr.lToken, rightBracket);
        this.arrayExpr = arrayExpr;
        this.index = index;
    }
    accept(visitor) {
        return visitor.visitArrayAccessExpr(this);
    }
}
exports.ArrayAccessExpr = ArrayAccessExpr;
class ArrayAssignExpr extends Expr {
    constructor(arrayAccessExpr, assignmentValue) {
        super(arrayAccessExpr.lToken, assignmentValue.rToken);
        this.arrayAccessExpr = arrayAccessExpr;
        this.assignmentValue = assignmentValue;
    }
    accept(visitor) {
        return visitor.visitArrayAssignExpr(this);
    }
}
exports.ArrayAssignExpr = ArrayAssignExpr;
class ArrayObjectExpr extends Expr {
    constructor(capacity, elements, leftBracket, rightBracket) {
        super(leftBracket, rightBracket);
        this.capacity = capacity;
        this.elements = elements;
    }
    accept(visitor) {
        return visitor.visitArrayObjectExpr(this);
    }
}
exports.ArrayObjectExpr = ArrayObjectExpr;
class AssignExpr extends Expr {
    constructor(variableIdentifier, value) {
        super(variableIdentifier, value.rToken);
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitAssignExpr(this);
    }
}
exports.AssignExpr = AssignExpr;
class BinaryExpr extends Expr {
    constructor(leftExpr, operator, rightExpr) {
        super(leftExpr.lToken, rightExpr.rToken);
        this.leftExpr = leftExpr;
        this.operator = operator;
        this.rightExpr = rightExpr;
    }
    accept(visitor) {
        return visitor.visitBinaryExpr(this);
    }
}
exports.BinaryExpr = BinaryExpr;
class CallExpr extends Expr {
    constructor(callee, rightParen, args) {
        super(callee.lToken, rightParen);
        this.callee = callee;
        this.args = args;
    }
    accept(visitor) {
        return visitor.visitCallExpr(this);
    }
}
exports.CallExpr = CallExpr;
class FunctionObjectExpr extends Expr {
    constructor(parameterTokens, parameterTypes, returnType, statement, keyword) {
        super(keyword, statement.rToken);
        this.parameterTokens = parameterTokens;
        this.parameterTypes = parameterTypes;
        this.returnType = returnType;
        this.statement = statement;
    }
    accept(visitor) {
        return visitor.visitFunctionObjectExpr(this);
    }
}
exports.FunctionObjectExpr = FunctionObjectExpr;
class GroupingExpr extends Expr {
    constructor(lParen, expression, rParen) {
        super(lParen, rParen);
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitGroupingExpr(this);
    }
}
exports.GroupingExpr = GroupingExpr;
class LogicalExpr extends Expr {
    constructor(leftExpr, operator, rightExpr) {
        super(leftExpr.lToken, rightExpr.rToken);
        this.leftExpr = leftExpr;
        this.operator = operator;
        this.rightExpr = rightExpr;
    }
    accept(visitor) {
        return visitor.visitLogicalExpr(this);
    }
}
exports.LogicalExpr = LogicalExpr;
class LiteralExpr extends Expr {
    constructor(value, literalToken) {
        super(literalToken, literalToken);
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitLiteralExpr(this);
    }
}
exports.LiteralExpr = LiteralExpr;
class UnaryExpr extends Expr {
    constructor(operator, rightExpr) {
        super(operator, rightExpr.rToken);
        this.operator = operator;
        this.rightExpr = rightExpr;
    }
    accept(visitor) {
        return visitor.visitUnaryExpr(this);
    }
}
exports.UnaryExpr = UnaryExpr;
class VariableExpr extends Expr {
    constructor(identifier) {
        super(identifier, identifier);
    }
    accept(visitor) {
        return visitor.visitVariableExpr(this);
    }
}
exports.VariableExpr = VariableExpr;


/***/ }),

/***/ "./src/ts/indicator.ts":
/*!*****************************!*\
  !*** ./src/ts/indicator.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReturnIndicator = exports.BreakIndicator = void 0;
// indicates a break to be thrown in a loop
class BreakIndicator {
}
exports.BreakIndicator = BreakIndicator;
// indicates a return value to be thrown in a function
class ReturnIndicator {
    constructor(value) {
        this.value = value;
    }
}
exports.ReturnIndicator = ReturnIndicator;


/***/ }),

/***/ "./src/ts/interpreter.ts":
/*!*******************************!*\
  !*** ./src/ts/interpreter.ts ***!
  \*******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const expr_1 = __webpack_require__(/*! ./expr */ "./src/ts/expr.ts");
const error_1 = __webpack_require__(/*! ./error */ "./src/ts/error.ts");
const langObject_1 = __webpack_require__(/*! ./langObject */ "./src/ts/langObject.ts");
const environment_1 = __importDefault(__webpack_require__(/*! ./environment */ "./src/ts/environment.ts"));
const indicator_1 = __webpack_require__(/*! ./indicator */ "./src/ts/indicator.ts");
class Interpreter {
    constructor(program) {
        this.program = program;
        this.printedLines = [];
        this.globalEnvironment = new environment_1.default(null);
        this.currentEnvironment = this.globalEnvironment;
        this.functionEnvironment = null;
        this.localVariableDistances = new Map();
    }
    // interprets the program and returns the possible printed output
    interpret() {
        // NOTE a single error will end interpretation
        for (const statement of this.program) {
            this.execute(statement);
        }
        return this.printedLines.join('\n');
    }
    evaluate(expr) {
        return (expr.accept(this));
    }
    execute(stmt) {
        // if an environment is provided, then execute the statement using it
        if (this.functionEnvironment !== null) {
            // save the outer environment to restore it later
            const outerEnvironment = this.currentEnvironment;
            // switch environments and reset the function environment to be null
            this.currentEnvironment = this.functionEnvironment;
            this.functionEnvironment = null;
            // NOTE try doesn't matter here, only the finally is used to restore the
            // outer environment regardless of any errors
            try {
                stmt.accept(this);
            }
            finally {
                this.currentEnvironment = outerEnvironment;
            }
        }
        else {
            stmt.accept(this);
        }
    }
    //======================================================================
    // Statement Visitor Methods
    // they string return types are the potential console outputs, which are almost
    // always ''; maybe there's a better solution, but this works for now
    // NOTE this is needed for the web interpreter
    //======================================================================
    visitBlankStmt(stmt) {
        // do nothing
        return;
    }
    visitPrintStmt(stmt) {
        const evaluatedExpression = this.evaluate(stmt.expression);
        this.printedLines.push(this.stringify(evaluatedExpression));
    }
    visitExpressionStmt(stmt) {
        // only does something if the expression is the output of a function call
        // or an assignment expression
        this.evaluate(stmt.expression);
    }
    visitDeclarationStmt(stmt) {
        const value = this.evaluate(stmt.initialValue);
        const id = stmt.identifier.lexeme;
        try {
            // NOTE functions shouldn't have their closures set here, because the
            // environment might be wrong and return statements can return functions
            this.currentEnvironment.define(id, value);
        }
        catch (error) {
            if (error instanceof Error) {
                throw new error_1.TokenError(error.message, stmt.identifier);
            }
            throw new error_1.ImplementationError('Unable to define variable.');
        }
    }
    visitBlockStmt(stmt) {
        // save the outer environment to restore it later
        const outerEnvironment = this.currentEnvironment;
        // create the inner blank environment that has the outer one as its parent
        let innerEnvironment;
        // if the block follows a function call, then the environment for the block
        // was already created with the function parameters
        if (this.functionEnvironment !== null) {
            innerEnvironment = new environment_1.default(this.functionEnvironment);
            this.functionEnvironment = null;
        }
        else
            innerEnvironment = new environment_1.default(outerEnvironment);
        // switch environments and execute the statements with it
        this.currentEnvironment = innerEnvironment;
        try {
            for (const statement of stmt.statements) {
                this.execute(statement);
            }
        }
        finally {
            // restore the outer environment regardless of any errors
            this.currentEnvironment = outerEnvironment;
        }
    }
    visitIfStmt(stmt) {
        const condition = this.evaluate(stmt.condition);
        if (condition)
            this.execute(stmt.thenBranch);
        else if (stmt.elseBranch !== null)
            this.execute(stmt.elseBranch);
    }
    visitWhileStmt(stmt) {
        while (this.evaluate(stmt.condition)) {
            try {
                this.execute(stmt.body);
            }
            catch (breakOrError) {
                if (breakOrError instanceof indicator_1.BreakIndicator)
                    break;
                else
                    throw breakOrError;
            }
        }
    }
    visitBreakStmt(stmt) {
        throw new indicator_1.BreakIndicator();
    }
    visitReturnStmt(stmt) {
        const returnValue = this.evaluate(stmt.value);
        throw new indicator_1.ReturnIndicator(returnValue);
    }
    //======================================================================
    // Expression Visitor Methods
    //======================================================================
    visitBinaryExpr(expr) {
        let leftValue;
        let rightValue;
        switch (expr.operator.type) {
            case 'EQUAL_EQUAL':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                return leftValue === rightValue;
            case 'BANG_EQUAL':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                return leftValue != rightValue;
            case 'LESS':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                return leftValue < rightValue;
            case 'LESS_EQUAL':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                return leftValue <= rightValue;
            case 'GREATER':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                return leftValue > rightValue;
            case 'GREATER_EQUAL':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                return leftValue >= rightValue;
            case 'PLUS':
                // + can add numbers or concatenate strings
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                if (typeof (leftValue) == 'number' && typeof (rightValue) == 'number') {
                    // number addition
                    return leftValue + rightValue;
                }
                else {
                    // at least one of the values is a string, so concatenate them
                    return leftValue.toString() + rightValue.toString();
                }
            case 'MINUS':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                return leftValue - rightValue;
            case 'STAR':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                return leftValue * rightValue;
            case 'SLASH':
                leftValue = this.evaluate(expr.leftExpr);
                rightValue = this.evaluate(expr.rightExpr);
                if (rightValue === 0) {
                    throw new error_1.TokenError('Division by 0.', expr.operator);
                }
                return leftValue / rightValue;
        }
        throw new error_1.ImplementationError('Unknown operator in binary expression.');
    }
    visitUnaryExpr(expr) {
        let rightValue;
        switch (expr.operator.type) {
            case 'MINUS':
                rightValue = this.evaluate(expr.rightExpr);
                return -rightValue;
            case 'BANG':
                rightValue = this.evaluate(expr.rightExpr);
                return rightValue;
        }
        throw new error_1.ImplementationError('Unknown operator in unary expression.');
    }
    visitGroupingExpr(expr) {
        return this.evaluate(expr.expression);
    }
    visitLiteralExpr(expr) {
        // literals must have number, string, or boolean types
        // NOTE the below is more clear than asserting as LangObject
        return expr.value;
    }
    visitVariableExpr(expr) {
        return this.lookupVariable(expr.lToken.lexeme, expr);
    }
    visitAssignExpr(expr) {
        const identifier = expr.lToken.lexeme;
        const value = this.evaluate(expr.value);
        const distance = this.localVariableDistances.get(expr);
        if (distance !== undefined) {
            this.currentEnvironment.assignAt(distance, identifier, value);
        }
        else {
            this.globalEnvironment.assign(identifier, value);
        }
        return value;
    }
    visitLogicalExpr(expr) {
        const leftValue = this.evaluate(expr.leftExpr);
        if (expr.operator.type === 'OR') {
            // or, if the left side is true, then the 'or' expression is true
            if (leftValue)
                return true;
        }
        else {
            // and, if the left side is false, then the 'and' expression is false
            if (!leftValue)
                return false;
        }
        const rightValue = this.evaluate(expr.rightExpr);
        return rightValue;
    }
    visitFunctionObjectExpr(expr) {
        return new langObject_1.FunctionLangObject(expr.parameterTokens, expr.statement, this.currentEnvironment);
    }
    visitCallExpr(expr) {
        const callee = this.evaluate(expr.callee);
        let args = [];
        for (const arg of expr.args) {
            args.push(this.evaluate(arg));
        }
        const returnValue = callee.call(this, args);
        return returnValue;
    }
    visitArrayObjectExpr(expr) {
        // evaluate the capacity
        let capacity;
        if (expr.capacity instanceof expr_1.Expr) {
            capacity = this.evaluate(expr.capacity);
            // if the capacity is an expression, then the array was made with a given
            // length, which might be invalid, in which case throw a runtime error
            if (capacity < 0)
                throw new error_1.SyntaxTreeNodeError('Number must be positive.', expr.capacity);
        }
        else
            capacity = expr.capacity;
        // evaluate the elements
        let elements = [];
        if (Array.isArray(expr.elements)) {
            // if the elements are all provided, then insert them all
            elements = [];
            for (const elementExpression of expr.elements) {
                const currentElement = this.evaluate(elementExpression);
                elements.push(currentElement);
            }
        }
        else {
            // otherwise, insert the given element to fill the array
            const givenElement = this.evaluate(expr.elements);
            for (let i = 0; i < capacity; i++) {
                elements.push(givenElement);
            }
        }
        return new langObject_1.ArrayLangObject(capacity, elements);
    }
    visitArrayAccessExpr(expr) {
        const index = this.evaluate(expr.index);
        const array = this.evaluate(expr.arrayExpr);
        if (index < 0 || index > array.capacity - 1) {
            throw new error_1.SyntaxTreeNodeError('Index is out of range.', expr.index);
        }
        const accessed = array.elements[index];
        return accessed;
    }
    visitArrayAssignExpr(expr) {
        const arrayExpr = expr.arrayAccessExpr.arrayExpr;
        // this part is idential to ArrayAccessExpr, except the value is not queried
        const index = this.evaluate(expr.arrayAccessExpr.index);
        const arrayObject = this.evaluate(arrayExpr);
        if (index < 0 || index > arrayObject.capacity - 1) {
            throw new error_1.SyntaxTreeNodeError('Index is out of range.', expr.arrayAccessExpr.index);
        }
        // insert the value into the array
        const value = this.evaluate(expr.assignmentValue);
        arrayObject.elements[index] = value;
        return value;
    }
    //======================================================================
    // HELPERS
    //======================================================================
    // turns an object into a string
    stringify(object) {
        if (object === null)
            return 'void function return';
        if (typeof (object) === 'number')
            return object.toString();
        if (typeof (object) === 'boolean')
            return object ? 'true' : 'false';
        if (object instanceof langObject_1.FunctionLangObject ||
            object instanceof langObject_1.ArrayLangObject) {
            return object.toString();
        }
        // if it's a string, just return it
        return object;
    }
    lookupVariable(identifier, expr) {
        const distance = this.localVariableDistances.get(expr);
        if (distance !== undefined) {
            // local variables
            return this.currentEnvironment.getAt(distance, identifier);
        }
        else {
            // global variables
            const maybeValue = this.globalEnvironment.get(identifier);
            if (maybeValue === undefined)
                throw new error_1.ImplementationError(`Couldn\'t find distance for ${identifier}.`);
            return maybeValue;
        }
    }
    //======================================================================
    // PUBLIC
    //======================================================================
    resolve(expr, depth) {
        this.localVariableDistances.set(expr, depth);
    }
}
exports["default"] = Interpreter;


/***/ }),

/***/ "./src/ts/langObject.ts":
/*!******************************!*\
  !*** ./src/ts/langObject.ts ***!
  \******************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ArrayLangObject = exports.FunctionLangObject = void 0;
const environment_1 = __importDefault(__webpack_require__(/*! ./environment */ "./src/ts/environment.ts"));
const error_1 = __webpack_require__(/*! ./error */ "./src/ts/error.ts");
const stmt_1 = __webpack_require__(/*! ./stmt */ "./src/ts/stmt.ts");
const indicator_1 = __webpack_require__(/*! ./indicator */ "./src/ts/indicator.ts");
//======================================================================
// Complex Objects
//======================================================================
class FunctionLangObject {
    constructor(parameterTokens, statement, closure) {
        this.parameterTokens = parameterTokens;
        this.statement = statement;
        this.closure = closure;
    }
    toString() {
        return 'anonymous function object';
    }
    call(interpreter, args) {
        // create the inner environment, make sure it exists
        if (this.closure == null)
            throw new error_1.ImplementationError('Function called with no closure set.');
        const innerEnvironment = new environment_1.default(this.closure);
        // define the arguments in the inner environment
        for (const i in this.parameterTokens) {
            const id = this.parameterTokens[i].lexeme;
            innerEnvironment.define(id, args[i]);
        }
        // provide the environment with the function parameter
        interpreter.functionEnvironment = innerEnvironment;
        try {
            // check if the next statement is a block statement or a normal one to
            // avoid a redundant empty environment around a block statment
            if (this.statement instanceof stmt_1.BlockStmt)
                interpreter.visitBlockStmt(this.statement);
            else
                interpreter.execute(this.statement);
        }
        catch (returnOrError) {
            // return was thrown
            if (returnOrError instanceof indicator_1.ReturnIndicator)
                return returnOrError.value;
            // error
            throw returnOrError;
        }
        // if no value was returned with no errors, then the function was a void
        throw new error_1.ImplementationError('No return value was thrown by a function.');
    }
}
exports.FunctionLangObject = FunctionLangObject;
class ArrayLangObject {
    constructor(capacity, elements) {
        this.capacity = capacity;
        this.elements = elements;
    }
    toString() {
        return '[' + this.elements.toString() + ']';
    }
}
exports.ArrayLangObject = ArrayLangObject;


/***/ }),

/***/ "./src/ts/langType.ts":
/*!****************************!*\
  !*** ./src/ts/langType.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ArrayLangType = exports.FunctionLangType = exports.LangTypeEqual = exports.ComplexLangType = void 0;
class ComplexLangType {
}
exports.ComplexLangType = ComplexLangType;
// returns whether two language object types are equal
function LangTypeEqual(type1, type2) {
    if (type1 instanceof ArrayLangType && type2 instanceof ArrayLangType) {
        return type1.equals(type2);
    }
    if (type1 instanceof FunctionLangType && type2 instanceof FunctionLangType) {
        return type1.equals(type2);
    }
    return type1 === type2;
}
exports.LangTypeEqual = LangTypeEqual;
//======================================================================
// Complex Types
//======================================================================
class FunctionLangType extends ComplexLangType {
    constructor(parameters, returnType) {
        super();
        this.parameters = parameters;
        this.returnType = returnType;
    }
    toString() { return 'FunctionLangType'; }
    equals(other) {
        if (!(other instanceof FunctionLangType))
            return false;
        // check return types
        if (!LangTypeEqual(other.returnType, this.returnType))
            return false;
        // check parameter lengths
        const thisNumParameters = this.parameters.length;
        const otherNumParameters = other.parameters.length;
        if (thisNumParameters != otherNumParameters)
            return false;
        // check parameter types
        for (const i in this.parameters) {
            if (!LangTypeEqual(this.parameters[i], other.parameters[i]))
                return false;
        }
        return true;
    }
}
exports.FunctionLangType = FunctionLangType;
;
class ArrayLangType extends ComplexLangType {
    constructor(innerType) {
        super();
        this.innerType = innerType;
    }
    equals(other) {
        if (other instanceof ArrayLangType)
            return LangTypeEqual(this.innerType, other.innerType);
        return false;
    }
}
exports.ArrayLangType = ArrayLangType;


/***/ }),

/***/ "./src/ts/parser.ts":
/*!**************************!*\
  !*** ./src/ts/parser.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const expr_1 = __webpack_require__(/*! ./expr */ "./src/ts/expr.ts");
const error_1 = __webpack_require__(/*! ./error */ "./src/ts/error.ts");
const stmt_1 = __webpack_require__(/*! ./stmt */ "./src/ts/stmt.ts");
const typeExpr_1 = __webpack_require__(/*! ./typeExpr */ "./src/ts/typeExpr.ts");
class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.currentIndex = 0;
    }
    // program        → statement* EOF ;
    // NOTE no need to worry about the EOF
    parse() {
        const statements = [];
        const errors = [];
        // parse all statements, catching any errors
        while (!this.isAtEnd()) {
            try {
                statements.push(this.parseStatement());
            }
            catch (error) {
                if (error instanceof error_1.LangError) {
                    errors.push(error);
                    // after an error, consume tokens until the beginning of a statement
                    let syncDone = false;
                    while (!this.isAtEnd() && !syncDone) {
                        switch (this.peek().type) {
                            case 'SEMICOLON':
                                // a semicolon ends a statement, so it must get consumed
                                this.consume();
                                syncDone = true;
                                break;
                            // these keywords begin a statement, so they shouldn't get consumed
                            // TODO if you add classes, you have to add the keyword here
                            case 'FUNCTION':
                            case 'LET':
                            case 'FOR':
                            case 'IF':
                            case 'WHILE':
                            case 'PRINT':
                            case 'RETURN':
                            case 'BREAK':
                                syncDone = true;
                                break;
                        }
                        if (!syncDone)
                            this.consume();
                    }
                }
                else {
                    // unexpected errors will stop the parser immediately
                    throw error;
                }
            }
        }
        // throw the errors all at once as an array
        if (errors.length > 0)
            throw errors;
        return statements;
    }
    //======================================================================
    // Statement Parsing Methods
    //======================================================================
    // statement           → ifStmt | blockStmt | whileStmt | forStmt |
    //                     ( ( declarationStmt | printStmt | exprStmt )? ";" ) ;
    parseStatement() {
        let statement;
        switch (this.peek().type) {
            // if the initial token is a ;, then return an empty statement
            case 'SEMICOLON':
                const semicolon = this.consume();
                return new stmt_1.BlankStmt(semicolon);
            // a break statement is a single token
            case 'BREAK':
                const keyword = this.consume();
                const breakSemicolon = this.expect('SEMICOLON', 'Expect semicolon instead.');
                return new stmt_1.BreakStmt(keyword, breakSemicolon);
            case 'IF':
                return (this.parseIfStatement());
            case 'LEFT_BRACE':
                return (this.parseBlockStatement());
            case 'WHILE':
                return (this.parseWhileStatement());
            case 'LET':
                return (this.parseDeclarationStatement());
            case 'PRINT':
                return (this.parsePrintStatement());
            case 'RETURN':
                return (this.parseReturnStatement());
            // otherwise, parse an expression statement
            default:
                statement = this.parseExpressionStatement();
                break;
        }
        return statement;
    }
    // ifStmt              → "if" expression "then" statement ("else" statement)? ;
    parseIfStatement() {
        const ifToken = this.expect('IF', 'Expect \'if\' to start if statement.');
        const condition = this.parseExpression();
        this.expect('THEN', 'Expect \'then\' after condition.');
        const thenBranch = this.parseStatement();
        let elseBranch = null;
        if (this.match('ELSE')) {
            this.consume();
            elseBranch = this.parseStatement();
        }
        return new stmt_1.IfStmt(ifToken, condition, thenBranch, elseBranch);
    }
    // blockStmt           → "{" statement* "}" ;
    parseBlockStatement() {
        const leftBrace = this.expect('LEFT_BRACE', 'Expect \'{\' to begin block statement.');
        const statements = [];
        while (!this.match('RIGHT_BRACE', 'EOF')) {
            statements.push(this.parseStatement());
        }
        const rightBrace = this.expect('RIGHT_BRACE', 'Expect \'}\' to end block statement.');
        return new stmt_1.BlockStmt(leftBrace, statements, rightBrace);
    }
    // whileStmt           → "while" "(" condition ")" statement
    parseWhileStatement() {
        const whileToken = this.expect('WHILE', 'Expect \'while\' to begin while statement.');
        const condition = this.parseExpression();
        this.expect('DO', 'Expect \'do\' after condition.');
        const body = this.parseStatement();
        return new stmt_1.WhileStmt(whileToken, condition, body);
    }
    // NOTE exprStmt only exists to make clear that expression statements exist
    parseExpressionStatement() {
        const expression = this.parseExpression();
        const semicolon = this.expect('SEMICOLON', 'Expect semicolon instead.');
        return new stmt_1.ExpressionStmt(expression, semicolon);
    }
    // printStmt      → "print" expression ;
    parsePrintStatement() {
        const keyword = this.expect('PRINT', 'Expect initial \'print\' for print statement.');
        const expression = this.parseExpression();
        const semicolon = this.expect('SEMICOLON', 'Expect semicolon instead.');
        return new stmt_1.PrintStmt(keyword, expression, semicolon);
    }
    // declarationStmt     → "let" IDENTIFIER ( ":" objectType )? "=" expression ;
    parseDeclarationStatement() {
        const keyword = this.expect('LET', 'Expect \'let\' before variable declaration.');
        const identifier = this.expect('IDENTIFIER', 'Expect identifier name in declaration.');
        let type = null;
        if (this.match('COLON')) {
            this.consume();
            type = this.parseObjectType();
        }
        this.expect('EQUAL', 'Expect an \'=\' in a declaration.');
        const initialValue = this.parseExpression();
        const semicolon = this.expect('SEMICOLON', 'Expect semicolon instead.');
        return new stmt_1.DeclarationStmt(keyword, identifier, type, initialValue, semicolon);
    }
    // returnStmt        → "return" expression ;
    parseReturnStatement() {
        const keyword = this.expect('RETURN', 'Expect initial \'return\' for return statement.');
        const expression = this.parseExpression();
        const semicolon = this.expect('SEMICOLON', 'Expect semicolon instead.');
        return new stmt_1.ReturnStmt(keyword, expression, semicolon);
    }
    //======================================================================
    // Expression Parsing Methods
    //======================================================================
    // expression     → assignment ;
    parseExpression() {
        return this.parseAssignment();
    }
    // assignment          → callOrAccess "=" assignment
    //                       IDENTIFIER "=" assignment
    //                       | logic_or ;
    // NOTE as a reminder, an assignment is not a statement: a = (b = c), but it
    // almost always gets called as apart of an expression statement
    parseAssignment() {
        // first parse for an equality rule, which may return an identifier
        let expr = this.parseLogicOr();
        // if the next token is an =, then the assignment is valid if expr is a 
        // variable, otherwise just return the expression
        if (this.match('EQUAL')) {
            const equalsSign = this.consume();
            if (expr instanceof expr_1.VariableExpr) {
                const value = this.parseAssignment();
                return new expr_1.AssignExpr(expr.lToken, value);
            }
            if (expr instanceof expr_1.ArrayAccessExpr) {
                const value = this.parseAssignment();
                return new expr_1.ArrayAssignExpr(expr, value);
            }
            throw new error_1.TokenError('Trying to assign to invalid target.', equalsSign);
        }
        return expr;
    }
    // logic_or            → logic_and ( "or" expression )* ;
    parseLogicOr() {
        let expr = this.parseLogicAnd();
        if (this.match('OR')) {
            const left = expr;
            const operator = this.consume();
            const right = this.parseExpression();
            return new expr_1.LogicalExpr(left, operator, right);
        }
        return expr;
    }
    // logic_and           → equality ( "and" expression )* ;
    parseLogicAnd() {
        let expr = this.parseEquality();
        if (this.match('AND')) {
            const left = expr;
            const operator = this.consume();
            const right = this.parseExpression();
            return new expr_1.LogicalExpr(left, operator, right);
        }
        return expr;
    }
    // equality       → comparison ( ( "!=" | "==" ) comparison )* ;
    parseEquality() {
        return this.parseBinary(() => this.parseComparison(), 'BANG_EQUAL', 'EQUAL_EQUAL');
    }
    // comparison     → term ( ( ">" | ">=" | "<" | "<=" ) term )* ;
    parseComparison() {
        return this.parseBinary(() => this.parseTerm(), 'LESS', 'LESS_EQUAL', 'GREATER', 'GREATER_EQUAL');
    }
    // term           → factor ( ( "-" | "+" ) factor )* ;
    parseTerm() {
        return this.parseBinary(() => this.parseFactor(), 'MINUS', 'PLUS');
    }
    // factor         → unary ( ( "/" | "*" ) unary )* ;
    parseFactor() {
        return this.parseBinary(() => this.parseUnary(), 'SLASH', 'STAR');
    }
    // unary          → ( "!" | "-" ) unary | call ;
    parseUnary() {
        if (this.match('BANG', 'MINUS')) {
            const operator = this.consume();
            const right = this.parseUnary();
            return new expr_1.UnaryExpr(operator, right);
        }
        else {
            return this.parseCallOrAccess();
        }
    }
    // callOrAccess      → primary ( arrayAccess | call )* ;
    parseCallOrAccess() {
        // the base, which can be built on, ie base -> base() -> base()[5] -> ...
        let base = this.parsePrimary();
        while (this.match('LEFT_PAREN', 'LEFT_BRACKET')) {
            if (this.match('LEFT_PAREN'))
                base = this.parseCall(base);
            if (this.match('LEFT_BRACKET'))
                base = this.parseArrayAccess(base);
        }
        return base;
    }
    // call              → "(" ( expression ( "," expression)* )? ")" ;
    // NOTE when this is called, the base has already been parsed
    parseCall(base) {
        this.expect('LEFT_PAREN', 'Expect \'(\' for call.');
        // parse arguments
        let args = [];
        if (!this.match('RIGHT_PAREN')) {
            do {
                args.push(this.parseExpression());
            } while (this.matchAndConsume('COMMA'));
        }
        // rparen kept for error reporting
        const rightParen = this.expect('RIGHT_PAREN', 'Expect \')\' after arguments.');
        return new expr_1.CallExpr(base, rightParen, args);
    }
    // arrayAccess       → "[" expression "]" ;
    // NOTE when this is called, the base has already been parsed
    parseArrayAccess(base) {
        this.expect('LEFT_BRACKET', 'Expect \'[\' for array access.');
        const index = this.parseExpression();
        const rightBracket = this.expect('RIGHT_BRACKET', 'Expect \']\' for array access.');
        return new expr_1.ArrayAccessExpr(base, index, rightBracket);
    }
    // primary           → NUMBER | STRING | "true" | "false" | functionObject |
    //                     arrayObject | IDENTIFIER | "(" expression ")" ;
    parsePrimary() {
        if (this.match('NUMBER', 'STRING', 'TRUE', 'FALSE')) {
            const token = this.consume();
            return new expr_1.LiteralExpr(token.value, token);
        }
        if (this.match('FUNCTION')) {
            return this.parseFunctionObject();
        }
        if (this.match('LEFT_BRACKET')) {
            return this.parseArrayObject();
        }
        if (this.match('IDENTIFIER')) {
            return new expr_1.VariableExpr(this.consume());
        }
        if (this.match('LEFT_PAREN')) {
            const rParen = this.consume();
            const primaryExpr = this.parseExpression();
            const lParen = this.expect('RIGHT_PAREN', 'Expect \')\' after expression.');
            return new expr_1.GroupingExpr(lParen, primaryExpr, rParen);
        }
        // if nothing can be parsed in primary, then the expression rule failed
        throw new error_1.TokenError('Expect expression.', this.peek());
    }
    // functionObject → "fn" "(" ( ( IDENTIFIER ":" objectType "," )* 
    //                  ( IDENTIFIER ":" objectType) )? ")" 
    //                  "=>" ( objectType ) statement
    parseFunctionObject() {
        const keyword = this.expect('FUNCTION', 'Expect \'fn\' for function object.');
        this.expect('LEFT_PAREN', 'Expect \'(\' after \'fn\'.');
        let parameterTokens = [];
        let parameterTypes = [];
        // parameters
        let commaNeeded = false;
        while (!this.match('RIGHT_PAREN')) {
            if (commaNeeded) {
                this.expect('COMMA', 'Expect comma between parameters.');
            }
            // parse one parameter
            const id = this.expect('IDENTIFIER', 'Expect identifier.');
            this.expect('COLON', 'Expect colon after identifier.');
            const type = this.parseObjectType();
            parameterTokens.push(id);
            parameterTypes.push(type);
            // if a ) isn't found after the first identifier, a comma is needed
            commaNeeded = true;
        }
        // consume the )
        this.consume();
        // return type and statement
        this.expect('RIGHTARROW', 'Expect \'=>\' after parameters.');
        const returnType = this.parseObjectType();
        // for error reporting, keep the current token
        const statement = this.parseStatement();
        return new expr_1.FunctionObjectExpr(parameterTokens, parameterTypes, returnType, statement, keyword);
    }
    // equality, comparison, term, factor have the same syntax, so they share code
    parseBinary(inner, ...matchTypes) {
        let expr = inner();
        while (this.match(...matchTypes)) {
            const left = expr;
            const operator = this.consume();
            const right = inner();
            expr = new expr_1.BinaryExpr(left, operator, right);
        }
        return expr;
    }
    // arrayObject       → filledArray | lengthArray ;
    parseArrayObject() {
        const leftBracket = this.expect('LEFT_BRACKET', 'Expect left bracket for array start.');
        if (this.match('RIGHT_BRACKET')) {
            // an empty array is not allowed because its type can't be inferred
            // NOTE they must be made like so [ 0 int ]
            const rightBracket = this.consume();
            const msg = 'An empty array cannot be made in this way.';
            throw new error_1.TokenRangeError(msg, leftBracket, rightBracket);
        }
        // parse the first expression, it is unknown at this point whether the array
        // is a list of expressions or an array with a given type and length
        const lengthOrFirstElement = this.parseExpression();
        // if the next token is ], the array has one expression, ie [ 5 ] or [ "hi" ]
        if (this.match('RIGHT_BRACKET')) {
            const rightBracket = this.consume();
            const capacity = 1;
            const expressions = [lengthOrFirstElement];
            return new expr_1.ArrayObjectExpr(capacity, expressions, leftBracket, rightBracket);
        }
        // if the next token is a comma, then the array has multiple expression
        // NOTE the comma must not be consumed here
        if (this.match('COMMA'))
            return this.parseFilledArray(leftBracket, lengthOrFirstElement);
        // otherwise try to parse an array with a given length, ie [ 4 int ]
        return this.parseLengthArray(leftBracket, lengthOrFirstElement);
    }
    // filledArray       → "[" expression (( "," expression )* )? "]"
    // NOTE parses the rest of a filled array after the first expression
    parseFilledArray(leftBracket, firstExpression) {
        const elements = [firstExpression];
        while (!this.isAtEnd() && !this.match('RIGHT_BRACKET')) {
            this.expect('COMMA', 'Expect comma.');
            const currentElement = this.parseExpression();
            elements.push(currentElement);
        }
        // if the end of the file is reached, throw an error, otherwise consume the ]
        const rightBracket = this.expect('RIGHT_BRACKET', 'Expect right bracket.');
        const capacity = elements.length;
        return new expr_1.ArrayObjectExpr(capacity, elements, leftBracket, rightBracket);
    }
    // lengthArray       → "[" expression "of" expression "]" ;
    // NOTE parses the rest of a length array after the first expression
    parseLengthArray(leftBracket, expression) {
        this.expect('OF', 'Expect \'of\' after length expression.');
        const object = this.parseExpression();
        const rightBracket = this.expect('RIGHT_BRACKET', 'Expect right bracket.');
        return new expr_1.ArrayObjectExpr(expression, object, leftBracket, rightBracket);
    }
    //======================================================================
    // Type Parsing Methods
    //======================================================================
    // objectType     → "number" | "string" | "bool" | functionType | arrayType ;
    parseObjectType() {
        const peekType = this.peek().type;
        const primitiveTypes = ['NUMBER_PRIMITIVE_TYPE',
            'STRING_PRIMITIVE_TYPE',
            'BOOL_PRIMITIVE_TYPE'];
        // primitives
        if (primitiveTypes.includes(peekType))
            return new typeExpr_1.LiteralTypeExpr(this.consume());
        // arrays
        if (peekType === 'LEFT_BRACKET') {
            return this.parseArrayObjectType();
        }
        // default, try to parse a function
        return this.parseFunctionObjectType();
    }
    // functionType        → "(" ( ( objectType "," )* objectType )? ")" "=>"
    //                       ( objectType ) ;
    parseFunctionObjectType() {
        const lparen = this.expect('LEFT_PAREN', 'Expect \'(\' for function type.');
        let parameters = [];
        let returnType;
        // parameters
        let commaNeeded = false;
        while (!this.match('RIGHT_PAREN')) {
            if (commaNeeded)
                this.expect('COMMA', 'Expect comma between parameters.');
            parameters.push(this.parseObjectType());
            // if a ) isn't found after the first identifier, a comma is needed
            commaNeeded = true;
        }
        // consume the ) and =>
        this.expect('RIGHT_PAREN', 'Expect \')\' after parameters.');
        this.expect('RIGHTARROW', 'Expect \'=>\' for function type.');
        returnType = this.parseObjectType();
        return new typeExpr_1.FunctionTypeExpr(lparen, parameters, returnType);
    }
    // arrayType         → "[" objectType "]"
    parseArrayObjectType() {
        const lBracket = this.expect('LEFT_BRACKET', 'Expect \'[\' for array type.');
        const innerType = this.parseObjectType();
        const rBracket = this.expect('RIGHT_BRACKET', 'Expect \']\' for array type.');
        return new typeExpr_1.ArrayTypeExpr(lBracket, innerType, rBracket);
    }
    //======================================================================
    // Helpers
    //======================================================================
    peek() {
        return this.tokens[this.currentIndex];
    }
    consume() {
        return this.tokens[this.currentIndex++];
    }
    // conditionally advance if the current token has the given token type,
    // otherwise throws an error with the given message
    expect(tokenType, message) {
        if (this.peek().type === tokenType)
            return this.consume();
        throw new error_1.TokenError(message, this.peek());
    }
    // returns whether the current token's type matches the given token type
    match(...types) {
        for (const type of types) {
            if (this.peek().type === type) {
                return true;
            }
        }
        return false;
    }
    // just like match(), except consumes the token if there was a match
    matchAndConsume(...types) {
        for (const type of types) {
            if (this.peek().type === type) {
                this.consume();
                return true;
            }
        }
        return false;
    }
    // checks if there are no more tokens to consume
    isAtEnd() {
        return this.peek().type === 'EOF';
    }
}
exports["default"] = Parser;


/***/ }),

/***/ "./src/ts/resolver.ts":
/*!****************************!*\
  !*** ./src/ts/resolver.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


/*
 * the resolver checks that:
 * each variable resolves to the same one, no matter where and when it is called
 * variables are used
 * variables are not defined to be their own value
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
const error_1 = __webpack_require__(/*! ./error */ "./src/ts/error.ts");
const expr_1 = __webpack_require__(/*! ./expr */ "./src/ts/expr.ts");
//class Resolver implements ExprVisitor, StmtVisitor {
//  private readonly interpreter: Interpreter;
//  constructor(interpreter: Interpreter) {
//    this.interpreter = interpreter;
//  }
//  //======================================================================
//  // Resolving methods
//  //======================================================================
class Resolver {
    constructor(interpreter, typeValidator) {
        this.interpreter = interpreter;
        this.typeValidator = typeValidator;
        this.initializedVariablesScopes = [];
    }
    // NOTE a redundant method for clarity purposes, you could also make
    // resolveStatements public
    resolveProgram(program) {
        this.resolveStatements(program);
    }
    //======================================================================
    // Stmt Visitor
    //======================================================================
    visitBlockStmt(stmt) {
        this.beginScope();
        this.resolveStatements(stmt.statements);
        this.endScope();
    }
    visitDeclarationStmt(stmt) {
        let initialValue = stmt.initialValue;
        // strip any unnecessary parentheses
        while (initialValue instanceof expr_1.GroupingExpr) {
            // NOTE have to work around typescript assertion system
            const value = initialValue;
            initialValue = value.expression;
        }
        if (initialValue instanceof expr_1.FunctionObjectExpr) {
            // functions are handled in a different order for recursion purposes
            this.declare(stmt.identifier);
            this.define(stmt.identifier);
            this.resolveExpression(initialValue);
        }
        else {
            this.declare(stmt.identifier);
            this.resolveExpression(initialValue);
            this.define(stmt.identifier);
        }
    }
    // NOTE from here on out, all the visit methods are generic
    visitExpressionStmt(stmt) {
        this.resolveExpression(stmt.expression);
    }
    visitIfStmt(stmt) {
        this.resolveExpression(stmt.condition);
        this.resolveStatement(stmt.thenBranch);
        if (stmt.elseBranch !== null)
            this.resolveStatement(stmt.elseBranch);
    }
    visitPrintStmt(stmt) {
        this.resolveExpression(stmt.expression);
    }
    visitReturnStmt(stmt) {
        if (stmt.value !== null)
            this.resolveExpression(stmt.value);
    }
    visitWhileStmt(stmt) {
        this.resolveExpression(stmt.condition);
        this.resolveStatement(stmt.body);
    }
    visitBlankStmt(stmt) {
        return;
    }
    visitBreakStmt(stmt) {
        return;
    }
    //======================================================================
    // Expr Visitor
    //======================================================================
    visitVariableExpr(expr) {
        // this is just a verbose js way of peeking the scope stack
        const peekIndex = this.initializedVariablesScopes.length - 1;
        const innermostScope = this.initializedVariablesScopes[peekIndex];
        if (this.initializedVariablesScopes.length > 0 &&
            innermostScope.get(expr.lToken.lexeme) === false) {
            const msg = 'Can\'t read local variable in its own initializer.';
            throw new error_1.SyntaxTreeNodeError(msg, expr);
        }
        this.resolveLocalVariable(expr, expr.lToken.lexeme);
    }
    visitAssignExpr(expr) {
        this.resolveExpression(expr.value);
        this.resolveLocalVariable(expr, expr.lToken.lexeme);
    }
    visitFunctionObjectExpr(expr) {
        this.resolveFunction(expr);
    }
    // NOTE from here on out, all the visit methods are generic
    visitArrayAccessExpr(expr) {
        this.resolveExpression(expr.arrayExpr);
        this.resolveExpression(expr.index);
    }
    visitArrayAssignExpr(expr) {
        this.resolveExpression(expr.arrayAccessExpr);
        this.resolveExpression(expr.assignmentValue);
    }
    visitArrayObjectExpr(expr) {
        if (expr.capacity instanceof expr_1.Expr)
            this.resolveExpression(expr.capacity);
        if (Array.isArray(expr.elements)) {
            for (const element of expr.elements)
                this.resolveExpression(element);
        }
        else {
            this.resolveExpression(expr.elements);
        }
    }
    visitBinaryExpr(expr) {
        this.resolveExpression(expr.leftExpr);
        this.resolveExpression(expr.rightExpr);
    }
    visitCallExpr(expr) {
        this.resolveExpression(expr.callee);
        for (const arg of expr.args)
            this.resolveExpression(arg);
    }
    visitGroupingExpr(expr) {
        this.resolveExpression(expr.expression);
    }
    visitLiteralExpr(expr) {
        return;
    }
    visitLogicalExpr(expr) {
        this.resolveExpression(expr.leftExpr);
        this.resolveExpression(expr.rightExpr);
    }
    visitUnaryExpr(expr) {
        this.resolveExpression(expr.rightExpr);
    }
    //======================================================================
    // Helpers
    //======================================================================
    beginScope() {
        // begin a new empty scope
        this.initializedVariablesScopes.push(new Map());
    }
    endScope() {
        // delete the innermost scope
        this.initializedVariablesScopes.pop();
    }
    resolveStatement(statement) {
        statement.accept(this);
    }
    resolveStatements(statements) {
        for (const statement of statements) {
            this.resolveStatement(statement);
        }
    }
    resolveExpression(expression) {
        expression.accept(this);
    }
    resolveFunction(func) {
        this.beginScope();
        for (const param of func.parameterTokens) {
            // declare is redundant here actually
            this.declare(param);
            this.define(param);
        }
        this.resolveStatement(func.statement);
        this.endScope();
    }
    // computes the distance in scopes between where a variable was referred to and
    // where it was defined
    resolveLocalVariable(expr, identifier) {
        const stack = this.initializedVariablesScopes;
        for (let i = stack.length - 1; i >= 0; i--) {
            if (stack[i].has(identifier)) {
                this.interpreter.resolve(expr, stack.length - 1 - i);
                this.typeValidator.resolve(expr, stack.length - 1 - i);
                return;
            }
        }
    }
    declare(identifier) {
        // global variables are ignored
        if (this.initializedVariablesScopes.length === 0)
            return;
        // this is just a verbose js way of peeking the scope stack
        const peekIndex = this.initializedVariablesScopes.length - 1;
        const innermostScope = this.initializedVariablesScopes[peekIndex];
        // indicate that the variable of the given initializer is uninitialized
        innermostScope.set(identifier.lexeme, false);
    }
    define(identifier) {
        // global variables are ignored
        if (this.initializedVariablesScopes.length === 0)
            return;
        // this is just a verbose js way of peeking the scope stack
        const peekIndex = this.initializedVariablesScopes.length - 1;
        const innermostScope = this.initializedVariablesScopes[peekIndex];
        // indicate that the variable of the given initializer is initialized
        innermostScope.set(identifier.lexeme, true);
    }
}
exports["default"] = Resolver;


/***/ }),

/***/ "./src/ts/run.ts":
/*!***********************!*\
  !*** ./src/ts/run.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const scanner_1 = __importDefault(__webpack_require__(/*! ./scanner */ "./src/ts/scanner.ts"));
const parser_1 = __importDefault(__webpack_require__(/*! ./parser */ "./src/ts/parser.ts"));
const typeValidator_1 = __importDefault(__webpack_require__(/*! ./typeValidator */ "./src/ts/typeValidator.ts"));
const interpreter_1 = __importDefault(__webpack_require__(/*! ./interpreter */ "./src/ts/interpreter.ts"));
const resolver_1 = __importDefault(__webpack_require__(/*! ./resolver */ "./src/ts/resolver.ts"));
const error_1 = __webpack_require__(/*! ./error */ "./src/ts/error.ts");
/**
 * runs (scans, parses, etc.) a given string, which can be either a text file or
 * a line entered from the interactive prompt
 * returns a tuple with the console output and whether there was an error or not
 */
function run(source) {
    // the resulting output string, can be from the execution of the program or
    // the language error messages (other errors are thrown immediately)
    let output = '';
    // scanning
    const scanner = new scanner_1.default(source);
    let tokens;
    try {
        tokens = scanner.scan();
    }
    catch (errors) {
        // if an array of errors is caught, then it must be from the scanner
        // otherwise, a js error was thrown and something is wrong with the code
        if (Array.isArray(errors)) {
            output += 'Scanning errors exist -\n';
            for (const error of errors)
                output += `\n${error.toString()}\n`;
        }
        else
            throw errors;
        return [output, true];
    }
    // parsing
    const parser = new parser_1.default(tokens);
    let program;
    try {
        program = parser.parse();
    }
    catch (errors) {
        if (Array.isArray(errors)) {
            output += 'Parsing errors exist -\n';
            for (const error of errors)
                output += `\n${error.toString()}\n`;
        }
        else
            throw errors;
        return [output, true];
    }
    // resolving
    const interpreter = new interpreter_1.default(program);
    const typeValidator = new typeValidator_1.default(program);
    const resolver = new resolver_1.default(interpreter, typeValidator);
    resolver.resolveProgram(program);
    // type checking
    try {
        typeValidator.validateProgram();
    }
    catch (errors) {
        if (Array.isArray(errors)) {
            output += 'Type checking errors exist -\n';
            for (const error of errors) {
                output += `\n${error.toString()}\n`;
            }
        }
        else
            throw errors;
        return [output, true];
    }
    // interpreting, only one error stops the program
    try {
        output += interpreter.interpret();
    }
    catch (error) {
        if (error instanceof error_1.LangError) {
            output += 'Runtime error -\n';
            output += '\n' + error.toString() + '\n';
        }
        else
            throw error;
        return [output, true];
    }
    return [output, false];
}
exports["default"] = run;


/***/ }),

/***/ "./src/ts/scanner.ts":
/*!***************************!*\
  !*** ./src/ts/scanner.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
const error_1 = __webpack_require__(/*! ./error */ "./src/ts/error.ts");
const token_1 = __webpack_require__(/*! ./token */ "./src/ts/token.ts");
const EOF_CHAR = '\0';
const KEYWORDS = new Map([
    ['and', 'AND'],
    ['break', 'BREAK'],
    ['do', 'DO'],
    ['else', 'ELSE'],
    ['false', 'FALSE'],
    ['for', 'FOR'],
    ['fn', 'FUNCTION'],
    ['if', 'IF'],
    ['of', 'OF'],
    ['or', 'OR'],
    ['print', 'PRINT'],
    ['return', 'RETURN'],
    ['then', 'THEN'],
    ['true', 'TRUE'],
    ['let', 'LET'],
    ['while', 'WHILE'],
    // primitive object types
    ['num', 'NUMBER_PRIMITIVE_TYPE'],
    ['str', 'STRING_PRIMITIVE_TYPE'],
    ['bool', 'BOOL_PRIMITIVE_TYPE'],
]);
class Scanner {
    constructor(source) {
        // replace all tabs and carriage returns with two spaces
        this.source = source.replaceAll('\t', '  ').replaceAll('\r', ' ');
        this.sourceLines = source.split('\n');
        this.tokens = [];
        this.start = 0;
        this.current = 0;
        this.line = 1;
        this.lineStart = 0;
        this.errors = [];
    }
    //======================================================================
    // Scanning Methods
    //======================================================================
    scan() {
        while (!this.isAtEnd()) {
            this.scanToken();
        }
        // if there were any errors, then throw all of them (as an array)
        if (this.errors.length > 0)
            throw this.errors;
        // otherwise, return all of the tokens with the EOF token appended
        const lastLineLastColumn = this.sourceLines[this.sourceLines.length - 1].length;
        const endOfFileToken = new token_1.Token('EOF', '', null, this.sourceLines[this.line - 1], this.line, lastLineLastColumn);
        this.tokens.push(endOfFileToken);
        return this.tokens;
    }
    scanToken() {
        // update the start of the current token's text
        this.start = this.current;
        const currentChar = this.consume();
        switch (currentChar) {
            // text for tokens that are one character long and a part of another token
            case '(':
                this.addToken('LEFT_PAREN');
                break;
            case ')':
                this.addToken('RIGHT_PAREN');
                break;
            case '{':
                this.addToken('LEFT_BRACE');
                break;
            case '}':
                this.addToken('RIGHT_BRACE');
                break;
            case '[':
                this.addToken('LEFT_BRACKET');
                break;
            case ']':
                this.addToken('RIGHT_BRACKET');
                break;
            case ',':
                this.addToken('COMMA');
                break;
            case '.':
                this.addToken('DOT');
                break;
            case '-':
                this.addToken('MINUS');
                break;
            case '+':
                this.addToken('PLUS');
                break;
            case ';':
                this.addToken('SEMICOLON');
                break;
            case '*':
                this.addToken('STAR');
                break;
            case ':':
                this.addToken('COLON');
                break;
            // text for tokens that may be one or two characters long
            case '!':
                this.addToken(this.consumeIfMatching('=') ? 'BANG_EQUAL' : 'BANG');
                break;
            case '=':
                if (this.peek() == '=') {
                    this.consume();
                    this.addToken('EQUAL_EQUAL');
                    break;
                }
                if (this.peek() == '>') {
                    this.consume();
                    this.addToken('RIGHTARROW');
                    break;
                }
                this.addToken('EQUAL');
                break;
            case '<':
                this.addToken(this.consumeIfMatching('=') ? 'LESS_EQUAL' : 'LESS');
                break;
            case '>':
                this.addToken(this.consumeIfMatching('=') ? 'GREATER_EQUAL' : 'GREATER');
                break;
            // / can be a division sign or a comment
            case '/':
                // / can be either //, /*, or just /
                if (this.consumeIfMatching('/')) {
                    this.scanOneLineComment();
                }
                else if (this.consumeIfMatching('*')) {
                    this.scanMultiLineComment();
                }
                else {
                    this.addToken('SLASH');
                }
                break;
            // ignore whitespace, tabs and carriage returns were removed earlier
            case ' ': break;
            case '\n': break;
            // strings start with ' or '
            case '"':
                this.scanString();
                break;
            case '\'':
                this.scanString();
                break;
            default:
                // if the character is a digit, then it is part of a number token,
                // if it is a letter or an underscore, it will be an identifier or a
                // keyword, and otherwise it is an invalid character
                if (this.isDigit(currentChar)) {
                    this.scanNumber();
                }
                else if (this.isAlphaOrUnderscore(currentChar)) {
                    this.scanIdentifierOrKeyword();
                }
                else {
                    const message = `Unexpected character ${currentChar}.`;
                    const column = (this.start - this.lineStart) + 1;
                    this.addError(message, this.line, column);
                }
                break;
        }
    }
    scanOneLineComment() {
        while (this.peek() != '\n' && !this.isAtEnd())
            this.consume();
    }
    scanMultiLineComment() {
        // starts at 1 because one /* was consumed to trigger this method
        let unpairedOpeningDelimiters = 1;
        // keep scanning characters until scanning a corresponding */ for each /*
        while (unpairedOpeningDelimiters > 0 && !this.isAtEnd()) {
            const currentChar = this.consume();
            // handle a potential opening delimiter
            if (currentChar === '/' && this.consumeIfMatching('*')) {
                unpairedOpeningDelimiters++;
            }
            // handle a potential closing delimiter
            if (currentChar === '*' && this.consumeIfMatching('/')) {
                unpairedOpeningDelimiters--;
            }
        }
    }
    scanString() {
        // firstQuote refers to the starting ' or '
        const firstQuote = this.source[this.start];
        const firstQuoteLine = this.line;
        const firstQuoteColumn = (this.start - this.lineStart) + 1;
        // scan characters until a terminating ' is found
        let stringLiteral = '';
        while (!this.isAtEnd() && this.peek() !== firstQuote) {
            stringLiteral += this.consume();
        }
        // if the end of the file is reached before the quote, it's an error
        if (this.isAtEnd()) {
            this.addError('Unterminated string.', firstQuoteLine, firstQuoteColumn);
            return;
        }
        // consume the final ' or '
        this.consume();
        // create and add the token
        this.addToken('STRING', stringLiteral);
    }
    scanNumber() {
        // scan all consecutive numbers
        while (this.isDigit(this.peek())) {
            this.consume();
        }
        // get the lookahead character if there is one
        let lookahead;
        if (this.isAtEnd(this.current + 1)) {
            // NOTE the actual value here doesn't matter as long as its a non-digit
            lookahead = EOF_CHAR;
        }
        else {
            lookahead = this.source[this.current + 1];
        }
        // scan the fractional part if necessary
        if (this.peek() === '.' && this.isDigit(lookahead)) {
            // Consume the .
            this.consume();
            // consume digits
            while (this.isDigit(this.peek())) {
                this.consume();
            }
        }
        const numberString = this.getCurrentLexeme();
        this.addToken('NUMBER', parseFloat(numberString));
    }
    scanIdentifierOrKeyword() {
        // get the actual string of characters
        while (this.isAlphaOrUnderscore(this.peek()) || this.isDigit(this.peek())) {
            this.consume();
        }
        const text = this.getCurrentLexeme();
        // check if the lexeme is a keyword, if it's not, it's an identifier 
        let tokenType = KEYWORDS.get(text);
        if (tokenType === undefined)
            tokenType = 'IDENTIFIER';
        // true and false have true, false and null as literal values
        if (tokenType === 'TRUE') {
            this.addToken(tokenType, true);
            return;
        }
        if (tokenType === 'FALSE') {
            this.addToken(tokenType, false);
            return;
        }
        this.addToken(tokenType);
    }
    //======================================================================
    // Helpers
    //======================================================================
    // checks if the given index is out of the bounds of the source string,
    // if no index given, it defaults to the position of the current character
    isAtEnd(index = this.current) {
        // >= (as opposed to ==) is neccessary for lookahead values
        return index >= this.source.length;
    }
    // returns the current character and advances the pointer
    consume() {
        const currChar = this.peek();
        this.current++;
        // if a new line is hit, update the line position values
        if (currChar === '\n') {
            this.line++;
            this.lineStart = this.current;
        }
        return currChar;
    }
    // peeks the current character without consuming it
    peek() {
        if (this.isAtEnd())
            return EOF_CHAR;
        return this.source[this.current];
    }
    // returns whether the current character matches the given one, and consumes
    // it if it does
    consumeIfMatching(target) {
        if (this.isAtEnd())
            return false;
        if (this.source[this.current] != target)
            return false;
        this.consume();
        return true;
    }
    addToken(type, value = null) {
        // get the corresponding text for the token
        const text = this.getCurrentLexeme();
        const column = (this.start - this.lineStart) + 1;
        // push the token
        this.tokens.push(new token_1.Token(type, text, value, this.sourceLines[this.line - 1], this.line, column));
    }
    isDigit(c) {
        return c >= '0' && c <= '9';
    }
    isAlphaOrUnderscore(c) {
        return (c >= 'a' && c <= 'z') ||
            (c >= 'A' && c <= 'Z') ||
            c === '_';
    }
    addError(message, line, column) {
        const lineString = this.sourceLines[line - 1];
        this.errors.push(new error_1.CharacterError(message, lineString, line, column));
    }
    getCurrentLexeme() {
        return this.source.substring(this.start, this.current);
    }
}
exports["default"] = Scanner;


/***/ }),

/***/ "./src/ts/stmt.ts":
/*!************************!*\
  !*** ./src/ts/stmt.ts ***!
  \************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WhileStmt = exports.DeclarationStmt = exports.ReturnStmt = exports.PrintStmt = exports.IfStmt = exports.ExpressionStmt = exports.BlockStmt = exports.BreakStmt = exports.BlankStmt = exports.Stmt = void 0;
const syntaxTreeNode_1 = __importDefault(__webpack_require__(/*! ./syntaxTreeNode */ "./src/ts/syntaxTreeNode.ts"));
class Stmt extends syntaxTreeNode_1.default {
}
exports.Stmt = Stmt;
class BlankStmt extends Stmt {
    constructor(semicolon) {
        super(semicolon, semicolon);
    }
    accept(visitor) {
        return visitor.visitBlankStmt(this);
    }
}
exports.BlankStmt = BlankStmt;
class BreakStmt extends Stmt {
    constructor(breakToken, semicolon) {
        super(breakToken, semicolon);
    }
    accept(visitor) {
        return visitor.visitBreakStmt(this);
    }
}
exports.BreakStmt = BreakStmt;
class BlockStmt extends Stmt {
    constructor(leftBrace, statements, rightBrace) {
        super(leftBrace, rightBrace);
        this.statements = statements;
    }
    accept(visitor) {
        return visitor.visitBlockStmt(this);
    }
}
exports.BlockStmt = BlockStmt;
class ExpressionStmt extends Stmt {
    constructor(expression, semicolon) {
        super(expression.lToken, semicolon);
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitExpressionStmt(this);
    }
}
exports.ExpressionStmt = ExpressionStmt;
class IfStmt extends Stmt {
    constructor(ifToken, condition, thenBranch, elseBranch = null) {
        if (elseBranch !== null)
            super(ifToken, elseBranch.rToken);
        else
            super(ifToken, thenBranch.rToken);
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }
    accept(visitor) {
        return visitor.visitIfStmt(this);
    }
}
exports.IfStmt = IfStmt;
class PrintStmt extends Stmt {
    constructor(keyword, expression, semicolon) {
        super(keyword, semicolon);
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitPrintStmt(this);
    }
}
exports.PrintStmt = PrintStmt;
class ReturnStmt extends Stmt {
    constructor(keyword, value, semicolon) {
        super(keyword, semicolon);
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitReturnStmt(this);
    }
}
exports.ReturnStmt = ReturnStmt;
class DeclarationStmt extends Stmt {
    constructor(keyword, identifier, type, initialValue, semicolon) {
        super(keyword, semicolon);
        this.identifier = identifier;
        this.type = type;
        this.initialValue = initialValue;
    }
    accept(visitor) {
        return visitor.visitDeclarationStmt(this);
    }
}
exports.DeclarationStmt = DeclarationStmt;
class WhileStmt extends Stmt {
    constructor(whileToken, condition, body) {
        super(whileToken, body.rToken);
        this.condition = condition;
        this.body = body;
    }
    accept(visitor) {
        return visitor.visitWhileStmt(this);
    }
}
exports.WhileStmt = WhileStmt;


/***/ }),

/***/ "./src/ts/syntaxTreeNode.ts":
/*!**********************************!*\
  !*** ./src/ts/syntaxTreeNode.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
class SyntaxTreeNode {
    constructor(lToken, rToken) {
        this.lToken = lToken;
        this.rToken = rToken;
    }
}
exports["default"] = SyntaxTreeNode;


/***/ }),

/***/ "./src/ts/token.ts":
/*!*************************!*\
  !*** ./src/ts/token.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Token = void 0;
class Token {
    constructor(type, lexeme, value, lineString, lineIndex, column) {
        this.type = type;
        this.lexeme = lexeme;
        this.value = value;
        this.lineString = lineString;
        this.lineIndex = lineIndex;
        this.column = column;
    }
    toString() {
        const tokenTypeString = this.type;
        return tokenTypeString + ' ' + this.lexeme + ' ' + this.value;
    }
}
exports.Token = Token;


/***/ }),

/***/ "./src/ts/typeExpr.ts":
/*!****************************!*\
  !*** ./src/ts/typeExpr.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LiteralTypeExpr = exports.FunctionTypeExpr = exports.ArrayTypeExpr = exports.TypeExpr = void 0;
const syntaxTreeNode_1 = __importDefault(__webpack_require__(/*! ./syntaxTreeNode */ "./src/ts/syntaxTreeNode.ts"));
class TypeExpr extends syntaxTreeNode_1.default {
}
exports.TypeExpr = TypeExpr;
class ArrayTypeExpr extends TypeExpr {
    constructor(lBracket, innerType, rBracket) {
        super(lBracket, rBracket);
        this.innerType = innerType;
    }
    accept(visitor) {
        return visitor.visitArrayTypeExpr(this);
    }
}
exports.ArrayTypeExpr = ArrayTypeExpr;
class FunctionTypeExpr extends TypeExpr {
    constructor(lParen, parameterTypes, returnType) {
        super(lParen, returnType.rToken);
        this.parameterTypes = parameterTypes;
        this.returnType = returnType;
    }
    accept(visitor) {
        return visitor.visitFunctionTypeExpr(this);
    }
}
exports.FunctionTypeExpr = FunctionTypeExpr;
class LiteralTypeExpr extends TypeExpr {
    constructor(token) {
        super(token, token);
        this.token = token;
    }
    accept(visitor) {
        return visitor.visitLiteralTypeExpr(this);
    }
}
exports.LiteralTypeExpr = LiteralTypeExpr;


/***/ }),

/***/ "./src/ts/typeValidator.ts":
/*!*********************************!*\
  !*** ./src/ts/typeValidator.ts ***!
  \*********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const expr_1 = __webpack_require__(/*! ./expr */ "./src/ts/expr.ts");
const error_1 = __webpack_require__(/*! ./error */ "./src/ts/error.ts");
const langType_1 = __webpack_require__(/*! ./langType */ "./src/ts/langType.ts");
const environment_1 = __importDefault(__webpack_require__(/*! ./environment */ "./src/ts/environment.ts"));
class TypeValidator {
    constructor(program) {
        this.program = program;
        this.globalEnvironment = new environment_1.default(null);
        this.currentEnvironment = this.globalEnvironment;
        this.functionEnvironment = null;
        this.expectedTypeStack = [];
        this.withinIf = false;
        this.withinWhile = false;
        this.currentReturnType = null;
        this.localVariableDistances = new Map();
    }
    //======================================================================
    // Type Checking
    //======================================================================
    // validates types in a given program, ie a list of statements
    validateProgram() {
        const errors = [];
        for (const statement of this.program) {
            try {
                this.validateStatement(statement);
            }
            catch (error) {
                if (error instanceof error_1.LangError) {
                    errors.push(error);
                }
                else {
                    throw error;
                }
            }
        }
        if (errors.length > 0)
            throw errors;
    }
    // checks whether the types of the variables are valid in a given statement
    // an inner environment can be passed in
    validateStatement(stmt) {
        stmt.accept(this);
    }
    // checks whether the types of the variables are valid in a given expression
    // and if so, returns the type of the expression
    validateExpression(expr) {
        return expr.accept(this);
    }
    //======================================================================
    // Statement Visitor
    //======================================================================
    visitPrintStmt(stmt) {
        this.validateExpression(stmt.expression);
    }
    visitExpressionStmt(stmt) {
        this.validateExpression(stmt.expression);
    }
    visitBlankStmt(stmt) {
        return;
    }
    visitDeclarationStmt(stmt) {
        let initialValue = stmt.initialValue;
        // strip any unnecessary parentheses
        while (initialValue instanceof expr_1.GroupingExpr) {
            // NOTE have to work around typescript assertion system
            const value = initialValue;
            initialValue = value.expression;
        }
        // if the initial value is a function, then define it in the environment
        if (initialValue instanceof expr_1.FunctionObjectExpr) {
            const returnType = this.validateExpression(initialValue.returnType);
            const parameterTypes = [];
            for (const param of initialValue.parameterTypes) {
                parameterTypes.push(this.validateExpression(param));
            }
            this.currentEnvironment.define(stmt.identifier.lexeme, new langType_1.FunctionLangType(parameterTypes, returnType));
        }
        // the left type is the hinted type, the right type is the declared one
        let leftType;
        if (stmt.type === null)
            leftType = null;
        else
            leftType = this.validateExpression(stmt.type);
        const rightType = this.validateExpression(initialValue);
        // if a type hint exists, check the two types
        if (leftType !== null && !(0, langType_1.LangTypeEqual)(leftType, rightType))
            throw new error_1.SyntaxTreeNodeError('Types do not match in declaration.', stmt);
        // NOTE functions are just redefined
        this.currentEnvironment.define(stmt.identifier.lexeme, rightType);
    }
    visitBlockStmt(stmt) {
        // save the outer environment to restore later
        const outerEnvironment = this.currentEnvironment;
        // a block statement has its own environment, which is initially empty
        this.currentEnvironment = new environment_1.default(outerEnvironment);
        try {
            for (const statement of stmt.statements) {
                // NOTE passing a new environment here would make each individual
                // statement have its own environment, which is incorrect
                this.validateStatement(statement);
            }
        }
        finally {
            // restore the outer environment regardless of any errors
            this.currentEnvironment = outerEnvironment;
        }
    }
    visitIfStmt(stmt) {
        // remember whether the outer scope was within an if statement
        const outerWithinIf = this.withinIf;
        this.withinIf = true;
        // if branch
        const condition = this.validateExpression(stmt.condition);
        if (condition !== 'Bool')
            throw new error_1.TokenError('If statement condition must be a bool.', stmt.lToken);
        // then branch
        this.validateStatement(stmt.thenBranch);
        if (stmt.elseBranch !== null)
            this.validateStatement(stmt.elseBranch);
        // revert the current within if state to what was remembered
        // NOTE can't put this after the if branch proper, because both branches
        // might not have return statements
        this.withinIf = outerWithinIf;
    }
    visitWhileStmt(stmt) {
        // remember whether the outer scope was within a while statement
        const outerWithinWhile = this.withinWhile;
        this.withinWhile = true;
        if (this.validateExpression(stmt.condition) !== 'Bool')
            throw new error_1.SyntaxTreeNodeError('Condition must be a bool.', stmt.condition);
        this.validateStatement(stmt.body);
        // revert the current within while state to what was remembered
        this.withinWhile = outerWithinWhile;
    }
    visitBreakStmt(stmt) {
        if (!this.withinIf || !this.withinWhile)
            throw new error_1.TokenError('Cannot break outside of an if or while statement.', stmt.lToken);
        return;
    }
    visitReturnStmt(stmt) {
        if (this.expectedTypeStack.length === 0)
            throw new error_1.SyntaxTreeNodeError('Cannot return outside of function.', stmt);
        const returnType = this.validateExpression(stmt.value);
        // if not within if or while, set the returnType if it has not been set
        if (this.withinIf || this.withinWhile)
            return;
        if (this.currentReturnType === null) {
            this.currentReturnType = returnType;
        }
        else {
            throw new error_1.SyntaxTreeNodeError('Unexpected return statement.', stmt);
        }
    }
    //======================================================================
    // Expression Visitor
    //======================================================================
    visitBinaryExpr(expr) {
        const opType = expr.operator.type;
        // boolean operations / relations: ==, !=
        // can be used for all types
        if (this.tokenTypeMatch(opType, 'EQUAL_EQUAL', 'BANG_EQUAL')) {
            const leftType = this.validateExpression(expr.leftExpr);
            const rightType = this.validateExpression(expr.rightExpr);
            if (leftType instanceof langType_1.ComplexLangType) {
                const message = 'Left expression type must be num, str, or bool';
                throw new error_1.SyntaxTreeNodeError(message, expr.leftExpr);
            }
            if (rightType instanceof langType_1.ComplexLangType) {
                const message = 'Right expression type must be num, str, or bool';
                throw new error_1.SyntaxTreeNodeError(message, expr.rightExpr);
            }
            if (leftType !== rightType)
                throw new error_1.TokenError('Types do not match.', expr.operator);
            return 'Bool';
        }
        // number relations: <, <=, >, >=
        if (this.tokenTypeMatch(opType, 'LESS', 'LESS_EQUAL', 'GREATER', 'GREATER_EQUAL')) {
            const leftType = this.validateExpression(expr.leftExpr);
            if (leftType !== 'Num') {
                throw new error_1.SyntaxTreeNodeError('Left operand is not a number.', expr.leftExpr);
            }
            const rightType = this.validateExpression(expr.rightExpr);
            if (rightType !== 'Num') {
                throw new error_1.SyntaxTreeNodeError('Right operand is not a number.', expr.rightExpr);
            }
            return 'Bool';
        }
        // number operations: -, *, /
        if (this.tokenTypeMatch(opType, 'MINUS', 'STAR', 'SLASH')) {
            const leftType = this.validateExpression(expr.leftExpr);
            if (leftType !== 'Num') {
                throw new error_1.SyntaxTreeNodeError('Left operand is not a number.', expr.leftExpr);
            }
            const rightType = this.validateExpression(expr.rightExpr);
            if (rightType !== 'Num') {
                throw new error_1.SyntaxTreeNodeError('Right operand is not a number.', expr.rightExpr);
            }
            return 'Num';
        }
        // + is defined for both strings and numbers
        if (this.tokenTypeMatch(opType, 'PLUS')) {
            const leftType = this.validateExpression(expr.leftExpr);
            if (leftType !== 'Num' && leftType !== 'Str') {
                throw new error_1.SyntaxTreeNodeError('Left operand is not a number or string.', expr.leftExpr);
            }
            const rightType = this.validateExpression(expr.rightExpr);
            if (rightType !== 'Num' && rightType !== 'Str') {
                throw new error_1.SyntaxTreeNodeError('Right operand is not a number or string.', expr.rightExpr);
            }
            // NOTE we could just as easily return leftType
            return rightType;
        }
        throw new error_1.ImplementationError('Unknown operator in binary expression.');
    }
    visitUnaryExpr(expr) {
        const opType = expr.operator.type;
        if (this.tokenTypeMatch(opType, 'MINUS')) {
            const rightType = this.validateExpression(expr.rightExpr);
            if (rightType != 'Num') {
                throw new error_1.SyntaxTreeNodeError('Operand is not a number.', expr.rightExpr);
            }
            return 'Num';
        }
        if (this.tokenTypeMatch(opType, 'BANG')) {
            const rightType = this.validateExpression(expr.rightExpr);
            if (rightType != 'Bool') {
                throw new error_1.SyntaxTreeNodeError('Operand is not a number.', expr.rightExpr);
            }
            return 'Bool';
        }
        throw new error_1.ImplementationError('Unknown operator in unary expression.');
    }
    visitGroupingExpr(expr) {
        return this.validateExpression(expr.expression);
    }
    visitLiteralExpr(expr) {
        if (typeof (expr.value) === 'number')
            return 'Num';
        if (typeof (expr.value) === 'string')
            return 'Str';
        return 'Bool';
    }
    visitVariableExpr(expr) {
        const maybeType = this.currentEnvironment.get(expr.lToken.lexeme);
        // NOTE must still check for undefined in case a validation error existed
        if (maybeType === undefined) {
            throw new error_1.TokenError('Undefined variable.', expr.lToken);
        }
        return maybeType;
    }
    visitAssignExpr(expr) {
        const variableToken = expr.lToken;
        const variableName = variableToken.lexeme;
        const variableType = this.currentEnvironment.get(variableName);
        // NOTE must still check for undefined in case a validation error existed
        if (variableType === undefined) {
            throw new error_1.TokenError('Undefined variable.', variableToken);
        }
        const rightType = this.validateExpression(expr.value);
        const leftType = variableType;
        if (!(0, langType_1.LangTypeEqual)(leftType, rightType)) {
            throw new error_1.SyntaxTreeNodeError('Types do not match in assignment.', expr);
        }
        return leftType;
    }
    visitLogicalExpr(expr) {
        const leftType = this.validateExpression(expr.leftExpr);
        if (leftType != 'Bool')
            throw new error_1.SyntaxTreeNodeError('Left operand must be a bool.', expr.leftExpr);
        const rightType = this.validateExpression(expr.rightExpr);
        if (rightType != 'Bool')
            throw new error_1.SyntaxTreeNodeError('Right operand must be a bool.', expr.rightExpr);
        return 'Bool';
    }
    visitFunctionObjectExpr(expr) {
        // save outer properties
        const outerEnvironment = this.currentEnvironment;
        const outerWithinIf = this.withinIf;
        const outerWithinWhile = this.withinWhile;
        const outerReturnType = this.currentReturnType;
        // reset properties
        this.withinIf = false;
        this.withinWhile = false;
        this.currentReturnType = null;
        // set the expected type before evaluating the statements
        const returnType = this.validateExpression(expr.returnType);
        const parameterTypes = [];
        this.expectedTypeStack.push(returnType);
        // create the inner environment
        const innerEnvironment = new environment_1.default(outerEnvironment);
        // get each parameter name and type and add it to the environment
        for (const index in expr.parameterTokens) {
            const id = expr.parameterTokens[index].lexeme;
            const type = this.validateExpression(expr.parameterTypes[index]);
            parameterTypes.push(type);
            innerEnvironment.define(id, type);
        }
        // switch environments and evaluate the function statement
        // NOTE for a block statement, a redundant environment is created instead of
        // one environment for the block, but it is only slightly inefficient
        this.currentEnvironment = innerEnvironment;
        try {
            this.validateStatement(expr.statement);
        }
        finally {
            // restore the outer environment regardless of any errors
            this.currentEnvironment = outerEnvironment;
        }
        // check if the two types are the same
        const expectedType = this.expectedTypeStack.pop();
        if (!(0, langType_1.LangTypeEqual)(expectedType, this.currentReturnType)) {
            // restore the outer properties
            this.withinIf = outerWithinIf;
            this.withinWhile = outerWithinWhile;
            this.currentReturnType = outerReturnType;
            throw new error_1.SyntaxTreeNodeError('Invalid return type', expr.statement);
        }
        else {
            // restore the outer properties
            this.withinIf = outerWithinIf;
            this.withinWhile = outerWithinWhile;
            this.currentReturnType = outerReturnType;
            return new langType_1.FunctionLangType(parameterTypes, returnType);
        }
    }
    visitCallExpr(expr) {
        const maybeCallable = this.validateExpression(expr.callee);
        // check whether the primary is callable
        if (!(maybeCallable instanceof langType_1.FunctionLangType))
            throw new error_1.SyntaxTreeNodeError('Expect callable object.', expr.callee);
        // get the arguments as types
        const argExprs = expr.args;
        let args = [];
        for (const argExpr of argExprs) {
            args.push(this.validateExpression(argExpr));
        }
        // check whether the arity matches the number of arguments
        const params = maybeCallable.parameters;
        if (params.length != args.length) {
            const errorMsg = 'Number of arguments does not equal number of parameters';
            throw new error_1.SyntaxTreeNodeError(errorMsg, expr);
        }
        // check if the parameter types equal the argument types
        for (const i in params) {
            if (!(0, langType_1.LangTypeEqual)(params[i], args[i])) {
                const msg = 'Invalid argument type(s)';
                throw new error_1.SyntaxTreeNodeError(msg, expr);
            }
        }
        return maybeCallable.returnType;
    }
    visitArrayObjectExpr(expr) {
        // if the given capacity is an expression, the expression should be a number
        if (expr.capacity instanceof expr_1.Expr) {
            const capacityType = this.validateExpression(expr.capacity);
            if (capacityType !== 'Num')
                throw new error_1.SyntaxTreeNodeError('Given capacity must be a number.', expr.capacity);
        }
        let type;
        // if the array is filled with expressions, ie [5, 6], deduce the type and
        // make sure all elements of the array have the same type
        if (Array.isArray(expr.elements)) {
            type = this.validateExpression(expr.elements[0]);
            for (const element of expr.elements) {
                const currentElementType = this.validateExpression(element);
                if (!(0, langType_1.LangTypeEqual)(type, currentElementType))
                    throw new error_1.SyntaxTreeNodeError('Types must all be the same in an array', expr);
            }
        }
        else {
            // otherwise elements refers to only element, so validate and return it
            type = this.validateExpression(expr.elements);
        }
        return new langType_1.ArrayLangType(type);
    }
    visitArrayAccessExpr(expr) {
        const indexType = this.validateExpression(expr.index);
        if (indexType !== 'Num')
            throw new error_1.SyntaxTreeNodeError('Expect index number.', expr);
        const arrayType = this.validateExpression(expr.arrayExpr);
        if (!(arrayType instanceof langType_1.ArrayLangType))
            throw new error_1.SyntaxTreeNodeError('Only arrays can be accessed via [].', expr);
        return arrayType.innerType;
    }
    visitArrayAssignExpr(expr) {
        const arrayType = this.validateExpression(expr.arrayAccessExpr);
        const valueType = this.validateExpression(expr.assignmentValue);
        if (!(0, langType_1.LangTypeEqual)(arrayType, valueType)) {
            throw new error_1.SyntaxTreeNodeError('Types do not match in assignment', expr);
        }
        return valueType;
    }
    visitArrayTypeExpr(typeExpr) {
        const innerType = this.validateExpression(typeExpr.innerType);
        return new langType_1.ArrayLangType(innerType);
    }
    visitFunctionTypeExpr(typeExpr) {
        const parameterTypes = [];
        for (const param of typeExpr.parameterTypes) {
            parameterTypes.push(this.validateExpression(param));
        }
        const returnType = this.validateExpression(typeExpr.returnType);
        return new langType_1.FunctionLangType(parameterTypes, returnType);
    }
    visitLiteralTypeExpr(typeExpr) {
        switch (typeExpr.token.type) {
            case 'NUMBER_PRIMITIVE_TYPE':
                return 'Num';
            case 'BOOL_PRIMITIVE_TYPE':
                return 'Bool';
            case 'STRING_PRIMITIVE_TYPE':
                return 'Str';
            default:
                throw new error_1.ImplementationError('Unknown LiteralTypeExpr token.');
        }
    }
    //======================================================================
    // Helpers
    //======================================================================
    // returns whether a given type matches a spread of given types
    tokenTypeMatch(type, ...targets) {
        for (const target of targets) {
            if (target == type) {
                return true;
            }
        }
        return false;
    }
    //======================================================================
    // Public
    //======================================================================
    resolve(expr, depth) {
        this.localVariableDistances.set(expr, depth);
    }
}
exports["default"] = TypeValidator;


/***/ }),

/***/ "./src/ts/web.ts":
/*!***********************!*\
  !*** ./src/ts/web.ts ***!
  \***********************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


// this script will be bundled using webpack for use in the web client
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const run_1 = __importDefault(__webpack_require__(/*! ./run */ "./src/ts/run.ts"));
let test = (0, run_1.default)('me no work');
console.log(test);
const inputBox = document.getElementById('left-column');
const exampleSelection = document.getElementById('example-selection');
const runButton = document.getElementById('run-button');
const outputBox = document.getElementById('output');
function runButtonPressed() {
    outputBox.innerHTML += 'ran';
    console.log('hi');
}
runButton.addEventListener('click', runButtonPressed);
// const output = {
//     clear(): void {
//         outputBox.innerText = '';
//     },
//     print(message: string): void {
//         const messageBox = document.createElement('div');
//         messageBox.innerText = message;
//         outputBox.appendChild(messageBox);
//     },
//     printError(message: string): void {
//         const messageBox = document.createElement('div');
//         messageBox.innerText = message;
//         messageBox.classList.add('error');
//         outputBox.appendChild(messageBox);
//     },
//     setStatus(status: CheckStatus | RunStatus): void {
//         const statusClasses: {[RS in CheckStatus | RunStatus]: string} = {
//             'SYNTAX_ERROR': 'syntax-error',
//             'STATIC_ERROR': 'static-error',
//             'RUNTIME_ERROR': 'runtime-error',
//             'VALID': 'success',
//             'SUCCESS': 'success',
//         };
//         outputTitle.classList.remove(...Object.values(statusClasses));
//         outputTitle.classList.add(statusClasses[status]);
//         outputTitle.innerText = status.replace(/_/g, ' ') + '!';
//     },
// };
// function check(): void {
//     output.clear();
//     const source = codeMirror.getValue();
//     const lox = new Lox(output);
//     const status = lox.check(source);
//     output.setStatus(status);
// }
// function run(): void {
//     output.clear();
//     const source = codeMirror.getValue();
//     const lox = new Lox(output);
//     const status = lox.run(source);
//     output.setStatus(status);
// }
// async function selectExample(): Promise<void> {
//     const exampleFile = exampleSelection.value;
//     try {
//         const response = await fetch(`examples/${exampleFile}`);
//         if (!response.ok) throw Error();
//         codeMirror.setValue(await response.text());
//     } catch (error) {
//         codeMirror.setValue('// Unable to load example!');
//     }
// }
// exampleSelection.addEventListener('input', selectExample);
// selectExample();


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/ts/web.ts");
/******/ 	
/******/ })()
;