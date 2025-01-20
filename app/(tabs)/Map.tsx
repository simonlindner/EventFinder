import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function Map() {
  const [city, setCity] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [noCityModalVisible, setNoCityModalVisible] = useState(false);
  const [savedEvents, setSavedEvents] = useState({});
  const [region, setRegion] = useState(null);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    const loadSavedEvents = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const eventKeys = keys.filter(key => key.startsWith('@event_'));
        const eventItems = await AsyncStorage.multiGet(eventKeys);
        const loadedEvents = eventItems.reduce((acc, item) => {
          acc[item[0].replace('@event_', '')] = true;
          return acc;
        }, {});
        setSavedEvents(loadedEvents);
      } catch (error) {
        console.error("Error loading saved events", error);
      }
    };

    loadSavedEvents();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(async () => {
        try {
          const city = await AsyncStorage.getItem('searchedCity');
          const events = await AsyncStorage.getItem('searchedEvents');
          if (city && events) {
            setCity(city);
            const parsedEvents = JSON.parse(events);
            setEvents(parsedEvents);
            if (parsedEvents.length > 0) {
              const coordinates = parsedEvents.map(event => ({
                latitude: parseFloat(event._embedded.venues[0].location.latitude),
                longitude: parseFloat(event._embedded.venues[0].location.longitude),
              }));
              const { latitude, longitude, latitudeDelta, longitudeDelta } = getRegionForCoordinates(coordinates);
              setRegion({
                latitude,
                longitude,
                latitudeDelta,
                longitudeDelta,
              });
              setNoCityModalVisible(false);
            } else {
              setEvents([]);
              setRegion(null);
              setNoCityModalVisible(true);
            }
          } else {
            setEvents([]);
            setRegion(null);
            setNoCityModalVisible(true);
          }
        } catch (error) {
          console.error("Error checking for searched city and events", error);
        }
      }, 5000);

      return () => clearInterval(interval);
    }, [])
  );

  const getRegionForCoordinates = (points) => {
    let minX, maxX, minY, maxY;

    // Initialize the min and max values
    points.forEach(point => {
      minX = (minX === undefined) ? point.latitude : Math.min(minX, point.latitude);
      maxX = (maxX === undefined) ? point.latitude : Math.max(maxX, point.latitude);
      minY = (minY === undefined) ? point.longitude : Math.min(minY, point.longitude);
      maxY = (maxY === undefined) ? point.longitude : Math.max(maxY, point.longitude);
    });

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const deltaX = (maxX - minX) * 1.5;
    const deltaY = (maxY - minY) * 1.5;

    return {
      latitude: midX,
      longitude: midY,
      latitudeDelta: deltaX,
      longitudeDelta: deltaY,
    };
  };

  const handleSaveEvent = async (event) => {
    try {
      if (savedEvents[event.id]) {
        await AsyncStorage.removeItem(`@event_${event.id}`);
        const updatedSavedEvents = { ...savedEvents };
        delete updatedSavedEvents[event.id];
        setSavedEvents(updatedSavedEvents);
        console.log("Event removed", "The event has been removed from saved events.");
      } else {
        await AsyncStorage.setItem(`@event_${event.id}`, JSON.stringify(event));
        setSavedEvents({ ...savedEvents, [event.id]: true });
        console.log("Event saved", "The event has been saved locally.");
      }
    } catch (error) {
      console.error("Error saving/removing event", error);
    }
  };

  const handleMarkerPress = (events) => {
    setSelectedEvents(events);
    setModalVisible(true);
  };

  const groupEventsByAddress = (events) => {
    const groupedEvents = events.reduce((acc, event) => {
      const address = event._embedded.venues[0].address.line1;
      if (!acc[address]) {
        acc[address] = [];
      }
      acc[address].push(event);
      return acc;
    }, {});
    return groupedEvents;
  };

  const groupedEvents = groupEventsByAddress(events);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
      >
        {Object.keys(groupedEvents).map((address) => {
          const eventsAtAddress = groupedEvents[address];
          const { latitude, longitude } = eventsAtAddress[0]._embedded.venues[0].location;
          return (
            <Marker
              key={address}
              coordinate={{
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              }}
              title={`${eventsAtAddress.length} Event${eventsAtAddress.length > 1 ? 's' : ''}`}
              onPress={() => handleMarkerPress(eventsAtAddress)}
            />
          );
        })}
      </MapView>
      {modalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons
                  name="close"
                  size={28}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {selectedEvents.map((event) => (
                <View key={event.id} style={styles.eventContainer, {borderBottomWidth: 2, marginBottom: 10, borderColor: "gray"}}>
                  <TouchableOpacity onPress={() => handleSaveEvent(event)} style={{marginBottom:10}}>
                    <Ionicons
                      name={savedEvents[event.id] ? "bookmark" : "bookmark-outline"}
                      size={28}
                      color={themeColors.text}
                    />
                  </TouchableOpacity>
                  <Text style={[styles.modalText, { color: themeColors.text }]}>Name: {event.name}</Text>
                  <Text style={[styles.modalText, { color: themeColors.text }]}>Date: {event.dates.start.localDate}</Text>
                  <Text style={[styles.modalText, { color: themeColors.text }]}>Time: {event.dates.start.localTime}</Text>
                  <Text style={[styles.modalText, { color: themeColors.text }]}>Venue: {event._embedded.venues[0].name}</Text>
                  <Text style={[styles.modalText, { color: themeColors.text }]}>City: {event._embedded.venues[0].city.name}</Text>
                  <Text style={[styles.modalText, { color: themeColors.text }]}>Country: {event._embedded.venues[0].country.name}</Text>
                  <Text style={[styles.modalText, { color: themeColors.text }]}>Address: {event._embedded.venues[0].address.line1}</Text>
                  <Text style={[styles.modalText, { color: themeColors.text }]}>Price Range: {event.priceRanges ? `${event.priceRanges[0].min} - ${event.priceRanges[0].max} ${event.priceRanges[0].currency}` : 'N/A'}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </Modal>
      )}
      {noCityModalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={noCityModalVisible}
          onRequestClose={() => {
            setNoCityModalVisible(false);
          }}
        >
          <View style={styles.noCityModalView}>
            <Text style={[styles.modalText, { color: themeColors.text }]}>No city searched. Please search for a city first.</Text>
            <TouchableOpacity onPress={() => setNoCityModalVisible(false)}>
              <Ionicons
                name="close"
                size={28}
                color={themeColors.text}
              />
            </TouchableOpacity>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  modalView: {
    margin: 20,
    backgroundColor: '#151718',
    borderRadius: 20,
    padding: 35,
    shadowColor: '#000',
  },
  noCityModalView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
  },
  eventContainer: {
    marginBottom: 20,
  },
});