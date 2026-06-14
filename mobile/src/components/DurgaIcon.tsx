import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, {
  Circle, Ellipse, Polygon, Rect, Path, Line, Defs,
  RadialGradient, Stop,
} from "react-native-svg";

interface Props {
  size?: number;
}

export function DurgaIcon({ size = 36 }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });
  const scale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.04] });
  const height  = size * (54 / 48);

  return (
    <Animated.View style={{ width: size, height, opacity, transform: [{ scale }] }}>
      <Svg width={size} height={height} viewBox="0 0 48 54">
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        {/* Halo */}
        <Circle cx="24" cy="30" r="22" fill="url(#halo)" />

        {/* Mukut (crown) */}
        <Polygon points="24,1 21,12 27,12" fill="#DAA520" />
        <Polygon points="13,5 11,14 18,13" fill="#DAA520" />
        <Polygon points="35,5 37,14 30,13" fill="#DAA520" />
        <Rect x="11" y="12" width="26" height="4" rx="2" fill="#B8860B" />
        <Circle cx="24" cy="14" r="2" fill="#FF4444" />
        <Circle cx="16" cy="14" r="1.3" fill="#FFD700" />
        <Circle cx="32" cy="14" r="1.3" fill="#FFD700" />

        {/* Face */}
        <Ellipse cx="24" cy="34" rx="14" ry="15" fill="#F5C842" />

        {/* Eyes — whites */}
        <Ellipse cx="18.5" cy="31.5" rx="3.5" ry="2.5" fill="white" />
        <Ellipse cx="29.5" cy="31.5" rx="3.5" ry="2.5" fill="white" />
        {/* Pupils */}
        <Circle cx="18.5" cy="31.5" r="1.8" fill="#1a1a1a" />
        <Circle cx="29.5" cy="31.5" r="1.8" fill="#1a1a1a" />
        {/* Shine */}
        <Circle cx="19.3" cy="30.8" r="0.6" fill="white" />
        <Circle cx="30.3" cy="30.8" r="0.6" fill="white" />

        {/* Third eye + mini trishul */}
        <Ellipse cx="24" cy="27" rx="2.2" ry="1.6" fill="#B22222" />
        <Line x1="24" y1="24.5" x2="24" y2="22" stroke="#B22222" strokeWidth="1.2" />
        <Line x1="22.5" y1="23" x2="24" y2="24.5" stroke="#B22222" strokeWidth="1" />
        <Line x1="25.5" y1="23" x2="24" y2="24.5" stroke="#B22222" strokeWidth="1" />

        {/* Nose */}
        <Ellipse cx="24" cy="36" rx="1.2" ry="1.8" fill="#D4940A" opacity={0.6} />

        {/* Lips */}
        <Path d="M 19.5 40.5 Q 24 43.5 28.5 40.5" stroke="#C0392B" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Earrings */}
        <Circle cx="10.5" cy="33" r="2" fill="#DAA520" />
        <Circle cx="10.5" cy="33" r="1" fill="#FF4444" />
        <Circle cx="37.5" cy="33" r="2" fill="#DAA520" />
        <Circle cx="37.5" cy="33" r="1" fill="#FF4444" />
      </Svg>
    </Animated.View>
  );
}
