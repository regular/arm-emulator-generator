/* jshint -W054 */

var microtime = require('microtime');

var ConditionalNode = require('../conditional-node');
var matrix = require('../cond-matrix-16');
//var condNames = require('../cond-names');

var cpu = {};
cpu.cond_matrix = matrix;

var node = new ConditionalNode();
var expression = node.createCondition('cpsr');
var generic = new Function('cpsr', 'instruction', 'return ' + expression);

var exp = [];
var specific = [];
for(var cond=0; cond<16; ++cond) {
    exp[cond] = node.createCondition('cpsr', {Cond: cond});
    specific.push(new Function('cpsr', 'return ' + exp[cond]));
}

var N = 10000000;
function suite(f, instruction, message) {
    var start = microtime.now();
    var sum = 0;
    for (var i=0; i < N; i++) {
        sum += f((i%16)<<28, instruction) ? 1 : 0;
    }
    var duration = microtime.now() - start;
    console.log('Condition ' + cond.toString(16) + '(ms): ' + (duration / N) + ' "' + message + '"');
    return sum;
}

for (var cond = 0; cond < 16; cond++) {
    var instruction = (cond << 28) |0;
    var sum1 = suite(specific[cond], instruction, exp[cond]);
    var sum2 = suite(generic, instruction, 'generic');
    if (sum1 !== sum2) {
        process.exit(-1);
    }
}

    
