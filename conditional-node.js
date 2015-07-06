var Node = require('./node');
var matrix = require('./cond-matrix-16');
var matrixJSON = JSON.stringify(matrix);

// abstract base class for all ARM32 instructions
// (because they all are conditional)
function ConditionalNode() {
    this.layout = {
        Cond: [0xf0000000,28]
    };
}

ConditionalNode.prototype = new Node();

// create code for a JS expression that evaluaes to true
// if the instrcution's condition flags match the CPSR flags
ConditionalNode.prototype.createCondition = function(cpsr, ops) {
    if (typeof ops === 'undefined') ops = {};
    // CPSR high nibble (high to low)
    // 8 N Negative result from ALU flag.
    // 4 Z Zero result from ALU flag.
    // 2 C ALU operation Carried out
    // 1 V ALU operation oVerflowed
    // cond flag meanings

    if (typeof ops.Cond !== 'undefined') {
        // the condition is hard-coded
        cpsr = '((' + cpsr + ') >>> 28)';
        var boolExpressions = [
            // 0000 = EQ - Z4 set (equal)
            cpsr + '&4',
            // 0001 = NE - Z4 clear (not equal)
            '!(' + cpsr + '&4)',
            // 0010 = HS / CS - C2 set (unsigned higher or same)
            cpsr + '&2',
            // 0011 = LO / CC - C2 clear (unsigned lower)
            '!(' + cpsr + '&2)',
            // 0100 = MI -N8 set (negative)
            cpsr + '&8',
            // 0101 = PL - N8 clear (positive or zero)
            '!(' + cpsr + '&8)',
            // 0110 = VS - V1 set (overflow)
            cpsr + '&1',
            // 0111 = VC - V1 clear (no overflow)
            '!(' + cpsr + '&1)',
            // 1000 = HI - C2 set and Z4 clear (unsigned higher)
            '(' + cpsr + '&6)===2',

            // 1001 = LS - C2 clear or Z4 set (unsigned lower or same)
            //'((!(' + cpsr + '&2)) || ('+ cpsr + '&4))',
            //
            // TODO: there seems to be a bug in the
            // documentation. An actual ARM behaves differently.
            // That's why we take the bitmask for now.
            matrix[ops.Cond] + ' & 1 << ' + cpsr,

            // 1010 = GE - N8 set and V1 set, or N8 clear and V1 clear (>or =)
                //case 0xA: return cpsr + '&9===9  || ' + cpsr + '&9===0';
                //case 0xA: return 0010 0000 0001 '1 << (' + cpsr + '&9)';
            '0x201 & 1 << (' + cpsr + '&9)',
            // 1011 = LT - N8 set and V1 clear, or N8 clear and V1 set (>)
            '(' + cpsr + '&9)===8  || (' + cpsr + '&9)===1',
            
            // 1100 = GT - Z4 clear, and either N8 set and V1 set, or N8 clear and V1 set (>)
            //'(' + cpsr + '&5)===1',
            // TODO: there seems to be a bug in the
            // documentation. An actual ARM behaves differently.
            // That's why we take the bitmask for now.
            matrix[ops.Cond] + ' & 1 << ' + cpsr,
    
            // 1101 = LE - Z4 set, or N8 set and V1 clear,or N8 clear and V1 set (<, or =)
                //case 0xD: return cpsr + '&4 || cpsr&9===8 || cpsr&9===1';
                //case 0xD: return '({4,12,5,13,8,1})[' + cpsr + '&0xD]';
                //case 0xD: return '({1,4,5,8,12,13})[' + cpsr + '&0xD]';
                //case 0xD: return '(0100 1100 1000 1100)[' + cpsr + '&0xD]';
                //case 0xD: return '(0011 0001 0011 0010)[' + cpsr + '&0xD]';
            '0x3132 & 1<<(' + cpsr + '&0xD)',
            // 1110 = AL - always
            'true',
            'false'
        ];
        return boolExpressions[ops.Cond];
        //return matrix[ops.Cond] + ' & 1 << ' + cpsr;
    } else {
        // the condition is extracted
        var cond = this.createExtractor('Cond');
        return matrixJSON + '[' + cond + '] & 1 << ((' + cpsr + ') >>> 28)';
    }
};

ConditionalNode.prototype.createHandler = function(ops, regs) {
    var code = 'if (' + this.createCondition(regs+'[16]', ops) + ') {';
    code += this.createUnconditionalHandler(ops, regs) + '}';
    return code;
};

module.exports = ConditionalNode;
