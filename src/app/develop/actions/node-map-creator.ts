import { InputData, NodeMap } from "flume/dist/types";
import { parse, Node } from '../code-parser';
import { FunctionHead, GameLogicHead } from "src/app/shared/games/game-logic";


export class NodeMapCreator {
  constructor(
    private logic: GameLogicHead,
    private config: any,
  ) { }

  createNodeMap(content: string) {
    const rootNodeId = Math.random().toString(36).substring(2);
    const nodes = {
      [rootNodeId]: {
        "x": 0,
        "y": 0,
        "type": "GameLogic",
        "width": 200,
        "connections": {
          "inputs": {},
          "outputs": {},
        },
        "inputData": {
          "FunctionResult": {}
        },
        "root": true,
        "id": rootNodeId
      }
    };
    this._createNodeMap(nodes, parse(content), undefined, -250, 0, { id: rootNodeId, portName: 'FunctionResult' }, {}, undefined);
    return nodes;
  }

  private getWantedPos(comments: string[]): { x: number, y: number } | undefined {
    for (let c of comments) {
      try {
        const t = JSON.parse(c);
        if (t['x'] && t['y']) return t;
      } catch {}
    }
    return undefined;
  }

  private _createNodeMap(nodeMap: NodeMap,
    node: Node,
    functionHead: FunctionHead | undefined,
    x: number,
    y: number,
    connectTo: { id: string, portName: string } | undefined,
    connectNames: { [name: string]: { id: string, portName: string } },
    wantedPos: { x: number, y: number } | undefined,
  ): {
    id: string,
    height: number
  } {
    if (node == null) return {id: '', height: 0};
    let id: string;
    while (true) {
      id = Math.random().toString(36).substring(2);
      if (!(id in nodeMap)) break;
    }

    if (node.type == 'arg') {
      return this._createNodeMap(nodeMap, node.arg, functionHead, x, y, connectTo, connectNames, this.getWantedPos(node.comments));
    }

    if (node.type == 'string' || node.type == 'number' || node.type == 'boolean') {
      const inputData: InputData = {
        [node.type]: { [node.type]: node.value }
      };
      nodeMap[id] = {
        id: id,
        x: wantedPos ? wantedPos.x : x,
        y: wantedPos ? wantedPos.y : y,
        type: node.type,
        width: 200,
        connections: {
          inputs: {},
          outputs: {},
        },
        inputData: inputData,
      };
      this.connectNodes(nodeMap, { id, portName: '' }, connectTo?.id);
      return { id, height: 220 };
    }
    if (node.type == 'name') {
      let output = connectNames[node.value];
      if (output) {
        this.connectNodes(nodeMap, output, connectTo?.id);
      }
      return { id, height: 220 };
    }
    if (node.type == 'arrow') {
      let newConnectNames = { ...connectNames };
      if (connectTo && node.args && functionHead) {
        for (let i = 0; i < node.args.length; i++) {
          newConnectNames[node.args[i].arg.value] = { id: connectTo.id, portName: connectTo.portName + '_' + functionHead.inputs[i].name };
        }
      }
      return this._createNodeMap(nodeMap, node.body!, undefined, x, y, connectTo, newConnectNames, this.getWantedPos(node.comments));
    }
    if (node.type == 'func') {
      wantedPos = this.getWantedPos(node.comments);
      let fname = node.name.value;
      nodeMap[id] = {
        id: id,
        x: wantedPos ? wantedPos.x : x,
        y: wantedPos ? wantedPos.y : y,
        type: fname,
        width: 200,
        connections: {
          inputs: {},
          outputs: {},
        },
        inputData: {},
      };
      let startY = y;
      let f = this.logic.functions[fname];
      if (!f) throw new Error('unknown game function ' + fname);
      for (let i = 0; i < node.args!.length; i++) {
        let portName = '';
        let head = undefined;
        if (f.inputs[i]?.type.options[0].function) {
          portName = f.inputs[i].name;
          head = f.inputs[i].type.options[0].function;
        }
        y += this._createNodeMap(nodeMap, node.args![i], head, x - 250, y, { id, portName: portName }, connectNames, undefined).height;
      }
      this.connectNodes(nodeMap, { id, portName: '' }, connectTo?.id);
      return { id, height: Math.max(220, y - startY) };
    }
    throw new Error('unknown node type ' + node.type);
  }

  connectNodes(nodeMap: NodeMap, output: { id: string, portName: string } | undefined, input: string | undefined): void {
    if (!input || !output) return;
    const n = Object.keys(nodeMap[input].connections.inputs).length;
    const inputName = this.config.nodeTypes[nodeMap[input].type].inputs({}, {
      inputs: nodeMap[input].connections.inputs,
      outputs: nodeMap[input].connections.outputs,
    }, {})[n].name;
    const outputs = this.config.nodeTypes[nodeMap[output.id].type].outputs({}, {
      inputs: nodeMap[output.id].connections.inputs,
      outputs: nodeMap[output.id].connections.outputs,
    }, {});
    let outputName: string | undefined;
    for (let o of outputs) {
      if (o.name.split(':')[0] == output.portName) outputName = o.name;
    }

    if (outputName === undefined) throw new Error('invalid connection');

    const nodeInputs = nodeMap[input].connections.inputs;
    const nodeOutputs = nodeMap[output.id].connections.outputs;
    if (!(inputName in nodeInputs)) nodeInputs[inputName] = [];
    if (!(outputName in nodeOutputs)) nodeOutputs[outputName] = [];
    nodeInputs[inputName].push({ nodeId: output.id, portName: outputName });
    nodeOutputs[outputName].push({ nodeId: input, portName: inputName });
  }
}
