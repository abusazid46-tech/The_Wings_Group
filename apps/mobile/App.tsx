import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>The Wings Group</Text>
        <Text style={styles.subtitle}>Mobile app foundation is ready for Milestone 2 screens.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next build step</Text>
        <Text style={styles.cardText}>
          Connect OTP login, service browsing, location selection, bookings, and payments using the shared API.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4f8fd"
  },
  header: {
    backgroundColor: "#0a1628",
    paddingHorizontal: 24,
    paddingVertical: 34
  },
  brand: {
    color: "white",
    fontSize: 24,
    fontWeight: "800"
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    marginTop: 8,
    lineHeight: 20
  },
  card: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 18
  },
  cardTitle: {
    color: "#0a1628",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8
  },
  cardText: {
    color: "#667085",
    lineHeight: 21
  }
});
