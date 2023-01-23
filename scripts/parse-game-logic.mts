import { FunctionHead, FunctionInputHead, GameLogicHead, TypeHead, TypingHead, TypingOption } from 'src/app/shared/games/game-logic';
//@ts-ignore
import ts from 'typescript';
import * as fs from 'fs';


class Parser {
  code: string = '';
  result: GameLogicHead = {
    types: [],
    functions: [],
  };

  reset(): void {
    this.result = {
      types: [],
      functions: [],
    };
  }

  parseFile(fs: any, filePath: string): void {
    this.parseString(fs.readFileSync(filePath, {encoding: 'utf8'}));
  }

  parseString(code: string): void {
    this.code = code;
    this.startParsing();
  }

  startParsing(): void {
    this.reset();
    const node = ts.createSourceFile('x.ts', this.code, ts.ScriptTarget.Latest);

    for (let statementT of node.statements) {
      let statement: any = statementT;
      if (statement.name && statement.name.escapedText === 'GameLogic') {
        this.parseGameLogicStmt(statement);
        break;
      }
    }
  }

  parseGameLogicStmt(statement: any): void {
    for (let member of statement.members) {
      if (member.name && member.name.escapedText) {
        let f = this.getFunction(member, []);
        if (f) this.addFunction(f);
      }
    }
  }

  getOneTypeByString(s: string): TypeHead {
    s = s.trim();
    if (s.endsWith('[]')) return {
      isArray: true,
      name: s.substring(0, s.length-2),
    };
    return {
      isArray: false,
      name: s,
    };
  }

  getTypeByToken(token: any, typeParameters: string[]): TypingOption {
    if (token.parameters !== undefined) {
      return {function: this.getFunction(token, typeParameters)};
    }
    return {type: this.getOneTypeByString(this.getStringByToken(token))};
  }

  getOptionsByToken(token: any, typeParameters: string[]): TypingOption[] {
    if (token.types !== undefined) return token.types.map((t: any) => this.getTypeByToken(t, typeParameters));
    return [this.getTypeByToken(token, typeParameters)];
  }

  getStringByToken(token: any): string {
    return this.code.substring(token.pos, token.end);
  }

  getFunction(member: any, typeParameters: string[]): FunctionHead | undefined {
    if (member.type.typeName.escapedText != 'Observable') {
      console.warn('unknown type, skipping...', member);
      return undefined;
    }
    if (member.typeParameters) {
      typeParameters = member.typeParameters.map((x: any) => x.name.escapedText);
    }
    let name: string = member.name ? member.name.escapedText : '';
    let outputType: TypingHead = {options: this.getOptionsByToken(member.type.typeArguments[0], typeParameters)};

    let inputs: FunctionInputHead[] = [];
    for (let param of member.parameters) {
      let type: any = undefined;
      let dotdot = false;
      let optional = false;

      if (param.type.types && param.type.types.length == 2) {
        if (this.getStringByToken(param.type.types[1]).trim() == 'undefined') {
          type = param.type.types[0];
          optional = true;
        } else if (this.getStringByToken(param.type.types[0]).trim() == 'undefined') {
          type = param.type.types[1];
          optional = true;
        }
      }
      if (param.type.typeName) {
        type = param.type;
      }
      if (param.type.elementType) {
        type = param.type.elementType;
        dotdot = true;
      }
      if (type) {
        if (type.typeName.escapedText !== 'Observable') {
          console.warn('unknown type, skipping...', member);
          return undefined;
        }
        inputs.push({
          name: param.name.escapedText,
          type: {options: this.getOptionsByToken(type.typeArguments[0], typeParameters)},
          optional: optional,
          dotdot: dotdot,
        });
        continue;
      }
      console.warn('unknown param, skipping...', param);
    }

    for (let option of outputType.options) {
      this.recAddType(option, typeParameters);
    }
    for (let input of inputs) {
      for (let option of input.type.options) {
        this.recAddType(option, typeParameters);
      }
    }

    return {
      name: name,
      typeParameters: typeParameters,
      inputs: inputs,
      outputType: outputType,
    };
  }

  addFunction(f: FunctionHead): void {
    this.result.functions.push(f);
  }

  recAddType(type: TypingOption, ignore: string[]): void {
    if (type.type && !ignore.includes(type.type.name)) {
      this.addTypes(type.type.name);
    }
  }

  addTypes(type: string): void {
    if (!this.result.types.includes(type)) this.result.types.push(type);
  }

  writeToJson(fs: any, filePath: string): void {
    fs.writeFileSync(filePath, JSON.stringify(this.result, undefined, 2));
  }
}

if (process) {
  const args = process.argv.slice(2);
  const parser = new Parser();
  parser.parseFile(fs, args[0]);
  for (let i=1; i<args.length;i++) {
    if (args[i].endsWith('.json'))
      parser.writeToJson(fs, args[i]);
  }
}
