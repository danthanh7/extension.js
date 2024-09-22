import {Buffer} from 'buffer'
import net from 'net'

export const loadFirefoxAddon = (
  port: number,
  host: string,
  addonPath: string
) => {
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({
      port,
      host
    })

    let success = false

    socket.once('error', () => {})
    socket.once('close', () => {
      resolve(success)
    })

    const send = (data: Record<string, string>) => {
      const raw = Buffer.from(JSON.stringify(data))

      socket.write(`${raw.length}`)
      socket.write(':')
      socket.write(raw)
    }

    send({
      to: 'root',
      type: 'getRoot'
    })

    const onMessage = (message: any) => {
      if (message.addonsActor) {
        send({
          to: message.addonsActor,
          type: 'installTemporaryAddon',
          addonPath
        })
      }

      if (message.addon) {
        success = true
        socket.end()
      }

      if (message.error) {
        socket.end()
      }
    }

    const buffers: Buffer[] = []
    // let remainingBytes = 0

    socket.on('data', (data) => {
      buffers.push(data)

      const buffer = Buffer.concat(buffers)
      const colonIndex = buffer.indexOf(':')

      if (colonIndex === -1) return

      const expectedLength = parseInt(
        buffer.subarray(0, colonIndex).toString(),
        10
      )

      if (!Number.isFinite(expectedLength)) {
        throw new Error('Invalid message size')
      }

      const remainingData = buffer.subarray(colonIndex + 1)
      if (remainingData.length >= expectedLength) {
        const message = remainingData.subarray(0, expectedLength).toString()
        buffers.length = 0 // Clear buffer after processing

        try {
          const json = JSON.parse(message)
          onMessage(json)
        } catch (error) {
          console.error('Error parsing JSON:', error)
        }
      }
    })
  })
}
