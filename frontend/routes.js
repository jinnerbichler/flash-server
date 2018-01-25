import React from 'react';
import {Route, Switch} from 'react-router-dom';
import ChannelList from './components/ChannelList';
import ChannelDetail from './components/ChannelDetail';
import EventDetail from "./components/EventDetail";

export const Routes = () => (
    <Switch>
        <Route exact path='/' component={ChannelList}/>
        <Route path="/channel/:channelId" component={ChannelDetail}/>
        <Route path="/event/:eventId" component={EventDetail}/>
    </Switch>
);
export default Routes;
