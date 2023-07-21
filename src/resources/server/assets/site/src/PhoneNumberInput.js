// PhoneNumberInput.js

import React from 'react';

const PhoneNumberInput = ({ phoneNumber, setPhoneNumber }) => {
    return <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />;
};

export default PhoneNumberInput;
