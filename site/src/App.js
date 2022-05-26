import React from 'react';
import NorthStarThemeProvider from 'aws-northstar/components/NorthStarThemeProvider';
import Header from 'aws-northstar/components/Header';
import Grid from 'aws-northstar/layouts/Grid';
import Phone from './Phone';
// import LexData from './LexData';
import Container from 'aws-northstar/layouts/Container';
import './App.css';

const App = () => {
    return (
        <NorthStarThemeProvider>
            <Header title="Amazon Chime Voice Connector SIP Phone" />

            <Phone />

            {/* <Grid>
                    <LexData />
                </Grid> */}
        </NorthStarThemeProvider>
    );
};

export default App;
