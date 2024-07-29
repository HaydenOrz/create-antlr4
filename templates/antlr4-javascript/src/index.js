import { json2Xml } from './json2xml.js';

const profile = {
  name: 'Hayden',
  email: 'hayden9653@gmail.com',
  github: "https://github.com/HaydenOrz",
  location: "Hangzhou",
  tech: ['javascript', 'typescript', 'antlr4'],
};

const xml = json2Xml(JSON.stringify(profile));

console.log(xml);
