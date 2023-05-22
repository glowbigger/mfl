"use strict";
// a dedicated error class for language errors
// is preferred over js's native Error class because:
// 1) language errors (whether in parsing or scanning) are not js errors
// 2) js's Error contains superfluous features
// 3) are never thrown using js's throw, are just printed instead
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LangError_message, _LangError_where, _LangError_line;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LangError = void 0;
class LangError {
    constructor(message, where, line) {
        _LangError_message.set(this, void 0);
        _LangError_where.set(this, void 0);
        _LangError_line.set(this, void 0);
        __classPrivateFieldSet(this, _LangError_message, message, "f");
        __classPrivateFieldSet(this, _LangError_where, where, "f");
        __classPrivateFieldSet(this, _LangError_line, line, "f");
    }
    toString() {
        return `[line ${__classPrivateFieldGet(this, _LangError_line, "f")}] Error${__classPrivateFieldGet(this, _LangError_where, "f")}: ${__classPrivateFieldGet(this, _LangError_message, "f")}`;
    }
}
exports.LangError = LangError;
_LangError_message = new WeakMap(), _LangError_where = new WeakMap(), _LangError_line = new WeakMap();
