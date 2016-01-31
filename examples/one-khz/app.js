/* eslint-disable react/jsx-no-bind */

import React, { Component } from 'react';
import { render } from 'react-dom';
import FrequencyMeter from 'react-fm';

class App extends Component {
    static propTypes = {
        audioContext: React.PropTypes.object,
        fileName: React.PropTypes.string
    };

    static defaultProps = {
        audioContext: new AudioContext(),
        fileName: '1kHz_44100Hz_16bit_05sec.mp3'
    };

    constructor(props) {
        super(props);
        this.state = {
            audioSource: null,
            audioBuffer: null
        };
    }

    componentDidMount() {
        getAudio(this.props.fileName, (data) => {
            this.props.audioContext.decodeAudioData(data, (audioBuffer) => {
                this.setState({ audioBuffer });
            });
        });
    }

    play() {
        const { audioContext } = this.props;
        const { audioBuffer, audioSource } = this.state;

        if (audioBuffer) {
            if (audioSource) {
                this.stop();

                this.setState({ audioSource: null });
            }

            const audioSource1 = this.props.audioContext.createBufferSource();

            this.setState({ audioSource: audioSource1 });

            audioSource1.buffer = audioBuffer;

            audioSource1.connect(audioContext.destination);

            audioSource1.start(0, 0);
        }
    }

    stop() {
        const { audioSource } = this.state;

        if (audioSource) {
            audioSource.stop();
        }
    }

    render() {
        return (
            <div>
                <button onClick={this.play.bind(this)}>Play</button>
                <button onClick={this.stop.bind(this)}>Stop</button>
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
