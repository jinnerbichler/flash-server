//client/components/App.js
import React from 'react';
import axios from 'axios';
import {Col, Grid, Row} from 'react-bootstrap';
import {IntlProvider} from "react-intl";
import {RingLoader} from "react-spinners";
import PrettyJson from "./PrettyJson";

const _ = require('underscore');

export default class EventDetail extends React.Component {

    constructor() {
        super();
        this.state = {
            event: {},
        };
        this.getEvent = this.getEvent.bind(this);
    }

    componentDidMount() {
        this.getEvent(this);
    }

    getEvent(component) {

        const {match: {params}} = this.props;
        const eventId = params.eventId;

        axios.get(`/api/v1/ChannelEvent/${eventId}`)
            .then(function (response) {
                component.setState({event: response.data});
            });
    }

    render() {

        const {match: {params}} = this.props;
        const eventId = params.eventId;

        let flashJson = (<div className={"spinner"}>
            <RingLoader color={'black'} loading={true}/>
        </div>);
        let metaData = (<div className={"spinner"}>
            <RingLoader color={'black'} loading={true}/>
        </div>);
        let type = "";

        if (_.isEmpty(this.state.event) === false) {
            flashJson = <PrettyJson flash={this.state.event.flash}/>
            metaData = <PrettyJson flash={this.state.event.meta} name={"Meta"}/>
            type = `(${this.state.event.type})`
        }

        return (
            <IntlProvider locale="en">

                <div className={"event-details"}>
                    <Grid>

                        <div className={"header"}>
                            <img src={"/img/iota_logo.png"}/>
                            <h1>Flash Server Admin</h1>
                        </div>
                        
                        <h3>Event Id {eventId} {type}</h3>

                        <Row className="back-link">
                            <a href="javascript:history.back()">Back</a>
                        </Row>

                        <Row className="show-grid">

                            <Col md={6} id={"flash-object"}>
                                <h4>Current Flash Object</h4>
                                {flashJson}
                            </Col>
                            <Col md={6} id={"channel-events"}>
                                <h4>Meta Data</h4>
                                {metaData}
                            </Col>
                        </Row>
                    </Grid>

                </div>
            </IntlProvider>
        );
    }
}
