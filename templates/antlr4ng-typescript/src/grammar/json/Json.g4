// $antlr-format alignTrailingComments true, columnLimit 150, minEmptyLines 1, maxEmptyLinesToKeep 1, reflowComments false, useTab false
// $antlr-format allowShortRulesOnASingleLine false, allowShortBlocksOnASingleLine true, alignSemicolons hanging, alignColons hanging
// $antlr-format spaceBeforeAssignmentOperators false, keepEmptyLinesAtTheStartOfBlocks true

grammar Json;

json
    : object EOF
    | array EOF
    ;

object
    : '{' pair (',' pair)* '}' # AnObject
    | '{' '}'                  # EmptyObject
    ;

pair
    : STRING ':' value
    ;

array
    : '[' value (',' value)* ']' # ArrayOfValues
    | '[' ']'                    # EmptyArray
    ;

value
    : STRING  # String
    | NUMBER  # Atom
    | 'true'  # Atom
    | 'false' # Atom
    | 'null'  # Atom
    | object  # ObjectValue
    | array   # ArrayValue
    ;

STRING
    : '"' (ESC | ~["\\])* '"'
    ;

NUMBER
    : '-'? INT '.' [0-9]+ EXP?
    | '-'? INT EXP
    | '-'? INT
    ;

WS
    : [ \t\n\r]+ -> skip
    ;

fragment ESC
    : '\\' (["\\/bfnrt] | UNICODE)
    ;

fragment UNICODE
    : 'u' HEX HEX HEX HEX
    ;

fragment HEX
    : [0-9a-fA-F]
    ;

fragment INT
    : '0'
    | [1-9] [0-9]*
    ;

fragment EXP
    : [Ee] [+\-]? INT
    ;