import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import TasksScreen from '../screens/TasksScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Types
import { MainTabParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Simple tab bar icon component
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => (
  <Text style={{ 
    fontSize: 20, 
    opacity: focused ? 1 : 0.5,
    color: focused ? '#007AFF' : '#999'
  }}>
    {name}
  </Text>
);

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="🏠" focused={focused} />,
            tabBarLabel: 'Home',
          }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="✓" focused={focused} />,
            tabBarLabel: 'Tasks',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => <TabIcon name="👤" focused={focused} />,
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
