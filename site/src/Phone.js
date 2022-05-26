import React, { useEffect, useState } from 'react';

import { ReactSipPhone, phoneStore } from 'react-sip-phone';
import './phone.css';
import { configData } from './Config';
import Container from 'aws-northstar/layouts/Container';
import 'react-sip-phone/dist/index.css';
import Form from 'aws-northstar/components/Form';
import Button from 'aws-northstar/components/Button';
import Checkbox from 'aws-northstar/components/Checkbox';
import FormField from 'aws-northstar/components/FormField';
import FormGroup from 'aws-northstar/components/FormGroup';
import FormSection from 'aws-northstar/components/FormSection';
import Input from 'aws-northstar/components/Input';
import Select from 'aws-northstar/components/Select';
import Textarea from 'aws-northstar/components/Textarea';
import Toggle from 'aws-northstar/components/Toggle';

const sipuri = configData.sipuri;
const password = configData.password;
const websocket = configData.websocket;

const Phone = () => {
    const [dialString, setDialString] = useState('');

    return (
        <Container title="SIP Phone" style={{ height: '650px', width: '400px', marginLeft: '50px', marginTop: '30px' }}>
            {/* <div>
                <input placeholder="Enter number to dial" onChange={(e) => setDialString(e.target.value)}></input>
                <button
                    onClick={() => {
                        if (phoneStore.getState().sipAccounts.sipAccount && dialString) {
                            phoneStore.getState().sipAccounts.sipAccount.makeCall(dialString);
                        }
                    }}
                >
                    Dial
                </button>
            </div> */}

            <Form
                header="Dial a Number:"
                actions={
                    <div>
                        <Button
                            variant="primary"
                            onClick={() => {
                                if (phoneStore.getState().sipAccounts.sipAccount && dialString) {
                                    phoneStore.getState().sipAccounts.sipAccount.makeCall(dialString);
                                }
                            }}
                        >
                            Dial
                        </Button>
                    </div>
                }
            >
                <FormField
                    // label="3125551212"
                    hintText="Enter number to dial as NPANXX number"
                    controlId="formFieldId1"
                >
                    <Input type="text" controlId="formFieldId1" onChange={(e) => setDialString(e)} />
                </FormField>
            </Form>
            <ReactSipPhone
                name={configData.voiceConnectorPhone}
                sipCredentials={{
                    sipuri: sipuri,
                    password: password,
                }}
                sipConfig={{
                    websocket: websocket,
                    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
                    defaultCountryCode: '1',
                }}
                phoneConfig={{
                    disabledButtons: ['hold', 'transfer'],
                    disabledFeatures: ['remoteid', 'dialstring'],
                    defaultDial: '',
                    autoAnswer: false,
                }}
                appConfig={{
                    mode: 'strict',
                    started: false,
                    appSize: 'large',
                }}
                containerStyle={{
                    minHeight: '600px',
                    width: '350px',
                    marginLeft: '20px',
                    marginTop: '10px',
                    overflow: 'hidden',
                }}
            />
        </Container>
    );
};
export default Phone;
