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
    Immediate:  [0x02000000,  0], // bools don't need to be shifted
    OpCode:     [0x01E00000, 21],
    SetFlags:   [0x00100000,  0],
    Rn:         [0x000F0000, 16],
    Rd:         [0x0000F000, 12]
});

// create code for a JS statement that performs an instruction's OpCode. Actual operation code
// generation is delegated to methods called createXXX, where XXX is the name of the operand.
// These createXXX methods are defined in sub-classes.
ProcessingNode.prototype.createUnconditionalHandler = function(ops, regs) {
    ops = ops || {};
    var fields  = this.createMissingExtractors(ops);
    if (typeof ops.OpCode === 'undefined') {
        // create a generic handler
        var code = 'switch(' + fields.OpCode + ') {\n';
        for(var i=0; i<16; ++i) {
            code += 'case ' + i + ': ';
            var createFunctionName = 'create' + operatorNames[i];
            if (typeof this[createFunctionName] === 'undefined') {
                code += 'throw new Error("arm32 operator not implemented.");';
            } else {
                code += this[createFunctionName](fields, regs);
            }
            code += 'break;\n';
        }
        code += '}\n';
        return code;
    } else {
        // create OpCode-specific handler
        return this['create' + operatorNames[ops.OpCode]](fields, regs);
    }
};

module.exports = ProcessingNode;
