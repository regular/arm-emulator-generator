var test = require('tape');
var asm = require('arm-assembler');
var operatorNames = require('../arm-operator-names');
var ProcessingNode = require('../processing-node');
/*jshint -W054 */

test('createUnconditionalHandler should create generic handler when OpCode is not specified', function(t) {
    var node = new ProcessingNode();
    node.createAND = function(fields, regs) {
        return regs + '[' + fields.Rd + '] = "Hello from AND";';
    };
    node.createORR = function(fields, regs) {
        return regs + '[' + fields.Rd + '] = "Hello from ORR";';
    };
    var code = node.createUnconditionalHandler({}, 'regs');
    var handler = new Function('instruction', 'regs', code);
    var regs = [];
    asm('AND r1, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[1], 'Hello from AND');
    });
    asm('ORR r1, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[1], 'Hello from ORR');
    });
    t.end();
});


test('createUnconditionalHandler should create specific handler when OpCode is specified', function(t) {
    var node = new ProcessingNode();
    node.createAND = function(fields, regs) {
        return regs + '[' + fields.Rd + '] = "Hello from AND";';
    };
    var code = node.createUnconditionalHandler({
        OpCode: operatorNames.indexOf('AND'),
        Rd: 5
    }, 'regs');
    var handler = new Function('instruction', 'regs', code);
    var regs = [];
    asm('AND r1, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[5], 'Hello from AND');
    });
    t.end();
});
