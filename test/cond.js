var test = require('tape');
var ConditionalNode = require('../conditional-node');
var matrix = require('../fixtures/cond-matrix');

test('createCondition should return an expression', function(t) {
    t.test('that either extracts condtion flags from the instruction', function(t) {
        var node = new ConditionalNode();
        var expression = node.createCondition('cpsr');
        /* jshint -W054 */
        console.log(expression);
        var f = new Function('cpsr', 'instruction', 'return ' + expression);
        t.ok(f(0x40000000 /*  Z */, 0x00000000 /* EQ */));
        t.notOk(f(0x00000000 /* NZ */, 0x00000000 /* EQ */));
        t.notOk(f(0x40000000 /*  Z */, 0x10000000 /* NE */));
        t.ok(f(0x00000000 /* NZ */, 0x10000000 /* NE */));
        t.end();
    });
    t.test('... or uses a hardcoded condition code', function(t) {
        var node = new ConditionalNode();
        var EQ = node.createCondition('cpsr', {Cond: 0});
        var NE = node.createCondition('cpsr', {Cond: 1});
        /* jshint -W054 */
        console.log('EQ', EQ);
        console.log('NE', NE);
        var eq = new Function('cpsr', 'return ' + EQ);
        var ne = new Function('cpsr', 'return ' + NE);
        t.ok(eq(0x40000000 /*  Z */));
        t.notOk(eq(0x00000000 /* NZ */));
        t.notOk(ne(0x40000000 /*  Z */));
        t.ok(ne(0x00000000 /* NZ */));
        t.end();
    });
    t.test('createHandler() should wrap the unconditional handler in an if-statement', function(t) {
        var node = new ConditionalNode();
        node.createUnconditionalHandler = function(ops, regs) {
            return regs+'[0] = 1;';
        };
        var handlerCode = node.createHandler({}, 'regs');
        console.log(handlerCode);
        /* jshint -W054 */
        var handler = new Function('instruction', 'regs', handlerCode);

        var regs = [];
        regs[0] = 0;
        regs[16] = 0x00000000; // Z not set
        //regs[16] = 0x40000000; // Z bit set

        handler(0x00000000 /* EQ */, regs);
        t.equal(regs[0], 0);
        handler(0x10000000 /* NE */, regs);
        t.equal(regs[0], 1);
        t.end();
    });
    t.test('the retunred expressions reflect a real CPUs behaviour', function(t) {
        t.test('non-specialised', function(t) {
            var node = new ConditionalNode();
            for (var cpsr = 0; cpsr < 16; cpsr++) {
                for (var cond = 0; cond < 16; cond++) {
                    /* jshint -W054 */
                    var expression = node.createCondition('cpsr');
                    var f = new Function('cpsr', 'instruction', 'return ' + expression);
                    if (matrix[cpsr][cond] === 'X') {
                        t.ok(f(cpsr << 28, cond << 28), cpsr.toString(16) + cond.toString(16));
                    } else {
                        t.notOk(f(cpsr << 28, cond << 28), cpsr.toString(16) + cond.toString(16));
                    }
                }
            }
            t.end();
        });
        t.test('specialised', function(t) {
            var node = new ConditionalNode();
            for (var cpsr = 0; cpsr < 16; cpsr++) {
                for (var cond = 0; cond < 16; cond++) {
                    var exp = node.createCondition('cpsr', {Cond: cond});
                    /* jshint -W054 */
                    var f = new Function('cpsr', 'return ' + exp);
                    if (matrix[cpsr][cond] === 'X') {
                        t.ok(f(cpsr << 28), cpsr.toString(16) + cond.toString(16));

                    } else {
                        t.notOk(f(cpsr << 28), cpsr.toString(16) + cond.toString(16));
                    }
                }
            }
            t.end();
        });
        t.end();
    });
    t.end();
});
