import { useRive } from '@rive-app/react-canvas'

type RiveCanvasProps = {
  src: string
}

export function RiveCanvas({ src }: RiveCanvasProps) {
  const { RiveComponent } = useRive({
    src,
    autoplay: true,
  })

  return (
    <div className="rive-canvas-wrapper">
      <RiveComponent />
    </div>
  )
}
