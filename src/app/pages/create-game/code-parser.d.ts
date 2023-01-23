export function parse(input: string, options?: any): Node;
export type Node = {type: string, args?: Node[], name?: Node, body?: Node, value: any};
