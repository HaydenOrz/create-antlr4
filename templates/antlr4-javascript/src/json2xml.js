import antlr4, { CharStreams, CommonTokenStream } from 'antlr4';
import JsonLexer from './gen/json/JsonLexer.js';
import JsonParser from './gen/json/JsonParser.js';
import JsonListener from './gen/json/JsonListener.js';

class JSON2XMLListener extends JsonListener {
  constructor(useIndent = true, tabWidth = 4) {
    super();
    this.useIndent = useIndent;
    this.tabWidth = tabWidth;
  }

  xmlMap = new Map();

  depth = -1;

  getIndent = () => {
    if (this.depth < 0 || !this.useIndent) return '';
    return ' '.repeat(this.depth * this.tabWidth);
  };
  setXml(node, value) {
    this.xmlMap.set(node, value);
  }
  getXml(node) {
    this.xmlMap.get(node);
    return this.xmlMap.get(node);
  }

  stripQuotes(s) {
    if (!s || s[0] !== '"') return s;
    return s.substring(1, s.length - 1);
  }

  exitJson(ctx) {
    const firstChild = ctx.getChild(0);
    if (firstChild) {
      this.setXml(ctx, this.getXml(firstChild));
    }
  }

  enterAnObject() {
    this.depth += 1;
  }

  exitAnObject(ctx) {
    let frag = '\n';
    ctx.pair().forEach((pairContext) => {
      frag += this.xmlMap.get(pairContext);
    });
    this.depth -= 1;
    this.depth >= 0 && (frag += this.getIndent());
    this.setXml(ctx, frag);
  }

  exitEmptyObject(ctx) {
    this.setXml(ctx, '');
  }

  exitPair(ctx) {
    const tag = this.stripQuotes(ctx.STRING().getText());
    const frag = `${this.getIndent()}<${tag}>${this.getXml(ctx.value())}</${tag}>\n`;

    this.setXml(ctx, frag);
  }

  enterArrayOfValues() {
    this.depth += 1;
  }

  exitArrayOfValues(ctx) {
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

  exitEmptyArray(ctx) {
    this.setXml(ctx, '');
  }

  exitString(ctx) {
    this.setXml(ctx, this.stripQuotes(ctx.getText()));
  }

  exitAtom(ctx) {
    this.setXml(ctx, ctx.getText());
  }

  exitObjectValue(ctx) {
    this.setXml(ctx, this.getXml(ctx.object()));
  }

  exitArrayValue(ctx) {
    this.setXml(ctx, this.getXml(ctx.array()));
  }
}

export function json2Xml(input) {
  const charStream = CharStreams.fromString(input);
  const lexer = new JsonLexer(charStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new JsonParser(tokenStream);

  const parsedTree = parser.json();
  const listener = new JSON2XMLListener();
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(listener, parsedTree);

  const xml = listener.getXml(parsedTree);

  return xml;
}
