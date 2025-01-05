import React from 'react';
import { Text, StyleSheet, ImageBackground } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { HelloWave } from '@/components/HelloWave';

import eventImage from '@/assets/images/headerEventImage.jpg';

export default function Home() {
  return (
    <ParallaxScrollView
      headerImage={
        <ImageBackground
          source={eventImage}
          style={styles.headerContainer}
          blurRadius={10}
        >
          <Text style={styles.headerText}>Event Finder</Text>
        </ImageBackground>
      }
      headerBackgroundColor={{ dark: '#000', light: '#fff' }}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome to Event Finder <HelloWave /></ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Features</ThemedText>
        <ThemedText>
          - Discover events in your city{'\n'}
          - Save your favorite events{'\n'}
          - Get notifications for upcoming events{'\n'}
          - Share events with friends
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">How to Use</ThemedText>
        <ThemedText>
          1. Use the Search tab to find events in your city{'\n'}
          2. Save events by tapping the bookmark icon{'\n'}
          3. View saved events in the Events tab{'\n'}
          4. Get notifications for saved events
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 300,
    backgroundColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 40,
    color: 'white',
    fontWeight: 'bold',
    paddingBottom: 50,
  },
  titleContainer: {
    padding: 10,
  },
  stepContainer: {
    padding: 10,
  },
});