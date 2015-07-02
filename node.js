// An instance of Node
//
// - defines one machine code instruction bit-layout
// 
// - defines a pattern (consitsing of `mask` & `value`) that can be
//   used to test whether an instruction matches that layout.
//   
// - can create code for a function (called `handler`) that can
//   perform all instructions that conform with that layout. The
//   code generator either generates code that extracts operands
//   from the instruction, or takes operand values via an optional
//   object argument
//
// - has SubNodes
//
// - can create a SubNode that has a more narrow pattern and
//   a more specific handler
//
// - can find the most specialised decendant Node for a given
//   instruction
//
// - counta how many time its handler was invoked
//

module.exports = Node;

function Node() {
    // by default, match everything
    this.mask = 0x0;
    this.value = 0x0;
    this.children = [];
}

Node.prototype.findNode = function(instruction) {
    for (var i=0, l = this.children.length; i<l; ++i) {
        if ((instruction & this.children[i].mask) === this.children[i].value) {
            return this.children[i].findNode(instruction);
        }
    }
    // we could not find any more specialised Node
    return this;
};

// create code that extracts a n-bit unsigned integer value (the 'operand')
// as defined in the layout object) from a 32 bit unsigned integer.
// if this.countingFilter is set, generate code that calls that function
// with the extracted value and the operand's name.
Node.prototype.createExtractor = function(name) {
    var bitPos = this.layout[name];
    var mask = bitPos[0];
    var shift = bitPos[1];
    var code = "((instruction & "+mask+") >>> "+shift+")";
    if (typeof this.countingFilter !== 'undefined') { // measure operand value frequency
      return "this.countingFilter(" + code + ", '" + name + "');";
    } else {
      return code;
    }
};