var test = require('tape');
var asm = require('arm-assembler');
var operatorNames = require('../arm-operator-names');
var ProcessingNode = require('../processing-node');
/*jshint -W054 */

test('should create generic handler when neither OpCode nor S is specified', function(t) {
    t.plan(2);
    var node = new ProcessingNode();
    node.createAND = function(ops, regs, dest) {
        return dest + ' = "Hello from AND";';
    };
    node.createORRS = function(ops, regs, dest) {
        return dest + ' = "Hello from ORRS";';
    };
    var code = node._createProcessingHandler({}, 'regs');
    console.log(code);
    var handler = new Function('instruction', 'regs', code);
    var regs = [];
    asm('AND r1, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[1], 'Hello from AND');
    });
    asm('ORRS r1, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[1], 'Hello from ORRS');
    });
});

test('should create S-specific handler with flex OpCode', function(t) {
    t.plan(4);
    var node = new ProcessingNode();
    node.createAND = function(ops, regs, dest) {
        return dest + ' = "Hello from AND";';
    };
    node.createORR = function(ops, regs, dest) {
        return dest + ' = "Hello from ORR";';
    };
    node.createANDS = function(ops, regs, dest) {
        return dest + ' = "Hello from ANDS";';
    };
    node.createORRS = function(ops, regs, dest) {
        return dest + ' = "Hello from ORRS";';
    };
    var code = node._createProcessingHandler({
        S: 0
    }, 'regs');
    console.log(code);
    var handler = new Function('instruction', 'regs', code);
    var regs = [];
    asm('AND r10, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[10], 'Hello from AND');
    });
    // NOTE: if the handler is S-specific, it will call ORR
    // even though it is told to handle ORRS
    asm('ORRS r11, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[11], 'Hello from ORR');
    });
    code = node._createProcessingHandler({
        S: 1
    }, 'regs');
    console.log(code);
    var handlerS = new Function('instruction', 'regs', code);
    regs = [];
    asm('AND r10, r0, r0', function(err, i) {
        handlerS(i, regs);
        t.equal(regs[10], 'Hello from ANDS');
    });
    asm('ORRS r11, r0, r0', function(err, i) {
        handlerS(i, regs);
        t.equal(regs[11], 'Hello from ORRS');
    });
});

test('should create OpCode-specific handler with flex S', function(t) {
    t.plan(2);
    var node = new ProcessingNode();
    node.createAND = function(ops, regs, dest) {
        return dest + ' = "Hello from AND";';
    };
    node.createANDS = function(ops, regs, dest) {
        return dest + ' = "Hello from ANDS";';
    };
    var code = node._createProcessingHandler({
        OpCode: operatorNames.indexOf('AND'),
        Rd: 5
    }, 'regs');
    console.log(code);
    var handler = new Function('instruction', 'regs', code);
    var regs = [];
    // NOTE: AND will be called even thoufh
    // we pass ORR – this si to prove the handler is
    // specific to AND
    asm('ORR r1, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[5], 'Hello from AND');
    });
    asm('ORRS r1, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[5], 'Hello from ANDS');
    });
});

test('should create handler specific to S/OpCode combo', function(t) {
    t.plan(2);
    var node = new ProcessingNode();
    node.createANDS = function(ops, regs, dest) {
        return dest + ' = "Hello from ANDS";';
    };
    node.createORR = function(ops, regs, dest) {
        return dest + ' = "Hello from ORR";';
    };
    var code = node._createProcessingHandler({
        S: 1,
        OpCode: operatorNames.indexOf('AND'),
        Rd: 4
    }, 'regs');
    console.log(code);
    var handler = new Function('instruction', 'regs', code);
    var regs = [];
    // NOTE: ANDS will be called even though
    // we pass ORR – this is to prove the handler is
    // specific to ANDS
    asm('ORR r1, r0, r0', function(err, i) {
        handler(i, regs);
        t.equal(regs[4], 'Hello from ANDS');
    });
    code = node._createProcessingHandler({
        S: 0,
        OpCode: operatorNames.indexOf('ORR'),
        Rd: 6
    }, 'regs');
    console.log(code);
    var handlerORR = new Function('instruction', 'regs', code);
    regs = [];
    // NOTE: ORR will be called even though
    // we pass ANDS – this is to prove the handler is
    // specific to ORR
    asm('ANDS r1, r0, r0', function(err, i) {
        handlerORR(i, regs);
        t.equal(regs[6], 'Hello from ORR');
    });
});
