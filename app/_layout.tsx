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
import Notifications from '@/app/(tabs)/Notifications';

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

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator>
        <Tab.Screen name="Home" 
        component={Home} 
        options={{
                  title: 'Home',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}/>
        <Tab.Screen name="Search" 
        component={Search}
        options={{
                  title: 'Search',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="search.fill" color={color} />,
                }} />
        <Tab.Screen name="Notifications" 
        component={Notifications}
        options={{
                  title: 'Notification',
                  tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.fill" color={color} />,
                }} />
      </Tab.Navigator>
    </ThemeProvider>
  );
}