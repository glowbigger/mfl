export type Nullable<T> = T | null
type Primitive = number | string | boolean
export type ObjectType = Nullable<Primitive>

// this is typescript's way of type checking for interfaces/types
// used template from https://stackoverflow.com/a/37543778
// export function isCallable(obj: ObjectType): obj is Callable {
//   return (obj as Callable).arity !== undefined;
// }
