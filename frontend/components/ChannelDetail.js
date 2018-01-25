//client/components/App.js
import React from 'react';
import axios from 'axios';
import {Grid, Row, Col, Table} from 'react-bootstrap';
import {FormattedRelative, IntlProvider} from "react-intl";
import {RingLoader} from 'react-spinners';
import PrettyJson from "./PrettyJson";

export default class ChannelDetail extends React.Component {

    constructor() {
        super();
        this.state = {
            channelData: {},
            channelEvents: []
        };
    }

    componentDidMount() {
        const {match: {params}} = this.props;
        const channelId = params.channelId;

        this.getChannelsData(this, channelId);
        this.getChannelEvents(this, channelId);
    }

    getChannelsData(component, channelId) {
        axios.get(`/api/v1/FlashChannel?query={"_id":"${channelId}"}`)
            .then(function (response) {
                component.setState({channelData: response.data});
            });
    }

    getChannelEvents(component, channelId) {
        axios.get(`/api/v1/ChannelEvent?query={"channel":"${channelId}"}&select=_id,type,updatedAt&sort=-updatedAt`)
            .then(function (response) {
                component.setState({channelEvents: response.data});
            });
    }

    render() {
        const {match: {params}} = this.props;

        // Flash object component
        let flashComponent = (
            <div className={"spinner"}>
                <RingLoader color={'black'} loading={this.state.loading}/>
            </div>);
        if (this.state.channelData.length)
            flashComponent = <PrettyJson flash={this.state.channelData[0].data}/>;

        // events component
        let eventsComponent = (
            <div className={"spinner"}>
                <RingLoader color={'black'} loading={this.state.loading}/>
            </div>);
        if (this.state.channelEvents)
            eventsComponent =
                <Table striped condensed hover responsive>
                    <thead>
                    <tr>
                        <th>Event ID</th>
                        <th>Type</th>
                        <th>Last Change</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        this.state.channelEvents.map((event) => {
                            return <tr key={event._id}>
                                <td><a href={`/#/event/${event._id}`}>{event._id}</a>
                                </td>
                                <td>{event.type}</td>
                                <td><FormattedRelative value={event.updatedAt}/></td>
                            </tr>
                        })
                    }
                    </tbody>
                </Table>;


        return (
            <IntlProvider locale="en">
                <div className={"channel-details"}>
                    <Grid>

                        <div className={"header"}>
                            <img src={"/img/iota_logo.png"}/>
                            <h1>Flash Server Admin</h1>
                        </div>

                        <h3>Channel Id {params.channelId}</h3>

                        <Row className="back-link">
                            <a href="javascript:history.back()">Back</a>
                        </Row>

                        <Row className="show-grid">

                            <Col md={6} id={"flash-object"}>
                                <h4>Current Flash Object</h4>
                                {flashComponent}
                            </Col>
                            <Col md={6} id={"channel-events"}>
                                <h4>Channel Events</h4>
                                {eventsComponent}
                            </Col>
                        </Row>
                    </Grid>

                </div>
            </IntlProvider>
        );
    }
}
