import imgObj from '../../common/imgObj'
import React, {Component} from 'react';
import ApplyButton from '../common/ApplyButton';
import {bindActionCreators} from "redux";
import {showPixelateHandlers} from "../../../actions";
import {connect} from "react-redux";

class Pixelate extends Component {
  constructor(props) {
    super(props);
    this.wasm_img = imgObj.get_wasm_img();
    this.state = {
      blockSize: 7, // min: 3, max: 11, step: 2
    };
    this.region = {
      x: 0, y: 0, width: 0, height: 0,
    };
    this.changeApplied = true;
  }

  pixelate = () => {
    // validity check.
    // x/y/w/h are rounded before passed from PixelateHandlers, it's possible: x + width > imgWidth
    let {x, y, width, height} = this.region;
    let imgWidth = this.props.imgWidth;
    let imgHeight = this.props.imgHeight;
    x = Math.min(Math.max(x, 0), imgWidth - 1);
    y = Math.min(Math.max(y, 0), imgHeight - 1);
    width = Math.min(Math.max(width, 1), imgWidth);
    height = Math.min(Math.max(height, 1), imgHeight);

    if (x + width > imgWidth) {
      width -= x + width - imgWidth // In theory, it's still possible after subtract, width became negative, \
    } // but, not in practice, width/height has minimum value(20px), and the diff between 'x+width' and imgWidth is just 1px because of rounding

    if (y + height > imgHeight) {
      height -= y + height - imgHeight
    }

    this.wasm_img.pixelate(x, y, width, height, this.state.blockSize);
    this.props.redraw();
  };

  componentDidMount = () => this.props.showHandler(true);

  componentWillUnmount = () => {
    this.props.showHandler(false);
    if (!this.changeApplied) {
      this.wasm_img.discard_change();
      this.props.redraw();
    }
  };

  componentDidUpdate = () => { // this only update is handler position, triggered from PixelHandlers by moving handlers
    let x = this.props.position.get('x');
    let y = this.props.position.get('y');
    let width = this.props.position.get('width');
    let height = this.props.position.get('height');

    if (x === this.region.x && y === this.region.y && width === this.region.width && height === this.region.height) {
      return
    }

    this.region.x = x; this.region.y = y; this.region.width = width; this.region.height = height;
    this.changeApplied = false;
    this.pixelate();
  };

  onChange = evt => {
    let tgt = evt.target;
    let changeManner = tgt.dataset.valueChange;
    let blockSize;
    switch (changeManner) {
      case 'up': {
        blockSize = Math.min(this.state.blockSize + 2, 11);
        break;
      }
      case 'down': {
        blockSize = Math.max(this.state.blockSize - 2, 3);
        break;
      }
      case 'set': {
        blockSize = parseInt(tgt.value);
        break;
      }
      default: return
    }

    if (blockSize === this.state.blockSize) {
      return
    }

    this.setState({blockSize}, () => {
      this.changeApplied = false;
      this.pixelate()
    });
  };

  onApply = () => {
    this.changeApplied = true; // this is not necessary, this component is about to be unmounted.
    this.wasm_img.apply_change();
    this.wasm_img.rgb_to_hsi(); // Pixelate is performed on RBG, not HSI, we need to regenerate HSI based on new RGB
    this.props.onSelectTool(''); // to unmount myself.
  };

// the default rect should have a minimum w/h, in case the input img is smaller than this, use img size as rect's w/h
  render() {
    return (
        <div style={{marginBottom: '180x', color: '#CCC'}}>

          <div style={{display: 'flex', alignItems: 'center', marginBottom: '18px'}}>
            <button className={'resize-view-btn btn-plus-minus'} data-value-change="down" onClick={this.onChange}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="white" viewBox="-3 -3 22 22" pointerEvents='none'>
                <path stroke="#525562" d="M9 0a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 17.36A8.34 8.34 0 1 1 17.36 9 8.35 8.35 0 0 1 9 17.36z"/>
                <path d="M13.54 8.68h-9a.35.35 0 0 0 0 .69h9a.35.35 0 1 0 0-.69z"/>
              </svg>
            </button>
            <input type='range' data-value-change="set" min='3' max='11' step='2' value={this.state.blockSize} onChange={this.onChange} />
            <button className={'resize-view-btn btn-plus-minus'} data-value-change="up" onClick={this.onChange}>
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="white" viewBox="-1 -2 23 23" pointerEvents='none'>
                <path stroke="#525562" d="M10.39 0a10.39 10.39 0 1 0 10.38 10.39A10.4 10.4 0 0 0 10.39 0zm0 20A9.59 9.59 0 1 1 20 10.39 9.6 9.6 0 0 1 10.39 20z"/>
                <path d="M15.38 10h-4.59V5.59a.4.4 0 0 0-.8 0V10h-4.6a.4.4 0 1 0 0 .8H10v4.79a.4.4 0 0 0 .8 0v-4.8h4.59a.4.4 0 1 0 0-.8z"/>
              </svg>
            </button>
          </div>

          <ApplyButton onApply={this.onApply}/>
        </div>
    )}
}

const mapStateToProps = state => ({
  position: state.pixelateHandlers.get('position'),
  imgWidth: state.imgStat.get('width'),
  imgHeight: state.imgStat.get('height'),
});
const mapDispatchToProps = dispatch => bindActionCreators({showHandler: showPixelateHandlers}, dispatch);
export default connect(mapStateToProps, mapDispatchToProps)(Pixelate);