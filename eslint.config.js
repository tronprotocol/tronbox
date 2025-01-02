const nodePlugin = require('eslint-plugin-n');
const globals = require('globals');

module.exports = [
  nodePlugin.configs['flat/recommended-script'],
  {
    rules: {
      eqeqeq: ['error', 'smart'],
      'no-console': [
        'error',
        {
          allow: ['debug', 'info', 'warn', 'error']
        }
      ],
      'no-var': ['error'],
      'prefer-const': [
        'error',
        {
          destructuring: 'all'
        }
      ],
      'n/exports-style': ['error', 'module.exports'],
      'n/prefer-global/buffer': ['error', 'always'],
      'n/prefer-global/console': ['error', 'always'],
      'n/prefer-global/process': ['error', 'always'],
      'n/prefer-global/text-decoder': ['error', 'always'],
      'n/prefer-global/text-encoder': ['error', 'always'],
      'n/prefer-global/url': ['error', 'always'],
      'n/prefer-global/url-search-params': ['error', 'always'],
      'n/no-process-exit': ['off'],
      'n/no-unpublished-require': [
        'error',
        {
          allowModules: ['eslint-plugin-n', 'globals']
        }
      ]
    }
  },
  {
    files: ['./test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
        tronWeb: 'readonly',
        tronWrap: 'readonly',
        web3: 'readonly',
        assert: 'readonly',
        expect: 'readonly',
        artifacts: 'readonly',
        contract: 'readonly'
      }
    }
  }
];
