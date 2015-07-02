var SP = 13;
var LR = 14;
var PC = 15;
var CPSR = 16;
var SPSR = 17;

var USER_MODE = 0;
var FIQ_MODE = 1; // TODO: this is actually incorrect

var regUserMode = {};
regUserMode.reset = function() {
    // initialize 17 registers
    // r0 to r12
    // r13 (sp) -- stack pointer
    // r14 (lr) -- return address
    // r15 (pc) -- program counter
    // r16 cpsr - current program state register
    for(var i=0; i<17; i++) {
        this[i] = 0|0;
    }
};

var regFIQMode = Object.create(regUserMode);
regFIQMode.reset = function() {
    // shadow r8 to r14 and add 
    // r17 spsr
    for(var i=8; i<15; i++) {
        this[i] = 0|0;
    }
    this[17] = 0|0;
};

var cpu = {
    modeRegs: [regUserMode, regFIQMode],
    reset: function() {
        this.modeRegs.forEach(function(mr) {mr.reset();});
        this.regs = this.modeRegs[USER_MODE]; // TODO
    },
    mode: function(index) {
        index = index|0;
        // store PC in LR
        this.regs[LR] = this.regs[PC];
        // change set of registers
        this.regs = this.modeRegs[index];
        // store CPSR to SPSR
        this.regs[SPSR] = this.regs[CPSR];
        // set mode flags (bits 0 to 4)
        this.regs[CPSR] &= 0xFFFFFFE0;
        this.regs[CPSR] |= index;
    }
};

cpu.reset();

repl = require("repl");
r = repl.start("node> ");
r.context.cpu = cpu;

