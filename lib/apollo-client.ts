import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create an HTTP link for Graph API
const httpLink = createHttpLink({
  uri: 'https://graph.microsoft.com/v1.0/graphql', // Microsoft Graph API GraphQL endpoint
});

// Auth link to inject the bearer token
const authLink = setContext(async (_, { headers }) => {
  // Get access token from your auth provider (e.g., MS Teams SDK)
  const token = await getAccessToken();
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
});

// Function to get access token
async function getAccessToken() {
  try {
    const response = await fetch('/api/auth/teams-token');
    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
