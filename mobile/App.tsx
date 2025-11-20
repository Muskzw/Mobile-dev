import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './src/store/authStore';
import { ThemeProvider } from './src/context/ThemeContext';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import DocumentsScreen from './src/screens/DocumentsScreen';
import DocumentCreateScreen from './src/screens/DocumentCreateScreen';
import DocumentViewScreen from './src/screens/DocumentViewScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import ClientCreateScreen from './src/screens/ClientCreateScreen';
import ProductsScreen from './src/screens/ProductsScreen';
import ContactUsScreen from './src/screens/ContactUsScreen';
import ClientViewScreen from './src/screens/ClientViewScreen';
import CompaniesScreen from './src/screens/CompaniesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Initialize auth store from AsyncStorage
const initAuth = async () => {
  try {
    const stored = await AsyncStorage.getItem('auth-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state?.token) {
        useAuthStore.setState(parsed.state);
      }
    }
  } catch (error) {
    console.error('Auth init error:', error);
  }
};

initAuth();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: 'Documents' }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{ title: 'Clients' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { token } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <ThemeProvider>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#F9FAFB' },
              }}
            >
              {/* Auth Stack */}
              {!token ? (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Register" component={RegisterScreen} />
                </>
              ) : (
                /* App Stack */
                <>
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Screen name="DocumentCreate" component={DocumentCreateScreen} />
                  <Stack.Screen name="DocumentView" component={DocumentViewScreen} />
                  <Stack.Screen name="ClientCreate" component={ClientCreateScreen} />
                  <Stack.Screen name="ClientView" component={ClientViewScreen} />
                  <Stack.Screen name="Products" component={ProductsScreen} />
                  <Stack.Screen name="ContactUs" component={ContactUsScreen} />
                  <Stack.Screen name="Companies" component={CompaniesScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
