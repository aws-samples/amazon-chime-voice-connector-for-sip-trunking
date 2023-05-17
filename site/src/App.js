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

            <ErrorBoundary>
                <Phone />
            </ErrorBoundary>
            {/* <Grid>
                    <LexData />
                </Grid> */}
        </NorthStarThemeProvider>
    );
};

export default App;

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        // You can also log the error to an error reporting service
        logErrorToMyService(error, info);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return <h1>Something went wrong.</h1>;
        }

        return this.props.children;
    }
}
