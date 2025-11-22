import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from './src/store/authStore';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

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
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';

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
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Documents') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Clients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.background.primary,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
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

function AppNavigator() {
  const { token } = useAuthStore();
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background.secondary },
        }}
      >
        {/* Auth Stack */}
        {!token ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
