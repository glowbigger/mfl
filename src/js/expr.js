"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unary = exports.Literal = exports.Grouping = exports.Binary = exports.Expr = void 0;
class Expr {
}
exports.Expr = Expr;
// export class Assign extends Expr {
//   readonly name: Token;
//   readonly value: Expr;
//   constructor(name: Token, value: Expr) {
//     super();
//     this.name = name;
//     this.value = value;
//   }
//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitAssignExpr(this);
//   }
// }
class Binary extends Expr {
    constructor(left, operator, right) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitBinaryExpr(this);
    }
}
exports.Binary = Binary;
// export class Call extends Expr {
//   readonly callee: Expr;
//   // the right parenthesis is stored for its location, which will be
//   // returned if there was a runtime error
//   readonly paren: Token;
//   // can't use the name "arguments" because that is reserved by js
//   readonly args: Array<Expr>;
//   constructor(callee: Expr, paren: Token, args: Array<Expr>) {
//     super();
//     this.callee = callee;
//     this.paren = paren;
//     this.args = args;
//   }
//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitCallExpr(this);
//   }
// }
class Grouping extends Expr {
    constructor(expression) {
        super();
        this.expression = expression;
    }
    accept(visitor) {
        return visitor.visitGroupingExpr(this);
    }
}
exports.Grouping = Grouping;
// export class Logical extends Expr {
//   readonly left: Expr;
//   readonly operator: Token;
//   readonly right: Expr;
//   constructor(left: Expr, operator: Token, right: Expr) {
//     super();
//     this.left = left;
//     this.operator = operator;
//     this.right = right;
//   }
//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitLogicalExpr(this);
//   }
// }
class Literal extends Expr {
    constructor(value) {
        super();
        this.value = value;
    }
    accept(visitor) {
        return visitor.visitLiteralExpr(this);
    }
}
exports.Literal = Literal;
class Unary extends Expr {
    constructor(operator, right) {
        super();
        this.operator = operator;
        this.right = right;
    }
    accept(visitor) {
        return visitor.visitUnaryExpr(this);
    }
}
exports.Unary = Unary;
// export class Variable extends Expr {
//   readonly name: Token;
//   constructor(name: Token) {
//     super();
//     this.name = name;
//   }
//   accept<R>(visitor: ExprVisitor<R>): R {
//     return visitor.visitVariableExpr(this);
//   }
// }
