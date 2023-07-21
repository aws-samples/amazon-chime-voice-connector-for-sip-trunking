// IncomingCallAlert.js

import React from 'react';

const IncomingCallAlert = ({ incomingCall, acceptCall, rejectCall }) => {
    if (!incomingCall) {
        return null;
    }

    return (
        <div>
            <h2>Incoming call from {incomingCall.remoteIdentity.uri.user}</h2>
            <button onClick={acceptCall}>Accept</button>
            <button onClick={rejectCall}>Reject</button>
        </div>
    );
};

export default IncomingCallAlert;
