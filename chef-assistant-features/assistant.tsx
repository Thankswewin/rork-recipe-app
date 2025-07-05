import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Modal } from "react-native";
import { Text } from "@/components/ui/Text";
import { AgentCard } from "@/components/AgentCard";
import { EnhancedCameraView } from "@/components/EnhancedCameraView";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/colors";
import { agents } from "@/constants/agents";
import { useAppStore } from "@/store/appStore";
import { Camera, MessageSquare, Info } from "lucide-react-native";
import { router } from "expo-router";

export default function AssistantScreen() {
  const [showCamera, setShowCamera] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const currentAgent = useAppStore((state) => state.currentAgent);
  const setCurrentAgent = useAppStore((state) => state.setCurrentAgent);
  const createNewChat = useAppStore((state) => state.createNewChat);
  
  const handleAgentSelect = (agentId: string) => {
    setCurrentAgent(agentId);
  };
  
  const handleStartCamera = () => {
    if (!currentAgent) {
      // If no agent is selected, prompt user to select one
      return;
    }
    setShowCamera(true);
  };
  
  const handleStartChat = () => {
    if (!currentAgent) {
      // If no agent is selected, prompt user to select one
      return;
    }
    
    const chatId = createNewChat(currentAgent.id);
    router.push(`/agent/${currentAgent.id}?chat=${chatId}`);
  };
  
  return (
    <View style={styles.container}>
      {showCamera ? (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraHeader}>
            <Text variant="h3" style={styles.cameraTitle}>
              {currentAgent?.name || "Assistant"}
            </Text>
            <Button
              title="Close"
              variant="outline"
              onPress={() => setShowCamera(false)}
              size="small"
            />
          </View>
          <EnhancedCameraView />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text variant="h2" style={styles.title}>
              Choose an Assistant
            </Text>
            <Button
              title=""
              variant="ghost"
              onPress={() => setShowInfo(true)}
              icon={<Info size={24} color={colors.primary} />}
              style={styles.infoButton}
            />
          </View>
          <Text variant="body" color="textSecondary" style={styles.subtitle}>
            Select the type of assistance you need
          </Text>
          
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onPress={() => handleAgentSelect(agent.id)}
              isSelected={currentAgent?.id === agent.id}
            />
          ))}
          
          {currentAgent && (
            <View style={styles.actionContainer}>
              <Text variant="h3" style={styles.selectedTitle}>
                {currentAgent.name} Selected
              </Text>
              <Text variant="body" color="textSecondary" style={styles.selectedDescription}>
                {currentAgent.description}
              </Text>
              
              <View style={styles.examplesContainer}>
                <Text variant="body" style={styles.examplesTitle}>
                  Example queries:
                </Text>
                {currentAgent.examples.map((example, index) => (
                  <Text key={index} variant="body2" color="textSecondary" style={styles.exampleItem}>
                    • {example}
                  </Text>
                ))}
              </View>
              
              <View style={styles.buttonContainer}>
                <Button
                  title="Start Camera"
                  onPress={handleStartCamera}
                  icon={<Camera size={20} color={colors.white} />}
                  style={styles.button}
                />
                <Button
                  title="Start Chat"
                  variant="secondary"
                  onPress={handleStartChat}
                  icon={<MessageSquare size={20} color={colors.white} />}
                  style={styles.button}
                />
              </View>
            </View>
          )}
        </ScrollView>
      )}
      
      <Modal
        visible={showInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text variant="h2" style={styles.modalTitle}>
              About Gemma 3n Integration
            </Text>
            <Text variant="body" style={styles.modalText}>
              This app uses Google's Gemma 3n multimodal AI model to provide intelligent assistance for Nigerian cuisine and kitchen tasks.
            </Text>
            <Text variant="body" style={styles.modalText}>
              Gemma 3n can analyze images from your camera, understand voice commands, and provide real-time guidance in multiple Nigerian languages.
            </Text>
            <Text variant="h3" style={styles.modalSubtitle}>
              Key Features:
            </Text>
            <Text variant="body" style={styles.modalListItem}>
              • Real-time analysis of cooking techniques
            </Text>
            <Text variant="body" style={styles.modalListItem}>
              • Voice recognition in English, Yoruba, Igbo, and Hausa
            </Text>
            <Text variant="body" style={styles.modalListItem}>
              • Specialized agents for different kitchen tasks
            </Text>
            <Text variant="body" style={styles.modalListItem}>
              • Nigerian cuisine expertise (jollof rice, egusi soup, etc.)
            </Text>
            <Button
              title="Close"
              onPress={() => setShowInfo(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    flex: 1,
  },
  infoButton: {
    width: 40,
    height: 40,
  },
  subtitle: {
    marginBottom: 24,
  },
  actionContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  selectedTitle: {
    marginBottom: 8,
  },
  selectedDescription: {
    marginBottom: 16,
  },
  examplesContainer: {
    marginBottom: 24,
  },
  examplesTitle: {
    marginBottom: 8,
    color: colors.primary,
  },
  exampleItem: {
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.surface,
  },
  cameraTitle: {
    color: colors.text,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 500,
  },
  modalTitle: {
    marginBottom: 16,
    color: colors.primary,
  },
  modalSubtitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    marginBottom: 12,
  },
  modalListItem: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  modalButton: {
    marginTop: 24,
  },
});