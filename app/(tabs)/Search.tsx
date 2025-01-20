import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Button, FlatList, Image, TouchableOpacity, ActivityIndicator, useColorScheme, Modal, ScrollView, Alert, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function Search() {
  const [city, setCity] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [savedEvents, setSavedEvents] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false); // Neuer Zustand
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

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true); // Setzen Sie den Zustand auf true, wenn eine Suche durchgeführt wird
    console.log("Searching Events for City: " + city);
    const apikey = "Oq6XnajiNnf6RDlzeMQut1oVDee0TAh5";
    const searchString = "https://app.ticketmaster.com/discovery/v2/events?apikey=" + apikey + "&locale=*&size=200&city=" + city;
    var request = new XMLHttpRequest();
    request.open('GET', searchString, true);
    request.send();
    request.onload = async function() {
      setLoading(false);
      if (request.status >= 200 && request.status < 400) {
        var data = JSON.parse(request.responseText);
        if(data.page.totalElements === 0) {
          console.log("No Events found for City: " + city);
          setEvents([]);
          try {
            await AsyncStorage.removeItem('searchedCity');
            await AsyncStorage.removeItem('searchedEvents');
          } catch (error) {
            console.error("Error clearing stored data", error);
          }
        }else{
          var events = data._embedded.events;
          console.log("Successfully retrieved "+ events.length +" Events for City: " + city);
          setEvents(events);
          // Speichern der Stadt und der Events in AsyncStorage
          await AsyncStorage.setItem('searchedCity', city);
          await AsyncStorage.setItem('searchedEvents', JSON.stringify(events));
          console.log("Wrote Searched City and Events to AsyncStorage");
        }
      } else {
        // We reached our target server, but it returned an error
        console.log("Error");
      }
    };
  };

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await handleSearch();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ThemedView style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
          placeholder="Enter city name"
          placeholderTextColor={themeColors.placeholder}
          value={city}
          onChangeText={setCity}
        />
        <Button title="Search" onPress={handleSearch} />
      </ThemedView>
      {loading ? (
        <ActivityIndicator size="large" color={themeColors.text} />
      ) : searched && events.length === 0 ? ( // Überprüfen Sie, ob eine Suche durchgeführt wurde
        <ThemedText style={{ color: themeColors.text , paddingHorizontal: 20 }}>No Events found in City {city}</ThemedText>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.eventItem, { backgroundColor: themeColors.inputBackground }]}>
              <TouchableOpacity onPress={() => handleEventPress(item)} style={{ flex: 1 }}>
                <View style={styles.eventDetails}>
                  <Image
                    source={{ uri: item.images[0].url }}
                    style={styles.eventImage}
                  />
                  <View style={styles.eventDetails}>
                    <Text style={[styles.eventName, { color: themeColors.text }]}>{item.name}</Text>
                    <Text style={[styles.eventDate, { color: themeColors.subtext }]}>{item.dates.start.localDate}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSaveEvent(item)}>
                <Ionicons
                  name={savedEvents[item.id] ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.text]}
            />
          }
        />
      )}
      {selectedEvent && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.modalView}>
            <ScrollView>
              <Text style={[styles.modalText, { color: themeColors.text }]}>Name: {selectedEvent.name}</Text>
              <Text style={[styles.modalText, { color: themeColors.text }]}>Date: {selectedEvent.dates.start.localDate}</Text>
              <Text style={[styles.modalText, { color: themeColors.text }]}>Time: {selectedEvent.dates.start.localTime}</Text>
              <Text style={[styles.modalText, { color: themeColors.text }]}>Venue: {selectedEvent._embedded.venues[0].name}</Text>
              <Text style={[styles.modalText, { color: themeColors.text }]}>City: {selectedEvent._embedded.venues[0].city.name}</Text>
              <Text style={[styles.modalText, { color: themeColors.text }]}>Country: {selectedEvent._embedded.venues[0].country.name}</Text>
              <Text style={[styles.modalText, { color: themeColors.text }]}>Address: {selectedEvent._embedded.venues[0].address.line1}</Text>
              <Text style={[styles.modalText, { color: themeColors.text }]}>Price Range: {selectedEvent.priceRanges ? `${selectedEvent.priceRanges[0].min} - ${selectedEvent.priceRanges[0].max} ${selectedEvent.priceRanges[0].currency}` : 'N/A'}</Text>
              <Image
                source={{ uri: selectedEvent.images[0].url }}
                style={styles.modalImage}
              />
              <Button title="Close" onPress={() => setModalVisible(false)} />
            </ScrollView>
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
  inputContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    marginRight: 10,
  },
  eventItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    alignItems: 'center',
  },
  eventImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventDate: {
    fontSize: 16,
    color: 'gray',
  },
  modalView: {
    margin: 20,
    backgroundColor: '#151718',
    borderRadius: 20,
    padding: 35,
    shadowColor: '#000',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'left',
  },
  modalImage: {
    width: 200,
    height: 200,
    marginBottom: 15,
  },
});