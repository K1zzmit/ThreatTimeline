import Prism from 'prismjs';

// Define SPL (Splunk Processing Language) syntax
Prism.languages.spl = {
  'command': {
    pattern: /\|\s*\w+/,
    alias: 'keyword'
  },
  'sourcetype': {
    pattern: /\b(?:sourcetype|source|index|host)\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/i,
    alias: 'important'
  },
  'function': {
    pattern: /\b(?:stats|eval|rex|table|dedup|sort|top|rare|timechart|transaction|join|lookup|search|where|fields|rename|convert)\b/i,
    alias: 'keyword'
  },
  'string': {
    pattern: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/,
    greedy: true
  },
  'field': {
    pattern: /\b[a-zA-Z0-9_]+\s*=/,
    alias: 'property'
  },
  'operator': /=|!=|<|>|<=|>=|AND|OR|NOT|\|\s*/i,
  'punctuation': /[[\](){},:]/
}; 