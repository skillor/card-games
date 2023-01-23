JSON
  = _ value:Value _ {
    return value;
  }

Value
  = Function / ObservableValue / NameString
  
ObservableValue = "of(" _ value:SimpleValue _ ")" {
  return value;
 }

SimpleValue = ArrowFunction
  / Array
  / Object
  / String
  / Number
  / Boolean
  / Null

ArrowFunction = args:NameArguments _ "=>" _ body:Value {
  return {type:'arrow', args: args, body: body};
}

Function
  = "game." name:NameString args:Arguments {
  return {type:'game', name: name, args: args};
}

NameArguments
  = "(" _ ")" { return []; }
  / "(" head:(_ NameString _ ",")* tail:(_ NameString? _) ")" {
    return head.concat(tail[1] ? [tail] : []).map((element) => element[1]);
}

Arguments
  = "(" _ ")" { return []; }
  / "(" head:(_ Value _ ",")* tail:(_ Value? _) ")" {
    return head.concat(tail[1] ? [tail] : []).map((element) => element[1]);
}

Object
  = "{" _ "}" { return {}; }
  / "{" head:(_ Property _ ",")* tail:(_ Property? _) "}" {
  	return head.concat(tail[1] ? [tail] : [])
      .map((element) => element[1])
      .reduce((result, [key, value]) => {
        result[key] = value
        return result;
      }, {});
  }

Property
  = key:NameString _ ":" _ value:Value {
    return [ key, value ];
  }

Array
  = "[" _ "]" { return {type: 'Array', value: []}; }
  / "[" head:(_ Value _ ",")* tail:(_ Value? _) "]" {
    return {type: 'Array', value: head.concat(tail[1] ? [tail] : []).map((element) => element[1])};
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

Null
  = "null" { return {type: 'null', value: null}; }

_ "whitespace"
  = [ \t\n\r]*

NameString = chars:NameChar+ { return {type: 'name', value: chars.join('')}; }

NameChar = [0-9a-zA-Z$_]
