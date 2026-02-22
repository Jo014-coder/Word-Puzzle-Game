import { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import GameTile from './GameTile';
import { useGame, DIFFICULTY_CONFIG } from '@/contexts/GameContext';

export default function GameGrid() {
  const { difficulty, guesses, shakeRow, revealRow, clearShake, clearReveal } = useGame();
  const { width } = useWindowDimensions();

  const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;
  if (!config || guesses.length === 0) return null;

  const maxGridWidth = Math.min(width - 32, 380);
  const tileSize = Math.floor((maxGridWidth - config.wordLength * 4) / config.wordLength);
  const clampedTileSize = Math.min(tileSize, 58);

  return (
    <View style={styles.container}>
      {guesses.map((row, rowIdx) => (
        <View key={rowIdx} style={styles.row}>
          {row.map((tile, colIdx) => (
            <GameTile
              key={`${rowIdx}-${colIdx}`}
              letter={tile.letter}
              status={tile.status}
              index={colIdx}
              shouldReveal={revealRow === rowIdx}
              shouldShake={shakeRow === rowIdx}
              tileSize={clampedTileSize}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    marginVertical: 2,
  },
});
