import React from "react";
import ReactJson from 'react-json-view'

export default class FlashJson extends React.Component {

    constructor() {
        super();
    }

    render() {
        return <ReactJson src={this.props.flash}
                          name={this.props.name || 'FlashState'}
                          displayObjectSize={false}
                          displayDataTypes={false}
                          enableClipboard={false}
                          collapseStringsAfterLength={5}
                          groupArraysAfterLength={5}/>;
    }
}