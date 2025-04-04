import { Amplify } from 'aws-amplify';

// Configure Amplify directly in this file
Amplify.configure({
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_KZCZBFPuz',
      userPoolClientId: '796s2n6bq40g9jju9oj00floe3' // Note: changed from userPoolWebClientId
    }
  }
});

// No need to export anything, Amplify is now configured globally