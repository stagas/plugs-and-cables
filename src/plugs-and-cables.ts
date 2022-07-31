import { dispatch, EventHandler } from 'event-toolkit'
import { cheapRandomId } from 'everyday-utils'

export enum PlugKind {
  Input = 'input',
  Output = 'output',
}

export class Plug<P extends PlugKind = any, C extends string = any> extends EventTarget {
  static Output = PlugKind.Output as const
  static Input = PlugKind.Input as const

  plugKind!: P
  cableKind!: C

  cables = new Map<Cable, Plug<(P extends PlugKind.Output ? PlugKind.Input : PlugKind.Output), C>>()

  declare onconnect: EventHandler<Plug, CustomEvent<{ cable: Cable; plug: Plug }>>
  declare ondisconnect: EventHandler<Plug, CustomEvent<{ cable: Cable; plug: Plug }>>

  constructor(
    plug: Plug<P, C>,
  )
  constructor(
    plugKind: P | Plug<P, C>,
    cableKind: C,
  )
  constructor(
    plugKind: P | Plug<P, C>,
    cableKind?: C,
  ) {
    super()
    if (typeof plugKind === 'object') {
      Object.assign(this, plugKind)
    } else {
      this.plugKind = plugKind
      this.cableKind = cableKind!
    }
  }

  connect(this: Plug, other: Plug, cable = new Cable()) {
    this.cables.set(cable, other)
    other.cables.set(cable, this)
    dispatch(this, 'connect', { cable, plug: other })
    dispatch(other, 'connect', { cable, plug: this })
    return cable
  }

  disconnect(this: Plug, cable: Cable) {
    const other = this.cables.get(cable)
    if (!other) {
      throw new Error('Cable not connected')
    }
    this.cables.delete(cable)
    other.cables.delete(cable)
    dispatch(this, 'disconnect', { cable, plug: other })
    dispatch(other, 'disconnect', { cable, plug: this })
    return cable
  }
}

export class Cable {
  id = cheapRandomId()

  outputCh!: number
  inputCh!: number

  constructor(
    cable: Cable,
  )
  constructor(
    outputCh?: number,
    inputCh?: number,
  )
  constructor(
    outputCh: Cable | number = 0,
    inputCh = 0,
  ) {
    if (typeof outputCh === 'object') {
      Object.assign(this, outputCh)
    } else {
      this.outputCh = outputCh as number
      this.inputCh = inputCh
    }
  }
}

// const output = new Plug(Plug.Output, 'audio')
// const input = new Plug(Plug.Input, 'audio')
