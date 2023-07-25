// IncomingCallAlert.js

import React from 'react';
import { Container, ContentLayout, SpaceBetween, TopNavigation, Header, Button } from '@cloudscape-design/components';

const IncomingCallAlert = ({ incomingCall, acceptCall, rejectCall }) => {
    if (!incomingCall) {
        return null;
    }

    return (
        <div>
            <h2>Incoming call from {incomingCall.remoteIdentity.uri.user}</h2>
            <Button onClick={acceptCall}>Accept</Button>
            <Button onClick={rejectCall}>Reject</Button>
        </div>
    );
};

export default IncomingCallAlert;
