import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserAgent, Registerer, Inviter, SessionState } from 'sip.js';
import SipUserAgent from './SipUserAgent';
import PhoneNumberInput from './PhoneNumberInput';
import CallButtons from './CallButtons';
import IncomingCallAlert from './IncomingCallAlert';

const SIP_URI = process.env.SIP_URI || '';
const SIP_PASSWORD = process.env.SIP_PASSWORD || '';
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || '';
const VOICE_CONNECTOR_PHONE = process.env.VOICE_CONNECTOR_PHONE || '';
const SERVER_IP = process.env.SERVER_IP || '';

const uri = UserAgent.makeURI(SIP_URI);

const transportOptions = {
    server: WEBSOCKET_URL,
    keepAliveInterval: 30,
};

const SipProvider = ({ children }) => {
    const [userAgent, setUserAgent] = useState(null);
    const [session, setSession] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [sessionState, setSessionState] = useState(null);
    const [customHeaders, setCustomHeaders] = useState([]);
    const mediaElementRef = useRef(null);

    const setupRemoteMedia = (session) => {
        const remoteStream = new MediaStream();
        session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
            if (receiver.track) {
                remoteStream.addTrack(receiver.track);
            }
        });
        mediaElementRef.current.srcObject = remoteStream;
        mediaElementRef.current.play();
    };

    const cleanupMedia = () => {
        mediaElementRef.current.pause();
        mediaElementRef.current.srcObject = null;
    };

    const onInvite = useCallback((invitation) => {
        console.log('Received INVITE: ', invitation);
        setIncomingCall(invitation);

        const headers = invitation.request.headers;
        let incomingHeaders = [];

        for (let header in headers) {
            if (header.toLowerCase().startsWith('x-')) {
                headers[header].forEach((headerValue) => {
                    let headerObject = {};
                    headerObject[header] = headerValue.raw;
                    incomingHeaders.push(headerObject);
                });
            }
        }

        setCustomHeaders(incomingHeaders);
        console.log('Incoming Headers: ', JSON.stringify(incomingHeaders, null, 2));

        invitation.stateChange.addListener((newState) => {
            setSessionState(newState);
            switch (newState) {
                case SessionState.Established:
                    console.log('Inbound Call Established');
                    setupRemoteMedia(invitation);
                    setSession(invitation);
                    break;
                case SessionState.Terminated:
                    console.log('Inbound Call Terminated');
                    setSession(null);
                    cleanupMedia();
                    break;
                default:
                    break;
            }
        });
    }, []);

    const acceptCall = () => {
        if (incomingCall) {
            incomingCall.accept();
            setSession(incomingCall);
            setIncomingCall(null);
        }
    };

    const rejectCall = () => {
        if (incomingCall) {
            incomingCall.reject();
            setIncomingCall(null);
        }
    };

    const makeCall = () => {
        console.log('Making Call');
        if (userAgent && phoneNumber) {
            const target = UserAgent.makeURI(`sip:${phoneNumber}@${SERVER_IP}`);
            console.log('WEBSOCKET_URL: ', WEBSOCKET_URL);
            console.log('VOICE_CONNECTOR_PHONE: ', VOICE_CONNECTOR_PHONE);
            console.log('Target: ', target);
            if (target) {
                const inviter = new Inviter(userAgent, target);
                inviter.invite();
                const outgoingSession = inviter;
                outgoingSession.stateChange.addListener((newState) => {
                    setSessionState(newState);
                    switch (newState) {
                        case SessionState.Established:
                            console.log('Outbound Call Established');
                            setupRemoteMedia(outgoingSession);
                            setSession(outgoingSession);
                            console.log('OutgoingSession: ', outgoingSession);
                            break;
                        case SessionState.Terminated:
                            console.log('Outbound Call Terminated');
                            cleanupMedia();
                            setSession(null);
                            break;
                        default:
                            break;
                    }
                });

                console.log('Outgoing Session: ', outgoingSession);
                setSession(outgoingSession);
            }
        }
    };

    useEffect(() => {
        const userAgentOptions = {
            authorizationPassword: SIP_PASSWORD,
            authorizationUsername: VOICE_CONNECTOR_PHONE,
            transportOptions,
            uri,
            delegate: { onInvite },
        };

        const ua = new UserAgent(userAgentOptions);
        setUserAgent(ua);
        const registerer = new Registerer(ua);

        ua.start().then(() => {
            registerer.register();
        });
    }, []);

    useEffect(() => {
        let timeoutId;
        if (sessionState === SessionState.Terminated) {
            timeoutId = setTimeout(() => {
                setSessionState(null);
            }, 5000); // 5000 milliseconds = 5 seconds
        }

        return () => clearTimeout(timeoutId); // cleanup function to clear the timeout if component unmounts
    }, [sessionState]);

    // Some function to end the call
    const hangUp = () => {
        if (session) {
            console.log('Hanging Up');
            console.log('Current Session: ', session);
            session.bye();
            setSession(null);
            setSessionState(SessionState.Terminated);
        }
    };

    if (!userAgent) {
        return null;
    }

    return (
        <div>
            {children}
            <SipUserAgent setUserAgent={setUserAgent} onInvite={onInvite} />
            <PhoneNumberInput phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} />
            <CallButtons makeCall={makeCall} hangUp={hangUp} sessionState={sessionState} />
            <IncomingCallAlert incomingCall={incomingCall} acceptCall={acceptCall} rejectCall={rejectCall} />
            <video ref={mediaElementRef} autoPlay />
        </div>
    );
};

export default SipProvider;
