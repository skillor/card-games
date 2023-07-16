import { Controls } from "flume";
import { FlumeNode, NodeMap } from "flume/dist/types";
import { GameLogicHead } from "src/app/shared/games/game-logic";

export class NodeResolver {
  public static simpleTypes: {[key: string]: {label: string, control: any}} = {
    'string': { label: 'String', control: Controls.text },
    'number': { label: 'Number', control: Controls.number },
    'boolean': { label: 'True/False', control: Controls.checkbox },
  };

  constructor(
    private logic: GameLogicHead,
    private prettyPrintIndent = 2,
  ) {}

  getNodeComment(node: FlumeNode): string {
    return ` /* {"x": ${node.x.toFixed(0)}, "y":${node.y.toFixed(0)}} */`;
  }

  resolveRootNode(nodes: NodeMap): string {
    for (let node of Object.values(nodes)) {
      if (node.root) {
        const inputs = Object.values(node.connections.inputs);
        if (inputs.length == 0) return '';
        for (let input of inputs) {
          if (input.length !== 1) return '';
          return this.resolveNode(nodes, input[0].nodeId, 0);
        }
      };
    }
    throw new Error('root node not found');
  }

  resolveNode(nodes: NodeMap, startId: string, depth: number, endFunction: { id: string, prefix: string } | undefined = undefined): string {
    if (!this.logic) throw new Error('unknown logic');
    const node = nodes[startId];
    const simple = NodeResolver.simpleTypes[node.type];
    if (simple) {
      return `of(${JSON.stringify(node.inputData[node.type][node.type])})${this.getNodeComment(node)}`;
    }
    const f = this.logic.functions[node.type];
    if (!f) throw new Error(`function ${node.type} not found`);

    if (endFunction && startId == endFunction.id) {
      for (let output of Object.keys(node.connections.outputs)) {
        if (output.startsWith(endFunction.prefix)) return output.substring(endFunction.prefix.length).split(':')[0];
      }
      throw new Error('failed loop');
    }

    const inputs: string[] = [];
    for (let fin of f.inputs) {
      if (fin.dotdot) {
        let inputNames = Object.keys(node.connections.inputs);
        for (let iName of inputNames) {
          if (iName.startsWith(fin.name)) {
            let x = +iName.substring(fin.name.length);
            if (isNaN(x)) continue;
            const con = node.connections.inputs[iName];
            if (con.length != 1) throw new Error(`input ${iName} of ${f.name} can only have one connection, has ${con.length}`);
            if (fin.type.options[0].function) {
              endFunction = { id: startId, prefix: fin.name + '_' };
              let i = fin.type.options[0].function.inputs.map((i) => `\n${' '.repeat(this.prettyPrintIndent * 2)}${i.name}`).join('');
              let t = this.resolveNode(nodes, con[0].nodeId, depth + 1, endFunction);
              if (t) inputs.push(`of((${i}\n${' '.repeat(this.prettyPrintIndent)}) => ${t})`);
              continue;
            }
            let t = this.resolveNode(nodes, con[0].nodeId, depth + 1, endFunction);
            if (t) inputs.push(t);
          }
        }
        continue;
      }
      let con = node.connections.inputs[fin.name];
      if (!con && !fin.optional) {
        for (let iName of Object.keys(node.connections.inputs)) {
          if (iName.startsWith(fin.name + ':')) {
            con = node.connections.inputs[iName];
            break
          }
        }
        if (!con) throw new Error(`input ${fin.name} of ${f.name} is not connected`);
      }
      if (!con) {
        inputs.push('undefined');
        continue;
      }
      if (con.length != 1) throw new Error(`input ${fin.name} of ${f.name} can only have one connection, has ${con.length}`);
      if (fin.type.options[0].function) {
        endFunction = { id: startId, prefix: fin.name + '_' };

        let i = fin.type.options[0].function.inputs.map((i) => `\n${' '.repeat(this.prettyPrintIndent * 2)}${i.name}`).join('');
        let t = this.resolveNode(nodes, con[0].nodeId, depth + 1, endFunction);
        if (t) inputs.push(`of((${i}\n${' '.repeat(this.prettyPrintIndent)}) => ${t})`);
        continue;
      }
      let t = this.resolveNode(nodes, con[0].nodeId, depth + 1, endFunction);
      if (t) inputs.push(t);
    }
    if (inputs.length == 0) return `${node.type}()${this.getNodeComment(node)}`;
    const inputS = `${this.getNodeComment(node)}\n${inputs.map((i) => i.split('\n').map((l) => ' '.repeat(this.prettyPrintIndent) + l).join('\n')).join(',\n')}\n`;
    return `${node.type}(${inputS})`;
  }
}
