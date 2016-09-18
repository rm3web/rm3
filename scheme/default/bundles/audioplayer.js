var React = require('react');
var ReactDOM = require('react-dom');
import Wavesurfer from 'react-wavesurfer';

class AudioPlayerComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      playing: false,
      pos: 0
    };
    this.handleTogglePlay = this.handleTogglePlay.bind(this);
    this.handlePosChange = this.handlePosChange.bind(this);
  }
  handleTogglePlay() {
    this.setState({
      playing: !this.state.playing
    });
  }
  handlePosChange(e) {
    this.setState({
      pos: e.originalArgs[0]
    });
  }
  render() {
    var playOrPause;
    if (this.state.playing) {
      playOrPause = (<picture className="pure-u-1-1"><source srcSet="/resources/images/pause.svg" type="image/svg+xml" /><img srcSet="/resources/images/pause-75.png"  height="75" width="75" border="0" /></picture>);
    } else {
      playOrPause = (<picture className="pure-u-1-1"><source srcSet="/resources/images/play.svg" type="image/svg+xml" /><img srcSet="/resources/images/play-75.png"  height="75" width="75" border="0" /></picture>);
    }
    var roundedPos = Math.round(this.state.pos);
    return (
      <div className="pure-g">
        <div className="pure-u-1-8">
          <div style={{margin: ".5em"}}>
            <a onClick={this.handleTogglePlay}>{playOrPause}</a>
            {roundedPos} s
            </div>
            </div>
        <div className="pure-u-7-8">
          <Wavesurfer
            audioFile={this.props.audio}
            pos={this.state.pos}
            onPosChange={this.handlePosChange}
            playing={this.state.playing} />
        </div>
      </div>
    );
  }
}

var renderTarget = document.getElementById('audioplayer');
var PathFactory = React.createFactory(AudioPlayerComponent);

var renderedComponent = ReactDOM.render(
  PathFactory({
    locales: intl.locales,
    messages: intl.messages,
    audio: audio
  }),
  renderTarget
);