import { Agent } from "@/types";

export const agents: Agent[] = [
  {
    id: "cooking",
    name: "Chef Assistant",
    description: "Guides you through recipes and cooking techniques",
    color: "#F2994A",
    emoji: "👨‍🍳",
    examples: [
      "Guide me through making jollof rice",
      "What's the best way to prepare egusi soup?",
      "How do I know when my suya is properly cooked?",
    ],
    capabilities: [
      "Recipe guidance",
      "Cooking techniques",
      "Ingredient substitution",
      "Temperature monitoring",
      "Timing assistance"
    ],
  },
  {
    id: "inventory",
    name: "Inventory Manager",
    description: "Helps track and manage kitchen inventory",
    color: "#2D9CDB",
    emoji: "📦",
    examples: [
      "Count how many tomatoes I have",
      "Track my palm oil usage",
      "Alert me when rice is running low",
    ],
    capabilities: [
      "Inventory tracking",
      "Stock level monitoring",
      "Expiration date alerts",
      "Usage analytics",
      "Reorder suggestions"
    ],
  },
  {
    id: "training",
    name: "Staff Trainer",
    description: "Assists with employee training and skill development",
    color: "#10B981",
    emoji: "🎓",
    examples: [
      "Evaluate my pounding technique for fufu",
      "Track employee progress on making moi moi",
      "Provide feedback on my knife skills",
    ],
    capabilities: [
      "Skill assessment",
      "Progress tracking",
      "Technique evaluation",
      "Training modules",
      "Performance feedback"
    ],
  },
  {
    id: "service",
    name: "Customer Service",
    description: "Helps with customer interactions and service",
    color: "#8B5CF6",
    emoji: "💁",
    examples: [
      "Suggest greeting scripts for customers",
      "Help me explain menu items to tourists",
      "Track customer preferences",
    ],
    capabilities: [
      "Customer interaction",
      "Menu explanation",
      "Preference tracking",
      "Service optimization",
      "Communication assistance"
    ],
  },
  {
    id: "maintenance",
    name: "Equipment Monitor",
    description: "Identifies issues with kitchen equipment",
    color: "#EC4899",
    emoji: "🔧",
    examples: [
      "Check if my stove is working properly",
      "Identify issues with my blender",
      "Suggest maintenance for my refrigerator",
    ],
    capabilities: [
      "Equipment diagnostics",
      "Maintenance scheduling",
      "Issue identification",
      "Performance monitoring",
      "Repair guidance"
    ],
  },
];