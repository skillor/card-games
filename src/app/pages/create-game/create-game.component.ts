import { Component, OnInit } from '@angular/core';
import { Colors, Controls, FlumeConfig, NodeEditor } from 'flume';
import { ConnectionMap, Connections, InputData, NodeMap, PortType, PortTypeBuilder } from 'flume/dist/types';
import { createRef } from 'react';
import { FileService } from 'src/app/shared/file/file.service';
import { Game } from 'src/app/shared/games/game';
import { FunctionHead, GameLogicHead, TypeHead } from 'src/app/shared/games/game-logic';
import { GamesService } from 'src/app/shared/games/games.service';
import { Node, parse } from './code-parser';


@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.component.html',
  styleUrls: ['./create-game.component.scss'],
})
export class CreateGameComponent implements OnInit {
  NodeEditor = NodeEditor;
  config: any = {
    style: {height: "50%"},
  };
  logic?: GameLogicHead;
  game: {
    // gamePhaseMaps: {[key: string]: NodeMap},
    gameActionMaps: { [key: string]: NodeMap },
  } = {
      // gamePhaseMaps: {},
      gameActionMaps: {},
    };

  activeNodes?: NodeMap;

  prettyPrintIndent = 2;

  activeAction = '';
  changeActiveName = '';

  private simpleTypes: { [key: string]: any } = {
    'string': { label: 'String', control: Controls.text },
    'number': { label: 'Number', control: Controls.number },
    'boolean': { label: 'True/False', control: Controls.checkbox },
  };

  createDefaultAction(): void {
    this.game.gameActionMaps['action1'] = {};
    this.changeAction('action1');
  }

  getNodes(): NodeMap {
    if (!this.config || !this.config.ref) return {};
    return this.config.ref.current.getNodes();
  }

  setNodes(nodes: NodeMap): void {
    this.config = { ...this.config, nodes: nodes };
  }

  addAction(): void {
    let i = 1;
    while ('action' + i in this.game.gameActionMaps) i++;
    let name = 'action' + i;
    this.game.gameActionMaps[name] = {}
    this.changeAction(name);
  }

  saveActiveAction(): void {
    if (this.activeAction) this.game.gameActionMaps[this.activeAction] = this.getNodes();
  }

  changeAction(phaseName: string) {
    this.saveActiveAction();
    this.activeAction = phaseName;
    this.changeActiveName = this.activeAction;
    this.setNodes(this.game.gameActionMaps[phaseName]);
  }

  changeActionName() {
    if (!this.changeActiveName) return;
    if (this.changeActiveName in this.game.gameActionMaps) return;
    this.game.gameActionMaps[this.changeActiveName] = this.game.gameActionMaps[this.activeAction];
    delete this.game.gameActionMaps[this.activeAction];
    this.activeAction = this.changeActiveName;
  }

  deleteAction() {
    delete this.game.gameActionMaps[this.activeAction];
    this.pickAction();
  }

  pickAction() {
    let keys = Object.keys(this.game.gameActionMaps);
    this.activeAction = '';
    if (keys.length > 0) return this.changeAction(keys[0]);
    this.createDefaultAction();
  }

