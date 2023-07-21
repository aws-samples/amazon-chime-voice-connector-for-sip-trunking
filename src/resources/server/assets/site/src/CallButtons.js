import React from 'react';
import { SessionState } from 'sip.js';

const CallButtons = ({ makeCall, hangUp, sessionState }) => {
    return (
        <div>
            <button onClick={makeCall}>Call</button>
            {sessionState}
            {sessionState === SessionState.Established && <button onClick={hangUp}>Hang Up</button>}
        </div>
    );
};

export default CallButtons;
