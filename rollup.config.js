export default {
	input: process.env.BUILD === 'gun' ? 'src/Gun.js' : 'src/Shot.js',
	output: [
		{
			format: 'umd',
			name: process.env.BUILD === 'gun' ? 'GUN' : 'SHOT',
			file: process.env.BUILD === 'gun' ? 'build/gun.js' : 'build/shot.js',
			indent: '\t'
		},
		{
			format: 'es',
			file: process.env.BUILD === 'gun' ? 'build/gun.module.js' : 'build/shot.module.js',
			indent: '\t'
		}
	]
};