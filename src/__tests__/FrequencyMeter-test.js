jest.dontMock('../FrequencyMeter');

describe('FrequencyMeter', () => {
    it('calculate ratio', () => {
        var calcRatio = require('../FrequencyMeter').calcRatio;

        const minValue = 10;
        const maxValue = 100;
        const minBound = 0;
        const maxBound = 50;

        const ratio = calcRatio(minValue, maxValue, minBound, maxBound);

        expect(ratio.minValue).toBe(minValue);
        expect(ratio.maxValue).toBe(maxValue);
        expect(ratio.minBound).toBe(minBound);
        expect(ratio.maxBound).toBe(maxBound);
        expect(ratio.value).toBe(1.8);
    });

    it('ratio value', () => {
        var scaleValue = require('../FrequencyMeter').scaleValue;

        const value = 14;

        const minValue = 10;
        const maxValue = 100;
        const minBound = 0;
        const maxBound = 50;

        const ratio = {
            minValue,
            maxValue,
            minBound,
            maxBound,
            value: 1.8
        };

        const scaledValue = scaleValue(value, ratio);

        expect(scaledValue).toBe(3);
    });

    it('get log path data', () => {
        var getLogPathData = require('../FrequencyMeter').getLogPathData;

        const logPathData = getLogPathData({
            width: 10,
            height: 100,
            data: [0, 8, 16, 32, 64, 255],
            maxValue: 255
        });

        expect(logPathData)
        .toBe('M0,100L0,100L0,96.86274509803921L4,'
            + '93.72549019607843L7,87.45098039215686L8,74.90196078431373L9,0Z');
    });
});
