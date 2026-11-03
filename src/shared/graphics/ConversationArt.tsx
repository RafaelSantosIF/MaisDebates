import { Canvas, Circle, Group, Line, Path, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

type ConversationArtProps = {
  variant?: 'onboarding' | 'invite' | 'expired';
};

export function ConversationArt({ variant = 'onboarding' }: ConversationArtProps) {
  const expired = variant === 'expired';
  const invite = variant === 'invite' || expired;

  return (
    <View accessibilityLabel="Ilustração de balões de conversa" style={[styles.box, invite && styles.inviteBox]}>
      <Canvas style={styles.canvas}>
        <Circle cx={255} cy={92} r={104} color="#EAF3FF" />
        <Circle cx={115} cy={182} r={88} color="#D9E9FF" opacity={0.7} />
        <Circle cx={280} cy={192} r={83} color="#E6F0FF" opacity={0.8} />
        <Path path="M20 170 C38 112 87 94 134 69 C177 46 210 45 250 61 C286 76 328 91 345 135 C364 183 329 227 274 239 C218 251 178 236 131 244 C77 254 31 233 20 200 C16 190 16 180 20 170 Z" color="#DCEBFF" opacity={0.48} />

        {!expired ? (
          <>
            <Group transform={[{ translateX: 150 }, { translateY: 133 }, { rotate: -0.16 }, { translateX: -150 }, { translateY: -133 }]}>
              <RoundedRect x={52} y={79} width={176} height={122} r={26} color="#FFFFFF" />
              <RoundedRect x={76} y={111} width={122} height={8} r={4} color="#A9CCFF" />
              <RoundedRect x={76} y={130} width={92} height={8} r={4} color="#B9D5FF" />
              <RoundedRect x={76} y={149} width={58} height={8} r={4} color="#B9D5FF" />
              <Path path="M86 187 L100 222 L128 192 Z" color="#FFFFFF" />
            </Group>
            <Group transform={[{ translateX: 251 }, { translateY: 171 }, { rotate: 0.12 }, { translateX: -251 }, { translateY: -171 }]}>
              <RoundedRect x={172} y={119} width={158} height={115} r={27} color="#214D99" />
              <RoundedRect x={197} y={151} width={103} height={8} r={4} color="#A9CEFF" />
              <RoundedRect x={197} y={171} width={76} height={8} r={4} color="#A9CEFF" />
              <RoundedRect x={197} y={191} width={48} height={8} r={4} color="#A9CEFF" />
              <Path path="M199 222 L185 249 L230 225 Z" color="#214D99" />
            </Group>
          </>
        ) : (
          <>
            <Group transform={[{ translateX: 150 }, { translateY: 139 }, { rotate: -0.13 }, { translateX: -150 }, { translateY: -139 }]}>
              <RoundedRect x={57} y={83} width={174} height={133} r={25} color="#FFFFFF" />
              <Circle cx={144} cy={119} r={9} color="#214D99" />
              <Path path="M130 144 C131 128 156 128 158 144 L158 151 L130 151 Z" color="#3677E8" />
              <RoundedRect x={86} y={163} width={106} height={7} r={4} color="#BED8FF" />
              <RoundedRect x={89} y={180} width={72} height={7} r={4} color="#A9CCFF" />
              <Path path="M75 202 L112 231 L137 211 Z" color="#FFFFFF" />
            </Group>
            <Group transform={[{ translateX: 255 }, { translateY: 178 }, { rotate: 0.11 }, { translateX: -255 }, { translateY: -178 }]}>
              <RoundedRect x={181} y={127} width={151} height={105} r={26} color="#214D99" />
              <RoundedRect x={203} y={157} width={96} height={7} r={4} color="#A9CEFF" />
              <RoundedRect x={203} y={175} width={75} height={7} r={4} color="#A9CEFF" />
              <RoundedRect x={203} y={193} width={48} height={7} r={4} color="#A9CEFF" />
              <Path path="M211 222 L198 249 L239 225 Z" color="#214D99" />
            </Group>
            <Circle cx={295} cy={66} r={22} color="#3478E8" />
            <Line p1={{ x: 295, y: 55 }} p2={{ x: 295, y: 77 }} color="#FFFFFF" strokeWidth={5} strokeCap="round" />
            <Line p1={{ x: 284, y: 66 }} p2={{ x: 306, y: 66 }} color="#FFFFFF" strokeWidth={5} strokeCap="round" />
          </>
        )}

        <Line p1={{ x: 42, y: 68 }} p2={{ x: 31, y: 53 }} color="#3478E8" strokeWidth={7} strokeCap="round" />
        <Line p1={{ x: 29, y: 93 }} p2={{ x: 14, y: 86 }} color="#3478E8" strokeWidth={7} strokeCap="round" />
        <Line p1={{ x: 29, y: 114 }} p2={{ x: 12, y: 116 }} color="#3478E8" strokeWidth={7} strokeCap="round" />
        <Line p1={{ x: 308, y: 93 }} p2={{ x: 324, y: 81 }} color="#FFC63D" strokeWidth={7} strokeCap="round" />
        <Line p1={{ x: 296, y: 70 }} p2={{ x: 304, y: 53 }} color="#FFC63D" strokeWidth={7} strokeCap="round" />
      </Canvas>
    </View>
  );
}

export type GlyphName = 'people' | 'idea' | 'civic' | 'shield' | 'calendar' | 'leaf' | 'comments' | 'person' | 'link' | 'check' | 'arrow-left' | 'brand' | 'dot' | 'debates' | 'activity' | 'profile' | 'lock' | 'book' | 'help';

export function SkiaGlyph({ name, size = 40, color = '#214D99' }: { name: GlyphName; size?: number; color?: string }) {
  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ scale: size / 40 }]}>
      {name === 'people' ? <>
        <Circle cx={20} cy={12} r={5} color={color} />
        <Circle cx={8} cy={17} r={4} color={color} opacity={0.8} />
        <Circle cx={32} cy={17} r={4} color={color} opacity={0.8} />
        <Path path="M8 34 C8 24 13 20 20 20 C27 20 32 24 32 34 Z" color={color} />
        <Path path="M1 32 C1 25 3 22 8 21 M39 32 C39 25 37 22 32 21" color={color} style="stroke" strokeWidth={3} strokeCap="round" />
      </> : null}
      {name === 'idea' ? <>
        <Path path="M12 17 C12 8 28 8 28 17 C28 22 24 24 23 28 L17 28 C16 24 12 22 12 17 Z" color={color} style="stroke" strokeWidth={3} />
        <Line p1={{ x: 17, y: 32 }} p2={{ x: 23, y: 32 }} color={color} strokeWidth={3} strokeCap="round" />
        <Line p1={{ x: 17, y: 36 }} p2={{ x: 23, y: 36 }} color={color} strokeWidth={3} strokeCap="round" />
        <Line p1={{ x: 20, y: 1 }} p2={{ x: 20, y: 5 }} color={color} strokeWidth={2.5} strokeCap="round" />
        <Line p1={{ x: 4, y: 8 }} p2={{ x: 7, y: 11 }} color={color} strokeWidth={2.5} strokeCap="round" />
        <Line p1={{ x: 36, y: 8 }} p2={{ x: 33, y: 11 }} color={color} strokeWidth={2.5} strokeCap="round" />
      </> : null}
      {name === 'civic' ? <>
        <Path path="M4 14 L20 4 L36 14 Z" color={color} />
        <RoundedRect x={5} y={16} width={30} height={3} r={1} color={color} />
        <RoundedRect x={4} y={34} width={32} height={4} r={1} color={color} />
        <RoundedRect x={8} y={19} width={4} height={13} r={1} color={color} />
        <RoundedRect x={18} y={19} width={4} height={13} r={1} color={color} />
        <RoundedRect x={28} y={19} width={4} height={13} r={1} color={color} />
      </> : null}
      {name === 'shield' ? <>
        <Path path="M20 3 L34 9 L33 23 C31 30 25 35 20 38 C15 35 9 30 7 23 L6 9 Z" color={color} style="stroke" strokeWidth={3} />
        <Path path="M13 20 L18 25 L28 14" color={color} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" />
      </> : null}
      {name === 'calendar' ? <>
        <RoundedRect x={5} y={8} width={30} height={27} r={4} color={color} style="stroke" strokeWidth={3} />
        <Line p1={{ x: 5, y: 15 }} p2={{ x: 35, y: 15 }} color={color} strokeWidth={3} />
        <Line p1={{ x: 13, y: 4 }} p2={{ x: 13, y: 11 }} color={color} strokeWidth={3} strokeCap="round" />
        <Line p1={{ x: 27, y: 4 }} p2={{ x: 27, y: 11 }} color={color} strokeWidth={3} strokeCap="round" />
      </> : null}
      {name === 'leaf' ? <>
        <Path path="M20 36 C7 26 9 12 30 6 C31 23 28 32 20 36 Z" color={color} />
        <Path path="M12 30 C18 24 22 19 28 12" color="#FFFFFF" style="stroke" strokeWidth={2.5} />
      </> : null}
      {name === 'comments' ? <>
        <RoundedRect x={4} y={6} width={32} height={25} r={8} color={color} style="stroke" strokeWidth={3} />
        <Path path="M12 30 L9 37 L19 30" color={color} />
        <Line p1={{ x: 12, y: 15 }} p2={{ x: 28, y: 15 }} color={color} strokeWidth={2.5} strokeCap="round" />
        <Line p1={{ x: 12, y: 21 }} p2={{ x: 24, y: 21 }} color={color} strokeWidth={2.5} strokeCap="round" />
      </> : null}
      {name === 'person' ? <>
        <Circle cx={20} cy={12} r={7} color={color} style="stroke" strokeWidth={3} />
        <Path path="M7 36 C7 26 12 22 20 22 C28 22 33 26 33 36" color={color} style="stroke" strokeWidth={3} strokeCap="round" />
      </> : null}
      {name === 'link' ? <Path path="M16 26 L12 30 C8 34 2 28 6 24 L14 16 C17 13 20 14 22 16 M24 14 L28 10 C32 6 38 12 34 16 L26 24 C23 27 20 26 18 24 M13 27 L27 13" color={color} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" /> : null}
      {name === 'check' ? <Path path="M8 20 L16 28 L32 11" color={color} style="stroke" strokeWidth={4} strokeCap="round" strokeJoin="round" /> : null}
      {name === 'dot' ? <Circle cx={20} cy={20} r={16} color={color} /> : null}
      {name === 'arrow-left' ? <Path path="M25 6 L11 20 L25 34" color={color} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" /> : null}
      {name === 'debates' ? <>
        <RoundedRect x={5} y={5} width={30} height={27} r={4} color={color} style="stroke" strokeWidth={2.5} />
        <Path path="M12 32 L9 37 L19 32" color={color} style="stroke" strokeWidth={2.5} strokeCap="round" strokeJoin="round" />
        <Line p1={{ x: 11, y: 15 }} p2={{ x: 26, y: 15 }} color={color} strokeWidth={2} strokeCap="round" />
        <Line p1={{ x: 11, y: 21 }} p2={{ x: 23, y: 21 }} color={color} strokeWidth={2} strokeCap="round" />
      </> : null}
      {name === 'activity' ? <>
        <Path path="M5 9 C5 5 10 4 13 7 L20 14 L27 7 C30 4 35 5 35 9 L35 26 C35 31 30 34 25 34 L15 34 C9 34 5 31 5 26 Z" color={color} style="stroke" strokeWidth={2.5} strokeJoin="round" />
        <Line p1={{ x: 11, y: 19 }} p2={{ x: 29, y: 19 }} color={color} strokeWidth={2} strokeCap="round" />
        <Line p1={{ x: 11, y: 25 }} p2={{ x: 25, y: 25 }} color={color} strokeWidth={2} strokeCap="round" />
      </> : null}
      {name === 'profile' ? <>
        <Circle cx={20} cy={12} r={6} color={color} style="stroke" strokeWidth={2.5} />
        <Path path="M7 35 C7 27 12 23 20 23 C28 23 33 27 33 35" color={color} style="stroke" strokeWidth={2.5} strokeCap="round" />
      </> : null}
      {name === 'lock' ? <>
        <RoundedRect x={8} y={17} width={24} height={19} r={3} color={color} style="stroke" strokeWidth={2.5} />
        <Path path="M13 17 L13 12 C13 3 27 3 27 12 L27 17" color={color} style="stroke" strokeWidth={2.5} strokeCap="round" />
      </> : null}
      {name === 'book' ? <>
        <Path path="M5 8 C11 6 16 7 20 10 L20 34 C16 31 11 30 5 32 Z M35 8 C29 6 24 7 20 10 L20 34 C24 31 29 30 35 32 Z" color={color} style="stroke" strokeWidth={2.5} strokeJoin="round" />
      </> : null}
      {name === 'help' ? <>
        <Circle cx={20} cy={20} r={16} color={color} style="stroke" strokeWidth={2.5} />
        <Path path="M15 15 C15 9 25 9 25 15 C25 19 20 19 20 24" color={color} style="stroke" strokeWidth={2.5} strokeCap="round" />
        <Circle cx={20} cy={30} r={1.5} color={color} />
      </> : null}
      {name === 'brand' ? <>
        <Path path="M3 16 C3 6 10 1 20 1 C29 1 36 8 36 17 C36 24 32 29 26 32 L26 39 L17 33 C9 32 3 26 3 16 Z" color="#17396F" />
        <Path path="M17 22 C17 13 23 8 31 8 C38 8 40 15 40 22 C40 28 36 32 31 34 L31 39 L25 34 C20 32 17 28 17 22 Z" color="#4386F3" />
        <Line p1={{ x: 29, y: 16 }} p2={{ x: 29, y: 28 }} color="#FFFFFF" strokeWidth={3.5} strokeCap="round" />
        <Line p1={{ x: 23, y: 22 }} p2={{ x: 35, y: 22 }} color="#FFFFFF" strokeWidth={3.5} strokeCap="round" />
      </> : null}
      </Group>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  box: { height: 286, marginTop: 18, marginBottom: 22, alignSelf: 'stretch' },
  inviteBox: { height: 254, marginTop: 4, marginBottom: 14 },
  canvas: { width: '100%', height: '100%' },
});
