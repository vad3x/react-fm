import React, { Component } from 'react';
import ReactDOM from 'react-dom';
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
        smoothingTimeConstant: React.PropTypes.number
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
        smoothingTimeConstant: 0.95
    };

    componentDidMount() {
        this._frequencyNode = ReactDOM.findDOMNode(this.refs.frequency);
    }

    componentWillUpdate(nextProps) {
        const { audioSource } = nextProps;

        if (this._audioAnalyser && audioSource !== this.props.audioSource) {
            this._audioAnalyser.disconnect();

            clearInterval(this._playingInterval);
            this._audioAnalyser = null;
        }

        if (audioSource && audioSource !== this.props.audioSource) {
            this._audioAnalyser = createAnalyzer(nextProps);

            const { latency, width, height } = nextProps;

            this._playingInterval = startTimer(
                {
                    audioSource,
                    audioAnalyser: this._audioAnalyser,
                    latency,
                    width,
                    height,
                    domNode: this._frequencyNode
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

        const scale = ((maxv - minv) / (maxp - minp));

        const freqGrid = plotFreqGrid({ grid, minv, minp, scale, height });
        const freqLabels = plotFreqLabelGrid({ labelGrid, minv, minp, scale, height });
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
                <path fill="transparent" ref="frequency"></path>
            </svg>
        );
    }
}

function plotFreqGrid({ grid, minv, minp, scale, height }) {
    const freqGrid = [];
    for (const f of grid) {
        const x = Math.ceil((Math.log(f) - minv) / scale + minp);

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

function plotFreqLabelGrid({ labelGrid, minv, minp, scale }) {
    const freqLabels = [];
    for (const f of labelGrid) {
        const x = Math.ceil((Math.log(f) - minv) / scale + minp) - 10;

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

    const scale = (maxv - minv) / (maxp - minp);

    const dbGrid = [];
    for (const f of grid) {
        const y = maxp - Math.ceil((f - minv) / scale + minp);

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

function createAnalyzer({ audioSource, fftSize, dbAxis, smoothingTimeConstant }) {
    if (!audioSource) {
        throw new Error('audioSource is expected');
    }

    const { min, max } = dbAxis;
    const audioAnalyser = audioSource.context.createAnalyser();

    audioAnalyser.fftSize = fftSize;
    audioAnalyser.minDecibels = min;
    audioAnalyser.maxDecibels = max;
    audioAnalyser.smoothingTimeConstant = smoothingTimeConstant;

    audioSource.connect(audioAnalyser);

    return audioAnalyser;
}

function startTimer({ audioSource, audioAnalyser, latency, width, height, domNode }) {
    const playingInterval = setInterval(
            renderFrame.bind(this, audioAnalyser, width, height, domNode),
            latency);

    /* eslint-disable no-param-reassign */
    audioSource.onended = () => {
        clearInterval(playingInterval);
    };

    return playingInterval;
}

function renderFrame(analyser, width, height, domNode) {
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    const frameParams = {
        min: 1,
        max: frequencyData.length,
        width,
        height,
        data: frequencyData,
        node: domNode
    };

    plotGraphLog(frameParams);
}

function plotGraphLog({ min, max, width, height, data, node }) {
    const minp = 0;
    const maxp = width;

    let stringValue = `M0,${height}`;

    const minv = Math.log(min);
    const maxv = Math.log(max);

    const scale = ((maxv - minv) / (maxp - minp));

    for (let i = 0; i < data.length; i++) {
        const value = data[i];

        let x = 0;

        if (i) {
            x = (Math.log(i) - minv) / scale + minp;
        }

        const h = (height * value) / 256;
        const y = height - h;

        stringValue += `L${x},${y}`;
    }

    node.setAttribute('d', `${stringValue}Z`);
}
