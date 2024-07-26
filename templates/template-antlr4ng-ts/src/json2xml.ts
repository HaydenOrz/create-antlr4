import { CharStream, CommonTokenStream, ParseTree, ParseTreeWalker } from 'antlr4ng';
import { JsonLexer } from './gen/json/JsonLexer';
import {
  AnObjectContext,
  ArrayOfValuesContext,
  ArrayValueContext,
  AtomContext,
  EmptyArrayContext,
  EmptyObjectContext,
  JsonContext,
  JsonParser,
  ObjectValueContext,
  PairContext,
  StringContext,
} from './gen/json/JsonParser';
import { JsonListener } from './gen/json/JsonListener';

class JSON2XMLListener implements JsonListener {
  constructor(
    public useIndent: boolean = true,
    public tabWidth: number = 4
  ) {}

  private xmlMap = new Map();

  depth = -1;

  getIndent = () => {
    if (this.depth < 0 || !this.useIndent) return '';
    return ' '.repeat(this.depth * this.tabWidth);
  };

  visitTerminal() {}

  visitErrorNode() {}

  enterEveryRule() {}

  exitEveryRule() {}

  setXml(node: ParseTree, value: string) {
    this.xmlMap.set(node, value);
  }
  getXml(node: ParseTree) {
    this.xmlMap.get(node);
    return this.xmlMap.get(node);
  }

  stripQuotes(s: string) {
    if (!s || s[0] !== '"') return s;
    return s.substring(1, s.length - 1);
  }

  exitJson(ctx: JsonContext) {
    const firstChild = ctx.getChild(0);
    if (firstChild) {
      this.setXml(ctx, this.getXml(firstChild));
    }
  }

  enterAnObject() {
    this.depth += 1;
  }

  exitAnObject(ctx: AnObjectContext) {
    let frag = '\n';
    ctx.pair().forEach((pairContext) => {
      frag += this.xmlMap.get(pairContext);
    });
    this.depth -= 1;
    this.depth >= 0 && (frag += this.getIndent());
    this.setXml(ctx, frag);
  }

  exitEmptyObject(ctx: EmptyObjectContext) {
    this.setXml(ctx, '');
  }

  exitPair(ctx: PairContext) {
    const tag = this.stripQuotes(ctx.STRING().getText());
    const frag = `${this.getIndent()}<${tag}>${this.getXml(ctx.value())}</${tag}>\n`;

    this.setXml(ctx, frag);
  }

  enterArrayOfValues() {
    this.depth += 1;
  }

  exitArrayOfValues(ctx: ArrayOfValuesContext) {
    let frag = '\n';
    ctx.value().forEach((valueContext) => {
      frag += this.getIndent();
      frag += '<element>';
      frag += this.getXml(valueContext);
      frag += '</element>';
      frag += '\n';
    });
    this.depth -= 1;

    this.depth >= 0 && (frag += this.getIndent());
    this.setXml(ctx, frag);
  }

  exitEmptyArray(ctx: EmptyArrayContext) {
    this.setXml(ctx, '');
  }

  exitString(ctx: StringContext) {
    this.setXml(ctx, this.stripQuotes(ctx.getText()));
  }

  exitAtom(ctx: AtomContext) {
    this.setXml(ctx, ctx.getText());
  }

  exitObjectValue(ctx: ObjectValueContext) {
    this.setXml(ctx, this.getXml(ctx.object()));
  }

  exitArrayValue(ctx: ArrayValueContext) {
    this.setXml(ctx, this.getXml(ctx.array()));
  }
}

export function json2Xml(input: string) {
  const charStream = CharStream.fromString(input);
  const lexer = new JsonLexer(charStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new JsonParser(tokenStream);

  const parsedTree = parser.json();
  const listener = new JSON2XMLListener();
  ParseTreeWalker.DEFAULT.walk(listener, parsedTree);

  const xml = listener.getXml(parsedTree);

  return xml;
}
