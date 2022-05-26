import React, { useEffect, useState } from 'react';
import { phoneStore } from 'react-sip-phone';
import KeyValuePair from 'aws-northstar/components/KeyValuePair';
import Button from 'aws-northstar/components/Button';
import { AmplifyConfig } from './Config';
import 'react-sip-phone/dist/index.css';
import { Amplify, API } from 'aws-amplify';
import Container from 'aws-northstar/layouts/Container';

Amplify.configure(AmplifyConfig);

const LexData = () => {
    const [currentIncomingCallId, setCurrentIncomingCallId] = useState(null);
    const [sessionStateChanged, setSessionStateChanged] = useState(null);
    const [lexResults, setLexResults] = useState({});

    useEffect(() => {
        const phoneStoreUnsubscribe = phoneStore.subscribe(() => {
            const phoneStoreState = phoneStore.getState();
            const phoneStoreStateSipSessions = phoneStoreState.sipSessions;
            const phoneStoreStateSipSessionsStateChanged = phoneStoreStateSipSessions.stateChanged;
            setSessionStateChanged(phoneStoreStateSipSessionsStateChanged);
        });
        return phoneStoreUnsubscribe;
    }, []);

    useEffect(() => {
        if (sessionStateChanged !== null) {
            console.log(`sessionStateChanged: ${sessionStateChanged}`);
            const phoneStoreState = phoneStore.getState();
            const phoneStoreStateSipSessions = phoneStoreState.sipSessions.sessions;
            console.log(`sessionStateChanged -> phoneStoreStateSipSessions: `, phoneStoreStateSipSessions);
            const incomingCallId = Object.keys(phoneStoreStateSipSessions)[0];
            if (incomingCallId) {
                console.log(`sessionStateChanged -> incomingCallId: `, incomingCallId);
                if (incomingCallId !== currentIncomingCallId) {
                    setCurrentIncomingCallId(incomingCallId);
                }
            }
        }
    }, [sessionStateChanged]);

    useEffect(() => {
        if (currentIncomingCallId) {
            onIncomingCall(currentIncomingCallId);
        }
    }, [currentIncomingCallId]);

    function onIncomingCall(callId) {
        console.log(`onIncomingCall -> callId `, callId);
        const phoneStoreState = phoneStore.getState();
        const phoneStoreStateSipSessions = phoneStoreState.sipSessions.sessions;
        const currentSession = phoneStoreStateSipSessions[callId];
        console.log(`onIncomingCall -> currentSession `, currentSession);
        const incomingInviteRequest = currentSession.incomingInviteRequest;
        const inviteHeaders = incomingInviteRequest.message.headers;
        console.log(`onIncomingCall -> inviteHeaders `, inviteHeaders);
        const xCallId = inviteHeaders['X-Callid']?.[0]?.['raw'];
        console.log(`onIncomingCall -> XCallId:`, xCallId);
        dataDipByXCallId(xCallId);
    }

    async function dataDipByXCallId(xCallId) {
        console.log(`dataDipByXCallId -> xCallId `, xCallId);
        const queryResponse = await API.get('queryAPI', 'query', {
            queryStringParameters: {
                xCallId: xCallId,
            },
        });

        const completeResults = {
            ConfirmationState: queryResponse.ConfirmationState,
            CallingNumber: queryResponse.CallingNumber,
        };
        for (const [key, value] of Object.entries(queryResponse.LexResults)) {
            completeResults[key] = value;
        }
        console.log(completeResults);
        setLexResults(completeResults);
    }

    return (
        <Container
            title="Lex Data"
            style={{ height: '350px', width: '400px', marginLeft: '50px', marginTop: '50px' }}
            actionGroup={
                <div>
                    <Button variant="primary" onClick={() => setLexResults({})}>
                        Clear
                    </Button>
                </div>
            }
        >
            {Object.entries(lexResults).map(([key, value]) => {
                return <KeyValuePair label={key} value={value}></KeyValuePair>;
            })}
        </Container>
    );
};
export default LexData;
