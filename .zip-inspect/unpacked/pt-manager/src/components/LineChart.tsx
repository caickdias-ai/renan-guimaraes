import { useState } from 'react';
import { LayoutChangeEvent, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import type { Ponto } from '../lib/progresso';

const H = 170, PX = 28, PT = 22, PB = 26;
const fmt = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);

export default function LineChart({ pontos, cor = '#303030' }: { pontos: Ponto[]; cor?: string }) {
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  if (pontos.length < 2) {
    return <Text style={{ color: '#666', paddingVertical: 24, textAlign: 'center' }}>Registre ao menos 2 valores para ver o gráfico.</Text>;
  }
  const ys = pontos.map((p) => p.v);
  const min = Math.min(...ys), max = Math.max(...ys), faixa = max - min || 1;
  const X = (i: number) => PX + (i * (w - 2 * PX)) / (pontos.length - 1);
  const Y = (v: number) => PT + ((max - v) / faixa) * (H - PT - PB);

  return (
    <View onLayout={onLayout}>
      {w > 0 && (
        <Svg width={w} height={H}>
          <Line x1={PX} x2={w - PX} y1={H - PB} y2={H - PB} stroke="#ddd" />
          <Polyline fill="none" stroke={cor} strokeWidth={2.5} points={pontos.map((p, i) => `${X(i)},${Y(p.v)}`).join(' ')} />
          {pontos.map((p, i) => (
            <Circle key={i} cx={X(i)} cy={Y(p.v)} r={4} fill={cor} />
          ))}
          {pontos.map((p, i) => (
            // com muitos pontos, mostra só o primeiro, o último e alguns intermediários
            (pontos.length <= 8 || i === 0 || i === pontos.length - 1 || i % Math.ceil(pontos.length / 6) === 0) && (
              <SvgText key={'t' + i} x={X(i)} y={Y(p.v) - 8} fontSize={10} fill="#444" textAnchor="middle">{p.v}</SvgText>
            )
          ))}
          <SvgText x={X(0)} y={H - 8} fontSize={10} fill="#888" textAnchor="start">{fmt(pontos[0].d)}</SvgText>
          <SvgText x={X(pontos.length - 1)} y={H - 8} fontSize={10} fill="#888" textAnchor="end">{fmt(pontos[pontos.length - 1].d)}</SvgText>
        </Svg>
      )}
    </View>
  );
}
