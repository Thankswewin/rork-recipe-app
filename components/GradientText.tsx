import React from "react";
import { Text, TextProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

interface GradientTextProps extends TextProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children: React.ReactNode;
}

export default function GradientText({ 
  colors, 
  start = { x: 0, y: 0 }, 
  end = { x: 1, y: 0 }, 
  children, 
  style,
  ...props 
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text {...props} style={[style, { backgroundColor: 'transparent' }]}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={start}
        end={end}
        style={style}
      >
        <Text {...props} style={[style, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}