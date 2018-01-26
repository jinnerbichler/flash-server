//client/components/App.js
import React from 'react';
import axios from 'axios';
import {Col, Grid, Row, Table} from 'react-bootstrap';
import {FormattedRelative, IntlProvider} from "react-intl";
import {RingLoader} from "react-spinners";

export default class ChannelList extends React.Component {

    constructor() {
        super();
        this.state = {
            flashChannels: [],
        };
        this.getChannels = this.getChannels.bind(this);
    }

    componentDidMount() {
        this.getChannels(this);
    }

    getChannels(component) {
        axios.get('/api/v1/FlashChannel?select=_id,isClosed,isFinalized,createdAt,updatedAt&sort=-updatedAt')
            .then(function (response) {
                component.setState({flashChannels: response.data});
            });
    }

    render() {

        let tableComponent = (
            <div className={"spinner"}>
                <RingLoader color={'black'} loading={this.state.loading}/>
            </div>);
        if (this.state.flashChannels.length) {
            tableComponent = <Table striped hover responsive>
                <thead>
                <tr>
                    <th>Channel ID</th>
                    <th>Creation Time</th>
                    <th>Last Change</th>
                    <th>Is Closed</th>
                    <th>Is Finalized</th>
                </tr>
                </thead>
                <tbody>
                {
                    this.state.flashChannels.map((channel) => {

                        const isClosed = channel.isClosed != null ? channel.isClosed.toString() : false;
                        const isFinalized = channel.isFinalized != null ? channel.isFinalized.toString() : false;

                        return <tr key={channel._id}>
                            <td><a href={`/#/channel/${channel._id}`}>{channel._id}</a></td>
                            <td>{channel.createdAt}</td>
                            <td><FormattedRelative value={channel.updatedAt}/></td>
                            <td>{isClosed}</td>
                            <td>{isFinalized}</td>
                        </tr>
                    })
                }
                </tbody>
            </Table>
        }

        return (
            <IntlProvider locale="en">

                <Grid>
                    <div className={"header"}>
                        <img src={"/img/iota_logo.png"}/>
                        <h1>IOTA Flash Server Admin</h1>
                    </div>

                    <h3>Channels Overview</h3>

                    <Row className="show-grid">

                        <Col md={12} id={"flash-object"}>
                            {tableComponent}
                        </Col>
                    </Row>
                </Grid>
            </IntlProvider>
        );
    }
}
