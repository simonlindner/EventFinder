import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import Home from '@/app/(tabs)/Home';
import Search from '@/app/(tabs)/Search';
import Events from '@/app/(tabs)/Events';
import Map from '@/app/(tabs)/Map';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const clearStoredData = async () => {
      try {
        await AsyncStorage.removeItem('searchedCity');
        await AsyncStorage.removeItem('searchedEvents');
      } catch (error) {
        console.error("Error clearing stored data", error);
      }
    };

    clearStoredData();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
      screenOptions={{
        headerShown: false
      }}>
        <Tab.Screen name="Home" 
        component={Home} 
        options={{
                  title: 'Home',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="home.fill" color={color} />,
                }}/>
        <Tab.Screen name="Search" 
        component={Search}
        options={{
                  title: 'Search',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="searchglass.fill" color={color} />,
                }} />
        <Tab.Screen name="Events" 
        component={Events}
        options={{
                  title: 'Events',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="event.fill" color={color} />,
                }} />
        <Tab.Screen name="Map" 
        component={Map}
        options={{
                  title: 'Map',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
                }} />
      </Tab.Navigator>
    </ThemeProvider>
  );
}