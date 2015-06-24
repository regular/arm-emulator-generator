// define mask and value to categorize opcodes
// if (opcoade & mask) === value, the operation
// falls into that category.
// Taken from http://www.peter-cockerell.net/aalp/html/frames.html

var categories = [
    [0x0C000000, 0x00000000, dataProcessing],
    [0x0E000000, 0x0A000000, branching],
    [0x0FC000F0, 0x00000090, multiplication],
    [0x0C000000, 0x04000000, singleDataTransfer],
    [0x0E000000, 0x08000000, blockDataTransfer],
    [0x0F000000, 0x0F000000, softwareInterrupt],
    [0x0F000010, 0x0E000000, coproDataOp],
    // coproDataTransfer?
    [0x0F000010, 0x0E000010, coproRegisterXfer],
    [0x0F000090, 0x01000090, undefined],
    [0x0E000010, 0x06000010, undefined]
];

var branching = null;
var multiplication = null;
var singleDataTransfer = null;
var blockDataTransfer = null;
var softwareInterrupt = null;
var coproDataOp = null;
var coproRegisterXfer = null;

function ROR(v, n) {
    // from https://github.com/fxa/uint32.js/blob/master/uint32.js
    return (((v) >>> (n)) | ((v) << (32 - n)) >>> 0) >>> 0;
}

function jsForAND() {
    return 'var result = (lhs & rhs) >>> 0';
}

function jsForTST() {
    return 'var result = (lhs & rhs) >>> 0';
}

function jsForBIC() {
    return 'var result = (lhs & ~rhs) >>> 0';
}

function jsForORR() {
    return 'var result = (lhs | rhs) >>> 0';
}

function jsForEOR() {
    return 'var result = (lhs ^ rhs) >>> 0';
}

function jsForTEQ() {
    return 'var result = (lhs ^ rhs) >>> 0';
}

function jsForMOV() {
    return 'var result = rhs;';
}

function jsForMVN() {
    return 'var result = ~(rhs);';
}

// --

function ADD(dest, lhs, rhs) {
    return dest + ' = (('+ lhs +') + ('+ rhs +')) >>> 0;';
}

function jsForADD(setFlags) {
    var s = 'var result = lhs + rhs + ((this.reg[16] & 0x20000000) !== 0);';
    
    if (setFlags) {
        s += 'var flags = this.regs[16] >>> 28;';
        // clear carry
        s += 'flags &= 0xd;';
        s += 'flags |= (result > 0xffffffff;) << 2;';
    }
    s += 'result = result >>> 0;';
}

function jsForSetConditions() {
    // set N Z C V (upper for bits or reg16)
    // according to `result`
    var s = '';
    
    // N is set if result < 0 
    s += 'this.regs[16] |= (((result < 0) << 31) >>> 0);';

    // Z is set if result === 0
    s += 'this.regs[16] |= (((result === 0) << 30) >>> 0);';
    return s;
}

// generates source code lines
// that change the CPU state
// like the arm32 instruction would change
// a real CPU's state.
// The resulting code will be called with
// this - the CPU object
// r - CPU register's (current mode)
function dataProcessing(instruction) {
    var lines = [];
    var Rn = (instruction & 0x000F0000) >>> 16;
    var lhs = 'r[' + Rn + ']|0';
    var rhs;

    var immediate = (instruction & 0x02000000)|0;
    if (immediate) {
        var shift = (instruction & 0x00000F00) >>> 7; // if shift by 7 instead of 8 to have shift*2
        var value = instruction & 0x000000FF;
        rhs = ROR(value, shift) + '|0'; // actually: shift*2, see above
        // doc says: carry is more or less undefined now.
    } else {
        // shift op: bit 6, 5
        var shiftOpIndex = (instruction & 0x00000060) >>> 5;
        var shiftOps = ['LSL', 'LSR', 'ASR', 'ROR'];
        var shiftOp = shiftOps[shiftOpIndex];

        // isByReg: bit 4
        var isByReg = (instruction & 0x00000010)|0;
        var shiftCount;
        if (isByReg) {
            // if byReg, reg nbr: bit 11 - 8, bit 7 == 0
            var shiftCountReg = (instruction & 0x0000F00) >>> 8;
            shiftCount = 'r[' + shiftCountReg + ']|0';
        } else {
            // shift count: bit 11 - 7
            shiftCount = (instruction & 0x00000f80) >>> 7;
            
            // if shift-op = 11 and shift count == 0 --> RRX
            if (shiftCount === 0) {
                if (shiftOpIndex === 3) {
                    shiftOp = RRX;
                } else {
                    shiftOp = null;
                }
            }
        }

        // rhs register number: bit 3 to 0
        var reg = (instruction & 0xF)|0;

        if (shiftOp) {
            rhs = 'this.' + shiftOp + '(r[' + reg + ']|0, ' + shiftCount + ')|0';
        } else {
            rhs = 'r[' + reg + ']|0';
        }
        // TODO: shiftops also affect Carry flag in CPSR if 
        // setConditions is set
    }

    var setConditions = (instruction & 0x00100000)|0;

    var opcode = (instruction & 0x01E00000) >>> 21;
    var Rd = (instruction & 0x0000F000) >>> 12;

    var operators = [
        'AND', 'EOR', 'SUB', 'RSB', 
        ADD, 'ADC', 'SBC', 'RSC', 
        'TST', 'TEQ', 'CMP', 'CMN', 
        'ORR', 'MOV', 'BIC', 'MVN'
    ];
    var operator = operators[opcode];

    lines.push(operator('r[' + Rd + ']', lhs, rhs));

    // TODO: always setConditions for
    // TST, TEQ
    if (setConditions) {
        // TODO: this only sets N and Z
        // do V!
        lines.push(jsForSetConditions());
    }

    // TODO: never write result for
    // TST, TEQ
    return lines;
}


function jsForConditions(conditions) {
    return '// Conditiions not implemented';
}

function jit(opcode) {
    var lines = [];
    lines.push('\n// 0x' + opcode.toString(16));
    lines.push('var r = this.regs;');
    // Extract conditions
    var conditions = opcode & 0xf0000000;
    lines.push(jsForConditions(conditions));

    // Find category handler
    var handler = null;
    categories.forEach(function(entry) {
        if ((opcode & entry[0]) === entry[1]) {
            handler = entry[2];
        }
    });

    // Call category-specific code-generator
    lines = lines.concat(handler(opcode));
    return lines.join('\n');
}

console.log(jit(0xe2810eff));
console.log(jit(0xe0810f0f)); // add r0, r1, pc, lsl #30
console.log(jit(0xe081041f)); // add r0, r1, pc, lsl r4
