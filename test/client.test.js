require('./helpers');

var fs = require('fs');
var path = require('path');
var vm = require('vm');

describe('Client calculator', function () {
    it('uses block-scoped variable declarations', function () {
        var client = fs.readFileSync(path.join(__dirname, '..', 'public', 'client.js'), 'utf8');

        expect(client).not.to.match(/\bvar\b/);
    });

    it('renders a power button in the calculator UI', function () {
        var html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

        expect(html).to.include('<button class="btn" onClick="operationPressed(\'^\')">x<sup>y</sup></button>');
    });

    it('calculates powers client-side without calling the arithmetic API', function () {
        var resultElement = { innerHTML: '' };
        var context = {
            location: { origin: 'http://localhost' },
            document: {
                addEventListener: function () {},
                getElementById: function (id) {
                    if (id == 'result') {
                        return resultElement;
                    }

                    if (id == 'loading') {
                        return { style: { visibility: 'hidden' } };
                    }

                    return null;
                },
                querySelectorAll: function () {
                    return [];
                }
            },
            XMLHttpRequest: function () {
                throw new Error('XMLHttpRequest should not be used for power calculations');
            },
            Math: Math
        };

        vm.runInNewContext(
            fs.readFileSync(path.join(__dirname, '..', 'public', 'client.js'), 'utf8'),
            context
        );

        context.calculate(2, 3, '^');

        expect(vm.runInNewContext('value', context)).to.equal(8);
        expect(vm.runInNewContext('state', context)).to.equal(vm.runInNewContext('states.complete', context));
        expect(resultElement.innerHTML).to.include('digit8');
    });
});
