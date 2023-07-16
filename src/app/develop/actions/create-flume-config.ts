import { Colors, FlumeConfig } from "flume";
import { NodeResolver } from "./node-resolver";
import { FunctionHead, GameLogicHead, TypeHead } from "src/app/shared/games/game-logic";
import { ConnectionMap, Connections, PortType, PortTypeBuilder } from "flume/dist/types";

function hashString(s: string): number {
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

function typeToString(t: TypeHead): string {
  return t.name + (t.isArray ? '[]' : '');
}

function prefixString(s: string, prefix: string): string {
  if (prefix != '') return prefix + '_' + s;
  return s;
}

function createGenericMap(f: FunctionHead, inputs: ConnectionMap, outputs: ConnectionMap, genericMap: { [key: string]: string }, prefix: string): { [key: string]: string } {
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
    let prefixedName = prefixString(input.name, prefix)
    for (let option of input.type.options) {
      if (option.function) {
        createGenericMap(option.function, inputs, outputs, genericMap, prefixedName);
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

function createPorts(
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
          portTypeName = typeToString(option.type);
        }
        let name = prefixString(input.name, prefix);
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
        createPorts(option.function, connections, ports, outputPorts, inputPorts, prefixString(input.name, prefix), genericMap);
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
        portTypeName = typeToString(option.type);
      }
      let name = portTypeName;
      let portName = prefix + ':' + portTypeName;
      if (prefix != '') {
        name = prefix + ':' + name;
        portName = prefix + ':' + typeToString(option.type);
      }
      outputPorts.push(ports[portTypeName]({ noControls: true, label: name, name: portName }));
      continue;
    }
    console.error('not implemented');
  }
}

export function createFlumeConfig(logic: GameLogicHead): FlumeConfig {
  const flumeConfig = new FlumeConfig();
      const colors = Object.values(Colors);

      for (let name of logic.types) {
        const controls: any[] = [];
        const simpleType = NodeResolver.simpleTypes[name];
        if (simpleType) {
          controls.push(simpleType.control({ name: name, label: simpleType.label }));
        }

        const color = colors[hashString(name) % colors.length];
        flumeConfig.addPortType({
          type: name,
          name: name,
          label: name,
          color: color,
          controls: controls,
        });

        const arrayName = name + '[]';
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

      for (let f of Object.values(logic.functions)) {
        flumeConfig.addNodeType({
          type: f.name,
          label: f.name,
          description: f.name,
          inputs: ports => (_inputData, connections, _context) => {
            let inputPorts: PortType[] = [];
            createPorts(f, connections, ports, inputPorts, [], '', createGenericMap(f, connections.inputs, connections.outputs, {}, ''));
            return inputPorts;
          },
          outputs: ports => (_inputData, connections, _context) => {
            let outputPorts: PortType[] = [];
            createPorts(f, connections, ports, [], outputPorts, '', createGenericMap(f, connections.inputs, connections.outputs, {}, ''));
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
        outputs: _ports => [],
      });
      return flumeConfig;
}
