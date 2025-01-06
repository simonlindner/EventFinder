import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, useColorScheme, Modal, ScrollView, Alert, RefreshControl, Button } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme];

  const loadEvents = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const eventKeys = keys.filter(key => key.startsWith('@event_'));
      const eventItems = await AsyncStorage.multiGet(eventKeys);
      const loadedEvents = eventItems.map(item => JSON.parse(item[1]));
      setEvents(loadedEvents);

      const notificationKeys = keys.filter(key => key.startsWith('@notification_'));
      const notificationItems = await AsyncStorage.multiGet(notificationKeys);
      const loadedNotifications = notificationItems.reduce((acc, item) => {
        acc[item[0].replace('@notification_', '')] = true;
        return acc;
      }, {});
      setNotifications(loadedNotifications);
    } catch (error) {
      console.error("Error loading events", error);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEventPress = (event) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  const handleSetNotification = async (event) => {
    try {
      if (notifications[event.id]) {
        const notificationId = await AsyncStorage.getItem(`@notification_${event.id}`);
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await AsyncStorage.removeItem(`@notification_${event.id}`);
        const updatedNotifications = { ...notifications };
        delete updatedNotifications[event.id];
        setNotifications(updatedNotifications);
        console.log("Notification removed", "The notification has been removed.");
      } else {
        const eventDate = new Date(event.dates.start.dateTime);
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Event Reminder",
            body: `Don't forget the event: ${event.name} today!`,
          },
          trigger: {
            date: eventDate,
          },
        });
        await AsyncStorage.setItem(`@notification_${event.id}`, notificationId);
        setNotifications({ ...notifications, [event.id]: true });
        console.log("Notification set", "You will be reminded on the day of the event.");
      }
    } catch (error) {
      console.error("Error setting/removing notification", error);
    }
  };

  const handleDeleteEvent = async (event) => {
    try {
      await AsyncStorage.removeItem(`@event_${event.id}`);
      setEvents(events.filter(e => e.id !== event.id));
      console.log("Event deleted", "The event has been deleted.");
    } catch (error) {
      console.error("Error deleting event", error);
    }
  };

  const renderRightActions = (progress, dragX, item) => {
    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(item)}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
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
              <TouchableOpacity onPress={() => handleSetNotification(item)}>
                <Ionicons
                  name={notifications[item.id] ? "notifications" : "notifications-outline"}
                  size={24}
                  color={themeColors.text}
                />
              </TouchableOpacity>
            </View>
          </Swipeable>
        )}
        ListEmptyComponent={
          <ThemedText style={{ color: themeColors.text, textAlign: 'center', marginTop: 20 }}>
            No saved events
          </ThemedText>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[themeColors.text]}
          />
        }
      />
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
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});