"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Printer {
    print(expr) {
        return expr.accept(this);
    }
    visitBinaryExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }
    visitGroupingExpr(expr) {
        return this.parenthesize('group', expr.expression);
    }
    visitLiteralExpr(expr) {
        if (expr.value == null)
            return 'null';
        return expr.value.toString();
    }
    visitUnaryExpr(expr) {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }
    parenthesize(name, ...exprs) {
        let string = `(${name}`;
        for (const expr of exprs) {
            string += ' ';
            string += expr.accept(this);
        }
        string += ')';
        return string;
    }
}
exports.default = Printer;
