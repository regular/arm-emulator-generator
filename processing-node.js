var extend = require('extend');

var ConditionalNode = require('./conditional-node');
var operatorNames = require('./arm-operator-names');

// abstract base class for all ARM32
// data processing instructions
function ProcessingNode() {
    this.mask = 0x0C000000;
    this.value = 0x00000000;
}

ProcessingNode.prototype = new ConditionalNode();
extend(ProcessingNode.prototype.layout, {
    OpCode:     [0x01E00000, 21],
    S:          [0x00100000,  0], // whether CPSR flags shoild be set by the operation
    Rn:         [0x000F0000, 16],
    Rd:         [0x0000F000, 12]
});

ProcessingNode.prototype.createUnconditionalHandler = function(ops, regs, rhs) {
    throw new Error('ProcessingNode is an abstract Node');
};

// create code for a JS statement that performs an instruction's OpCode. Actual operation code
// generation is delegated to methods called createXXX[S], where XXX is the name of the operator;
// the S postfix is used for operations that set the CPRS flags (ADDS for example)

// Sub classes call this to create their handlers once
// they've figured out RHS.
ProcessingNode.prototype._createProcessingHandler = function(ops, regs, rhs) {
    ops = ops || {};
    var Rd = ops.Rd || this.createExtractor('Rd');
    var Rn = ops.Rn || this.createExtractor('Rn');
    var dest = regs + '[' + Rd + ']';
    var lhs =  regs + '[' + Rn + ']';
    var code;

    function _getOperatorCode(opCode, S) {
        var opName = operatorNames[opCode] + (S ? 'S' : '');
        var createFunctionName = 'create' + opName;
        if (typeof this[createFunctionName] === 'undefined') {
            return 'throw new Error("arm32 operator not implemented:' + opName + '");';
        } else {
            return this[createFunctionName](ops, regs, dest, lhs, rhs);
        }
    }
    getOperatorCode = _getOperatorCode.bind(this);
   
    function _getSwitch(S) {
        var code = 'switch(' + this.createExtractor('OpCode') + ') {\n';
        for(var i=0; i<16; ++i) {
            code += 'case ' + i + ': ';
            code += getOperatorCode(i, S);
            code += 'break;\n';
        }
        code += '}\n';
        return code;
    }
    getSwitch = _getSwitch.bind(this);

    if (typeof ops.OpCode === 'undefined') {
        // create a generic handler
        if (typeof ops.S === 'undefined') {
            code = 'if (' + this.createExtractor('S') + ') {\n' +
                getSwitch(true) +
                '\n} else {\n' +
                getSwitch(false) +
                '\n}';
            return code;
        } else {
            return getSwitch(ops.S);
        }
    } else {
        // create OpCode-specific handler
        var createFunctionName = 'create' + operatorNames[ops.OpCode];
        if (typeof ops.S === 'undefined') {
            code = 'if (' + this.createExtractor('S') + ') {' +
                getOperatorCode(ops.OpCode, true) +
                '} else {' +
                getOperatorCode(ops.OpCode, false) +
                '}';
            return code;
        } else {
            return getOperatorCode(ops.OpCode, ops.S);
        }
    }
};

module.exports = ProcessingNode;
