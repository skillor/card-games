JS
  = _ value:Value? _ {
    return value;
  }

Value
  = ObservableValue / Function / NameString

ObservableValue = "of(" _ value:SimpleValue _ ")" {
  return value;
 }

SimpleValue = ArrowFunction
  / Array
  / Object
  / String
  / Number
  / Boolean

ArrowFunction = "(" c1:_ args:NameArguments c3:_ ")" c2:_ "=>" _ body:Value {
  return {type:'arrow', args: args, body: body, comments: c1.concat(c2, c3)};
}

Function
  = name:NameString "(" c1:_ args:Arguments c2:_ ")" c3:_ {
  return {type:'func', name: name, args: args, comments: c1.concat(c2, c3)};
}

NameArguments
  = head:(_ NameString _ ",")* tail:(_ NameString? _) {
    if (head.length > 0) {
      for (let i=0; i<head.length-1; i++) {
          head[i][0] = head[i+1][0];
      }
      head.at(-1)[0] = tail[0];
      tail[0] = [];
    }
    return head.concat(tail[1] ? [tail] : []).map((el) => ({type: 'arg', arg: el[1], comments: el[0].concat(el[2])}));
} / _ { return []; }

Arguments
  = head:(_ Value _ ",")* tail:(_ Value? _) {
    if (head.length > 0) {
      for (let i=0; i<head.length-1; i++) {
        head[i][0] = head[i+1][0];
      }
      head.at(-1)[0] = tail[0];
      tail[0] = [];
    }
    return head.concat(tail[1] ? [tail] : []).map((el) => ({type: 'arg', arg: el[1], comments: el[0].concat(el[2])}));
} / _ { return []; }

Object
  = "{" _ "}" { return {type: 'object', value: {}}; }
  / "{" head:(_ Property _ ",")* tail:(_ Property? _) "}" {
  	return {type: 'object', value: head.concat(tail[1] ? [tail] : [])
      .map((element) => element[1])
      .reduce((result, [key, value]) => {
        result[key] = value
        return result;
      }, {})};
  }

Property
  = key:NameString _ ":" _ value:Value {
    return [ key, value ];
  }

Array
  = "[" _ "]" { return {type: 'Array', value: []}; }
  / "[" head:(_ Value _ ",")* tail:(_ Value? _) "]" {
    return {type: 'array', value: head.concat(tail[1] ? [tail] : []).map((element) => element[1])};
}


String = SingleString / DoubleString

DoubleString
  = "\"" string:([^"\\] / Escape)* "\"" {
  	return {type: 'string', value: string.join('')};
  }

SingleString
  = "\'" string:([^'\\] / Escape)* "\'" {
  	return {type: 'string', value: string.join('')};
  }

Escape
  = "\\" character:['"\\/bfnrt] {
    switch (character) {
      case "'":
      case '"':
      case '\\':
      case '/':
        return character;
      case 'b': return '\b';
      case 'f': return '\f';
      case 'n': return '\n';
      case 'r': return '\r';
      case 't': return '\t';
    }
  }
  / "\\u" codePoint:([0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) {
    return String.fromCodePoint(parseInt(codePoint.join(''), 16));
  }

Number
  = "-"? ("0" / ([1-9] [0-9]*)) ("." [0-9]+)? (("e" / "E") ("+" / "-")? [0-9]+)? {
    return {type: 'number', value: parseFloat(text())};
}

Boolean
  = "true" { return {type: 'boolean', value: true}; }
  / "false" { return {type: 'boolean', value: false}; }

_ "whitespace"
  = comment+ / [ \t\n\r]* { return [] };

comment = single_line_comment / multi_line_comment

single_line_comment = [ \t\n\r]* "//" comment:single_line_char* [ \t\n\r]* { return comment.join(''); }
single_line_char = ![\n] char:(.) { return char; }
multi_line_comment = [ \t\n\r]* "/*" comment:multi_line_char* "*/" [ \t\n\r]* { return comment.join(''); }
multi_line_char = !"*/" char:(.) { return char; }

NameString = chars:NameChar+ { return {type: 'name', value: chars.join('')}; }

NameChar = [0-9a-zA-Z$_]
