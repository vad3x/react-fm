import React, { Component } from 'react';
import './FrequencyMeter.module.less';

const LEGEND_FONT_SIZE = 8;

export default class FrequencyMeter extends Component {
    static propTypes = {
        audioSource: React.PropTypes.object,
        width: React.PropTypes.number,
        height: React.PropTypes.number,
        bandsCount: React.PropTypes.number,
        latency: React.PropTypes.number,
        fftSize: React.PropTypes.number,
        freqAxis: React.PropTypes.object,
        dbAxis: React.PropTypes.object,
        smoothingTimeConstant: React.PropTypes.number,
        processingKind: React.PropTypes.oneOf(['Regular', 'Stereo', 'MidSide'])
    };

    static defaultProps = {
        audioSource: null,
        width: 800,
        height: 300,
        bandsCount: 1024,
        latency: 20,
        fftSize: 1024 * 2,
        freqAxis: {
            min: 20,
            max: 23000,
            grid: [50, 100, 200, 500, 1000, 2000, 5000, 10000],
            labelGrid: [40, 100, 200, 400, 600, 1000, 2000, 4000, 6000, 10000]
        },
        dbAxis: {
            min: -100,
            max: 0,
            grid: [-80, -60, -40, -20],
            labelGrid: []
        },
        smoothingTimeConstant: 0.95,
        processingKind: 'Stereo'
    };

    componentDidMount() {
    }

    componentWillUpdate(nextProps) {
        const { audioSource } = nextProps;

        if (this._audioAnalysers && audioSource !== this.props.audioSource) {
            for (const analyser of this._audioAnalysers) {
                analyser.disconnect();
            }

            clearInterval(this._playingInterval);
            this._audioAnalysers = null;
        }

        if (audioSource && audioSource !== this.props.audioSource) {
            this._audioAnalysers = createAnalyzers(nextProps);

            const { latency, width, height, fftSize } = nextProps;
            const ratio = calcRatio(Math.log(1), Math.log(fftSize / 2), 0, width);

            this._playingInterval = startTimer(
                {
                    audioSource,
                    audioAnalysers: this._audioAnalysers,
                    processingKind: nextProps.processingKind,
                    latency,
                    height,
                    ratio,
                    channelDoms: [this.refs['channel-0'], this.refs['channel-1']]
                });
        }
    }

    render() {
        const { width, height, freqAxis, dbAxis } = this.props;
        const { min, max, grid, labelGrid } = freqAxis;

        const minp = 0;
        const maxp = width;

        const minv = Math.log(min);
        const maxv = Math.log(max);

        const scale = calcRatio(minv, maxv, minp, maxp);

        const freqGrid = plotFreqGrid({ grid, scale, height });
        const freqLabels = plotFreqLabelGrid({ labelGrid, scale });
        const dbGrid = plotDbLabelGrid({
            min: dbAxis.min,
            max: dbAxis.max,
            grid: dbAxis.grid,
            height });

        return (
            <svg className="frequency-meter" height={height} width={width}>
                {freqGrid}
                {freqLabels}
                {dbGrid}
                <path className="channel-0" fill="transparent" ref="channel-0"></path>
                <path className="channel-1" fill="transparent" ref="channel-1"></path>
            </svg>
        );
    }
}

/**
 * Creates a ratio instance.
 *
 * @maxValue {number} Max value.
 * @minValue {number} Min value.
 * @maxBound {number} Max bound size
 * @minBound {number} Min bound size
 * @return {Scale} The new Scale object.
 */
export function calcRatio(minValue, maxValue, minBound, maxBound) {
    const value = (maxValue - minValue) / (maxBound - minBound);

    return {
        maxValue,
        minValue,
        maxBound,
        minBound,
        value
    };
}

export function scaleValue(value, scale) {
    return Math.ceil((value - scale.minValue) / scale.value + scale.minBound);
}

/**
 * Gets path data that fits to the rectangle box, ex. M0,12L1,0Z.
 * It gets histogram data array and represents it logariphmic.
 *
 * @ratio {ratio} ratio
 * @height {number} Box height
 * @frequencyBinCount {number} Number of points
 * @channelsData {array[]} Min bound size
 * @maxValue {number} Max value
 * @return {string[]} Array of String representation of channel data.
 */
export function getLogPathData({
    ratio,
    height,
    channelsData,
    maxValue
}) {
    const channelStringValues = [];
    const numberOfChannels = channelsData.length;

    for (let index = 0; index < numberOfChannels; index++) {
        channelStringValues[channelStringValues.length] = `M0,${height}`;
    }

    for (let index = 0; index < numberOfChannels; index++) {
        const data = channelsData[index];
        for (let i = 0; i < data.length; i++) {
            const value = data[i];

            let x = 0;

            if (i) {
                x = scaleValue(Math.log(i), ratio);
            }

            const y = height - height * value / maxValue;

            channelStringValues[index] += `L${x},${y}`;
        }
    }

    for (let index = 0; index < numberOfChannels; index++) {
        channelStringValues[index] = `${channelStringValues[index]}Z`;
    }

    return channelStringValues;
}

