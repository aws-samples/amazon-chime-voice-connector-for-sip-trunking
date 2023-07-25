import React from 'react';
import { SessionState } from 'sip.js';
import { Container, ContentLayout, SpaceBetween, TopNavigation, Header, Button } from '@cloudscape-design/components';

const CallButtons = ({ makeCall, hangUp, sessionState }) => {
    return (
        <div>
            {sessionState != SessionState.Established && <Button onClick={makeCall}>Call</Button>}
            {sessionState === SessionState.Established && <Button onClick={hangUp}>Hang Up</Button>}
        </div>
    );
};

export default CallButtons;
