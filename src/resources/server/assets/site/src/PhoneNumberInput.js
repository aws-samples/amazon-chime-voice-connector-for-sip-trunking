import React from 'react';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

const PhoneNumberInput = ({ phoneNumber, setPhoneNumber }) => {
    return (
        <PhoneInput
            style={{ width: '20%' }}
            defaultCountry="US"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={setPhoneNumber}
        />
    );
};

export default PhoneNumberInput;
