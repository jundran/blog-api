module.exports = {
	'env': {
		'node': true,
		'es2022': true
	},
	'extends': [
		'eslint:recommended'
	],
	'parserOptions': {
		'ecmaVersion': 'latest',
		'sourceType': 'module'
	},
	'rules': {
		'prefer-const': 'error',
		'indent': ['error','tab',{ 'SwitchCase': 1 }],
		'linebreak-style': ['error','unix'],
		'quotes': ['error','single'],
		'semi': ['error','never'],
		'keyword-spacing': ['error',{ 'before': true, 'after': true }],
		'func-call-spacing': ['error','never'],
		'space-before-function-paren': ['error','always'],
		'eol-last': ['error','always'],
		'comma-dangle': ['error','never'],
		'no-trailing-spaces': 'error',
		'no-unused-vars': ['warn', { 'argsIgnorePattern': 'next' }]
	}
}
