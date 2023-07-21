import React from 'react';
import { ContentLayout, Header, SpaceBetween, AppLayout } from '@cloudscape-design/components';
import SipProvider from './SipProvider';

const App = () => {
    return (
        <AppLayout
            content={
                <ContentLayout header={<Header variant="h1">Amazon Chime SDK Voice Connector Phone</Header>}>
                    <SpaceBetween size="l">
                        <SipProvider />
                    </SpaceBetween>
                </ContentLayout>
            }
            navigationHide={true}
            toolsHide={true}
        />
    );
};

export default App;
