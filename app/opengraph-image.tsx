import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'Papaia · Contratos Inteligentes'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Recria o papaia-logo.svg via divs CSS para o Satori (não suporta SVG em <img>).
// Coordenadas originais: viewBox 0 0 200 200. Escala usada: 2.4× → 480×480.
const S = 2.4

function Logo() {
  return (
    <div
      style={{
        width: 200 * S, height: 200 * S,
        borderRadius: 44 * S,
        background: '#FAF6F1',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexShrink: 0,
      }}
    >
      {/* Ellipse coral — cx=70 cy=80 rx=80 ry=75 */}
      <div style={{
        position: 'absolute',
        width:  160 * S, height: 150 * S,
        borderRadius: '50%',
        background: '#E8735A',
        opacity: 0.92,
        left: (70 - 80) * S, top: (80 - 75) * S,
      }} />
      {/* Ellipse verde — cx=145 cy=130 rx=70 ry=65 */}
      <div style={{
        position: 'absolute',
        width:  140 * S, height: 130 * S,
        borderRadius: '50%',
        background: '#8BAD8B',
        opacity: 0.85,
        left: (145 - 70) * S, top: (130 - 65) * S,
      }} />
      {/* Ellipse âmbar — cx=160 cy=55 rx=45 ry=40 */}
      <div style={{
        position: 'absolute',
        width:  90 * S, height: 80 * S,
        borderRadius: '50%',
        background: '#F0A030',
        opacity: 0.55,
        left: (160 - 45) * S, top: (55 - 40) * S,
      }} />
      {/* Triângulo branco — points="100,57 148,92 52,92" */}
      <div style={{
        position: 'absolute',
        width: 0, height: 0,
        borderLeft:   `${48 * S}px solid transparent`,
        borderRight:  `${48 * S}px solid transparent`,
        borderBottom: `${35 * S}px solid rgba(255,255,255,0.95)`,
        left: (100 - 48) * S, top: 57 * S,
      }} />
      {/* Rect branco — x=70 y=92 w=60 h=44 */}
      <div style={{
        position: 'absolute',
        width: 60 * S, height: 44 * S,
        background: 'rgba(255,255,255,0.95)',
        left: 70 * S, top: 92 * S,
      }} />
      {/* Porta — x=89 y=108 w=22 h=28 rx=3 */}
      <div style={{
        position: 'absolute',
        width: 22 * S, height: 28 * S,
        borderRadius: 3 * S,
        background: '#E8735A',
        opacity: 0.5,
        left: 89 * S, top: 108 * S,
      }} />
    </div>
  )
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 72,
          background: '#FAF6F1',
        }}
      >
        <Logo />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{
            fontSize: 96, fontWeight: 800,
            color: '#1e293b', fontFamily: 'sans-serif', lineHeight: 1,
          }}>
            Papaia
          </span>
          <span style={{
            fontSize: 36, color: '#64748b',
            fontFamily: 'sans-serif', fontWeight: 500,
          }}>
            Contratos Inteligentes
          </span>
          <span style={{
            fontSize: 26, color: '#94a3b8',
            fontFamily: 'sans-serif', marginTop: 8,
          }}>
            contratos.usepapaia.com.br
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