function plotFreqGrid({ grid, scale, height }) {
    const freqGrid = [];
    for (const f of grid) {
        const x = scaleValue(Math.log(f), scale);

        const line = (
            <line
                key={f}
                strokeWidth="1"
                x1={x}
                x2={x}
                y1={0}
                y2={height}
            >
            </line>
            );

        freqGrid.push(line);
    }

    return freqGrid;
}

function plotFreqLabelGrid({ labelGrid, scale }) {
    const freqLabels = [];
    for (const f of labelGrid) {
        const x = scaleValue(Math.log(f), scale) - 10;

        const text = (
            <text
                key={f}
                x={x}
                y={LEGEND_FONT_SIZE}
            >
            {f < 1000 ? f : `${f / 1000}k`}
            </text>);

        freqLabels.push(text);
    }


    return freqLabels;
}

function plotDbLabelGrid({ min, max, grid, height }) {
    const minp = 0;
    const maxp = height;

    const minv = min;
    const maxv = max;

    const scale = calcRatio(minv, maxv, minp, maxp);

    const dbGrid = [];
    for (const f of grid) {
        const y = maxp - scaleValue(f, scale);

        const text = (
            <text
                key={f}
                x={0}
                y={y + LEGEND_FONT_SIZE / 2}
            >
            {Math.abs(f)}
        </text>);

        dbGrid.push(text);
    }

    return dbGrid;
}

function createAnalyzers({ audioSource, fftSize, dbAxis, smoothingTimeConstant, processingKind }) {
    if (!audioSource) {
        throw new Error('audioSource is expected');
    }

    const { min, max } = dbAxis;

    switch (processingKind) {
        case 'Regular':
            {
                const audioAnalyser = audioSource.context.createAnalyser();

                audioAnalyser.fftSize = fftSize;
                audioAnalyser.minDecibels = min;
                audioAnalyser.maxDecibels = max;
                audioAnalyser.smoothingTimeConstant = smoothingTimeConstant;

                audioSource.connect(audioAnalyser);

                return [audioAnalyser];
            }
        case 'Stereo':
        case 'MidSide':
            {
                const splitter = audioSource.context.createChannelSplitter(2);
                audioSource.connect(splitter);

                const audioAnalyser0 = audioSource.context.createAnalyser();

                audioAnalyser0.fftSize = fftSize;
                audioAnalyser0.minDecibels = min;
                audioAnalyser0.maxDecibels = max;
                audioAnalyser0.smoothingTimeConstant = smoothingTimeConstant;

                const audioAnalyser1 = audioSource.context.createAnalyser();
                audioAnalyser1.fftSize = fftSize;
                audioAnalyser1.minDecibels = min;
                audioAnalyser1.maxDecibels = max;
                audioAnalyser1.smoothingTimeConstant = smoothingTimeConstant;

                splitter.connect(audioAnalyser0, 0, 0);
                splitter.connect(audioAnalyser1, 1, 0);

                return [audioAnalyser0, audioAnalyser1];
            }
        default:
            throw new Error('Not implemented');
    }
}

function startTimer({
    audioSource,
    audioAnalysers,
    processingKind,
    latency,
    height,
    ratio,
    channelDoms
}) {
    const playingInterval = setInterval(
        renderFrame.bind(this, audioAnalysers, processingKind, height, ratio, channelDoms),
        latency);

    /* eslint-disable no-param-reassign */
    audioSource.onended = () => {
        clearInterval(playingInterval);
    };

    return playingInterval;
}

function renderFrame(analysers, processingKind, height, ratio, channelDoms) {
    const frequencyDatas = [];
    for (const analyser of analysers) {
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
        frequencyDatas[frequencyDatas.length] = frequencyData;
    }

    switch (processingKind) {
        case 'Regular':
        case 'Stereo':
            {
                break;
            }
        case 'MidSide':
            {
                for (let i = 0; i < frequencyDatas[0].length; i++) {
                    const leftChannelValue = frequencyDatas[0][i];
                    const rightChannelValue = frequencyDatas[1][i];

                    // Mid
                    const mid = Math.min(leftChannelValue, rightChannelValue);
                    frequencyDatas[0][i] = mid;

                    // Side
                    const side = Math.abs(leftChannelValue - rightChannelValue);
                    frequencyDatas[1][i] = side;
                }
                break;
            }
        default:
            throw new Error('Not implemented');
    }

    const frameParams = {
        ratio,
        height,
        channelsData: frequencyDatas,
        maxValue: 255
    };

    const data = getLogPathData(frameParams);
    for (var i = 0; i < channelDoms.length; i++) {
        channelDoms[i].setAttribute('d', data[i]);
    }
}
