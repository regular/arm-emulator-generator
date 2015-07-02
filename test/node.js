var test = require('tape');
var Node = require('../node');

test('finddNode should return the most specialised sub node', function(t) {
    t.test('returns istself when it has no children', function(t) {
        var parent = new Node();
        parent.mask = '0x80000000';
        parent.value = '0x8000000';

        t.equal(parent.findNode(0), parent);
        t.end();
    });
    t.test('returns istself when no childreni matches', function(t) {
        var parent = new Node();
        parent.mask = 0x80000000;
        parent.value = 0x8000000;

        var child = new Node();
        child.mask = 0x0f;
        child.value = 0x0f;
        parent.children.push(child);

        t.equal(parent.findNode(0), parent);
        t.equal(parent.findNode(0x0f), child);
        t.end();
    });
    t.test('returns most specialised ancestor', function(t) {
        var parent = new Node();
        parent.mask = 0x80000000;
        parent.value = 0x8000000;

        var child = new Node();
        child.mask = 0x0f;
        child.value = 0x0f;
        parent.children.push(child);

        var gchild = new Node();
        gchild.mask = 0x1f;
        gchild.value = 0x1f;

        t.equal(parent.findNode(0), parent);
        t.equal(parent.findNode(0x0f), child);
        t.equal(parent.findNode(0x1f), child);
        child.children.push(gchild);
        t.equal(parent.findNode(0x1f), gchild);
        child.children.push(gchild);
        t.end();
    });
    t.end();
});


test('createExtractor', function(t) {
    var node = new Node();
    node.layout = {
        S: [0x03000000, 24],
        X: [0x00000007, 0]
    };
    t.test('extracts the bits as specified in layout', function(t) {
        /*jshint -W054 */
        var extractS = new Function('instruction', 'return ' + node.createExtractor('S'));
        var extractX = new Function('instruction', 'return ' + node.createExtractor('X'));
        t.equal(extractS(0), 0);
        t.equal(extractS(0xff), 0);
        t.equal(extractS(0x02000000), 2);
        t.equal(extractS(0x02000000), 2);
        t.equal(extractS(0x03000000), 3);
        t.equal(extractS(0x0f000000), 3);

        t.equal(extractX(0), 0);
        t.equal(extractX(0xff), 7);
        t.equal(extractX(0x02000000), 0);
        t.equal(extractX(0x02000001), 1);
        t.equal(extractX(0x03000007), 7);
        t.equal(extractX(0x0f000006), 6);
        t.end();
    });
    t.test('calls countingFilter if present', function(t) {
        var count = 0;
        node.countingFilter = function() {
            ++count;
        };
        /*jshint -W054 */
        var extractS = new Function('instruction', 'return ' + node.createExtractor('S')).bind(node);

        extractS(0);
        t.equal(count, 1);
        extractS(0);
        t.equal(count, 2);
        t.end();
    });
    t.end();
});