  connectNodes(nodeMap: NodeMap, output: {id: string, portName: string} | undefined, input: string | undefined): void {
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

  createNodeMap(nodeMap: NodeMap, node: Node, x: number, y: number, connectTo: {id: string, portName: string} | undefined, connectNames: { [name: string]: {id: string, portName: string} }): { id: string, height: number } {
    let id: string;
    while (true) {
      id = Math.random().toString(36).substring(2);
      if (!(id in nodeMap)) break;
    }

    if (node.type == 'string' || node.type == 'number' || node.type == 'boolean') {
      const inputData: InputData = {
        [node.type]: { [node.type]: node.value }
      };
      nodeMap[id] = {
        id: id,
        x: x,
        y: y,
        type: node.type,
        width: 200,
        connections: {
          inputs: {},
          outputs: {},
        },
        inputData: inputData,
      };
      this.connectNodes(nodeMap, {id, portName: ''}, connectTo?.id);
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
      let newConnectNames = {...connectNames};
      if (connectTo && node.args) {
        for (let arg of node.args) {
          newConnectNames[arg.value] = {id: connectTo.id, portName: connectTo.portName + '_' + arg.value};
        }
      }
      let r = this.createNodeMap(nodeMap, node.body!, x, y, connectTo, newConnectNames);
      return r;
    }
    if (node.type == 'game') {
      let fname = node.name!.value!;
      nodeMap[id] = {
        id: id,
        x: x,
        y: y,
        type: fname,
        width: 200,
        connections: {
          inputs: {},
          outputs: {},
        },
        inputData: {},
      };
      let startY = y;
      let f = this.logic?.functions.find((x) => x.name == fname);
      if (!f) throw new Error('unknown game function ' + fname);
      for (let i = 0; i < node.args!.length; i++) {
        let portName = '';
        if (f.inputs[i]?.type.options[0].function) portName = f.inputs[i].name;
        y += this.createNodeMap(nodeMap, node.args![i], x - 250, y, {id, portName: portName}, connectNames).height;
      }
      this.connectNodes(nodeMap, {id, portName: ''}, connectTo?.id);
      return { id, height: Math.max(220, y - startY) };
    }
    throw new Error('unknown node type ' + node.type);
  }

  parse() {
    this.fileService.loadFile('.js').subscribe((content) => {
      this.addAction();
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
      this.createNodeMap(nodes, parse(content), -250, 0, {id: rootNodeId, portName: 'FunctionResult'}, {});
      this.setNodes(nodes);
    });
  }

  compile() {
    console.log(this.resolveRootNode(this.config.ref.current.getNodes()));
  }

  run() {
    let game = new Game({ cards: {}, name: '', playerStacks: {}, globalStacks: {}, gameActions: {}, gamePhases: {}, variables: {}, startPhase: '' });
    game.createGameState([]);
    game.runFunction(this.resolveRootNode(this.config.ref.current.getNodes())).subscribe((r) => {
      console.log(r);
    });
  }

  save() {
    this.saveActiveAction();
    this.fileService.saveFile('test.game.json', JSON.stringify(this.game));
  }

  load() {
    this.fileService.loadFile('.json').subscribe((content) => {
      this.game = JSON.parse(content);
      this.pickAction();
    });
  }

  constructor(
    private gamesService: GamesService,
    private fileService: FileService,
  ) {
    this.createDefaultAction();
  }

  resolveRootNode(nodes: NodeMap): string | undefined {
    for (let node of Object.values(nodes)) {
      if (node.root) {
        for (let input of Object.values(node.connections.inputs)) {
          if (input.length !== 1) throw new Error('root node not connected');
          return this.resolveNode(nodes, input[0].nodeId, 0);
        }
      };
    }
    throw new Error('root node not found');
  }

  resolveNode(nodes: NodeMap, startId: string, depth: number, endFunction: { id: string, prefix: string } | undefined = undefined): string | undefined {
    if (!this.logic) throw new Error('unknown logic');
    const node = nodes[startId];
    const simple = this.simpleTypes[node.type];
    if (simple) {
      return `of(${JSON.stringify(node.inputData[node.type][node.type])})`
    }
    const f = this.logic.functions.find((f) => f.name === node.type);
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
              let t = this.resolveNode(nodes, con[0].nodeId, depth + 1, endFunction);
              if (t) inputs.push(`of((${fin.type.options[0].function.inputs.map((i) => i.name).join(',')})=>${t})`);
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
        let t = this.resolveNode(nodes, con[0].nodeId, depth + 1, endFunction);
        if (t) inputs.push(`of((${fin.type.options[0].function.inputs.map((i) => i.name).join(',')})=>${t})`);
        continue;
      }
      let t = this.resolveNode(nodes, con[0].nodeId, depth + 1, endFunction);
      if (t) inputs.push(t);
    }
    let inputS = '';
    if (inputs.length > 0 && this.prettyPrintIndent > 0) inputS = `\n${inputs.map((i) => i.split('\n').map((l) => l = ' '.repeat(this.prettyPrintIndent) + l).join('\n')).join(',\n')}\n`;
    else inputS = inputs.join(',');
    return `game.${node.type}(${inputS})`;
  }

  hashString(s: string): number {
    var hash = 0,
      i, chr;
    if (s.length === 0) return hash;
    for (i = 0; i < s.length; i++) {
      chr = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  typeToString(t: TypeHead): string {
    return t.name + (t.isArray ? '[]' : '');
  }

  prefixString(s: string, prefix: string): string {
    if (prefix != '') return prefix + '_' + s;
    return s;
  }

  createGenericMap(f: FunctionHead, inputs: ConnectionMap, outputs: ConnectionMap, genericMap: { [key: string]: string }, prefix: string): { [key: string]: string } {
    for (let option of f.outputType.options) {
      if (option.type && f.typeParameters.includes(option.type.name)) {
        if (!(option.type.name in genericMap)) {
          genericMap[option.type.name] = 'Generic';
        }
        if (prefix) {
          for (let iName of Object.keys(inputs)) {
            if (iName.startsWith(prefix + ':')) {
              let type = inputs[iName][0].portName.split(':')[1];
              if (option.type.isArray) type = type.substring(0, type.length - 2);
              genericMap[option.type.name] = type;
            }
          }
        }
      }
    }
    for (let input of f.inputs) {
      let prefixedName = this.prefixString(input.name, prefix)
      for (let option of input.type.options) {
        if (option.function) {
          this.createGenericMap(option.function, inputs, outputs, genericMap, prefixedName);
          continue;
        }
        if (option.type
          && f.typeParameters.includes(option.type.name)) {

          if (!(option.type.name in genericMap)) {
            genericMap[option.type.name] = 'Generic';
          }
          if (input.dotdot) {
            for (let iName of Object.keys(inputs)) {
              if (iName.startsWith(prefixedName) && inputs[iName].length > 0) {
                let type = inputs[iName][0].portName.split(':')[1];
                if (option.type.isArray) type = type.substring(0, type.length - 2);
                genericMap[option.type.name] = type;
                break;
              }
            }
          } else {
            for (let iName of Object.keys(inputs)) {
              if (iName.startsWith(prefixedName) && inputs[iName].length > 0) {
                let type = inputs[iName][0].portName.split(':')[1];
                if (option.type.isArray) type = type.substring(0, type.length - 2);
                genericMap[option.type.name] = type;
              }
            }
          }
        }
      }
    }
    return genericMap;
  }

  createPorts(
    f: FunctionHead,
    connections: Connections,
    ports: { [portType: string]: PortTypeBuilder },
    inputPorts: PortType[],
    outputPorts: PortType[],
    prefix: string,
    genericMap: { [key: string]: string },
  ): void {

    for (let input of f.inputs) {
      for (let option of input.type.options) {
        if (option.type) {
          let portTypeName = genericMap[option.type.name];
          if (portTypeName) {
            portTypeName += option.type.isArray ? '[]' : '';
          } else {
            portTypeName = this.typeToString(option.type);
          }
          let name = this.prefixString(input.name, prefix);
          let suffix = '';
          if (prefix) suffix = ':' + portTypeName;
          if (input.dotdot) {
            let i = 0;
            let inputNames = Object.keys(connections.inputs);
            for (let iName of inputNames) {
              if (iName.startsWith(name)) {
                let x = +iName.substring(name.length);
                if (isNaN(x)) continue;
                i = Math.max(x, i);
                inputPorts.push(ports[portTypeName]({ noControls: true, name: iName, label: name + ':' + portTypeName }));
              }
            }
            inputPorts.push(ports[portTypeName]({ noControls: true, name: name + (i + 1) + suffix, label: name + ':' + portTypeName }));
            continue;
          }
          inputPorts.push(ports[portTypeName]({ noControls: true, name: name + suffix, label: name + (input.optional ? '?' : '') + ':' + portTypeName }));
          continue;
        }

        if (option.function) {
          // TODO: switch inputs / outputs for some reason?
          this.createPorts(option.function, connections, ports, outputPorts, inputPorts, this.prefixString(input.name, prefix), genericMap);
          continue;
        }
        console.error('not implemented');
      }
    }

    for (let option of f.outputType.options) {
      if (option.type) {
        let portTypeName = genericMap[option.type.name];
        if (portTypeName) {
          portTypeName += option.type.isArray ? '[]' : '';
        } else {
          portTypeName = this.typeToString(option.type);
        }
        let name = portTypeName;
        let portName = prefix + ':' + portTypeName;
        if (prefix != '') {
          name = prefix + ':' + name;
          portName = prefix + ':' + this.typeToString(option.type);
        }
        outputPorts.push(ports[portTypeName]({ noControls: true, label: name, name: portName }));
        continue;
      }
      console.error('not implemented');
    }
  }

  ngOnInit(): void {
    this.gamesService.getGameLogicHead().subscribe((logic) => {
      this.logic = logic;
      const flumeConfig = new FlumeConfig();
      const colors = Object.values(Colors);

      for (let name of logic.types) {
        let controls: any[] = [];
        let simpleType = this.simpleTypes[name];
        if (simpleType) {
          controls.push(simpleType.control({ name: name, label: simpleType.label }));
        }

        let color = colors[this.hashString(name) % colors.length];
        flumeConfig.addPortType({
          type: name,
          name: name,
          label: name,
          color: color,
          controls: controls,
        });

        let arrayName = name + '[]';
        flumeConfig.addPortType({
          type: arrayName,
          name: arrayName,
          label: arrayName,
          color: color,
          controls: [],
        });

        if (controls.length > 0) {
          flumeConfig.addNodeType({
            type: name,
            label: name.substring(0, 1).toUpperCase() + name.substring(1),
            description: 'Creates a ' + name,
            inputs: ports => [ports[name]({ name: name, label: ' ', hidePort: true })],
            // we need to use this as a function
            outputs: ports => () => [ports[name]({ name: ':' + name, label: name })],
          });
        }
      }

      flumeConfig.addPortType({
        type: 'Generic',
        name: 'Generic',
        label: 'Generic',
        color: 'grey',
        acceptTypes: logic.types,
        controls: [],
      });

      flumeConfig.addPortType({
        type: 'Generic[]',
        name: 'Generic[]',
        label: 'Generic[]',
        color: 'grey',
        acceptTypes: logic.types.map(x => x + '[]'),
        controls: [],
      });

      for (let f of logic.functions) {
        flumeConfig.addNodeType({
          type: f.name,
          label: f.name,
          description: f.name,
          inputs: ports => (inputData, connections, context) => {
            let inputPorts: PortType[] = [];
            this.createPorts(f, connections, ports, inputPorts, [], '', this.createGenericMap(f, connections.inputs, connections.outputs, {}, ''));
            return inputPorts;
          },
          outputs: ports => (inputData, connections, context) => {
            let outputPorts: PortType[] = [];
            this.createPorts(f, connections, ports, [], outputPorts, '', this.createGenericMap(f, connections.inputs, connections.outputs, {}, ''));
            return outputPorts;
          },
        });
      }

      flumeConfig.addRootNodeType({
        type: 'GameLogic',
        label: 'GameLogic',
        description: 'GameLogic',
        // we need to use this as a function
        inputs: ports => () => [ports['FunctionResult']()],
        outputs: ports => [],
      });

      this.config = {
        ...this.config,
        ...flumeConfig,
        circularBehavior: 'allow',
        defaultNodes: [{
          type: "GameLogic",
        }],
        ref: createRef(),
      };
    });
  }
}
