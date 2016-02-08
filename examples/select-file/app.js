/* eslint-disable react/jsx-no-bind */

import React, { Component } from 'react';
import { render } from 'react-dom';
import FrequencyMeter from 'react-fm';

class App extends Component {
    static propTypes = {
        audioContext: React.PropTypes.object
    };

    static defaultProps = {
        audioContext: new AudioContext()
    };

    constructor(props) {
        super(props);
        this.state = {
            audioSource: null,
            audioBuffer: null
        };
    }

    componentDidMount() {
    }

    play() {
        const { audioContext } = this.props;
        const { audioBuffer } = this.state;

        if (audioBuffer) {
            this.stop();

            const audioSource1 = audioContext.createBufferSource();

            this.setState({ audioSource: audioSource1 });

            audioSource1.buffer = audioBuffer;

            audioSource1.connect(audioContext.destination);

            audioSource1.start(0, 0);
        }
    }

    stop() {
        const { audioSource } = this.state;

        if (audioSource) {
            this.state.audioSource.disconnect();
            this.setState({ audioSource: null });
        }
    }

    handleChange(event) {
        this.setState({ fileName: event.target.value });
    }

    loadFile() {
        if (!this.state.fileName) {
            return;
        }

        getAudio(this.state.fileName, (data) => {
            this.props.audioContext.decodeAudioData(data, (audioBuffer) => {
                this.setState({ audioBuffer });
            });
        });
    }

    render() {
        return (
            <div>
                <input value={this.state.fileName} onChange={this.handleChange.bind(this)} />
                <button onClick={this.loadFile.bind(this)}>Load</button>
                <button onClick={this.play.bind(this)} disabled={!this.state.audioBuffer}>
                    Play
                </button>
                <button onClick={this.stop.bind(this)} disabled={!this.state.audioBuffer}>
                    Stop
                </button>
                <FrequencyMeter
                    audioContext={this.props.audioContext}
                    audioSource={this.state.audioSource}
                />
            </div>);
    }
}

function getAudio(fileName, callback) {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
        callback(xhr.response);
    };

    xhr.open('GET', fileName, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
}

render(<App />, document.getElementById('example'));
