class nxComm {
	#nxTerminator = Uint8Array.from([255, 255, 255]);
	#streams = { port: null, reader: null, keeprd: false, writer: null, };
	#dataCallback = {};

	constructor(dataCallback) {
		this.dataCallback = dataCallback
	}

	set dataCallback(dataCallback) { this.#dataCallback = dataCallback}
	get dataCallback() {return this.#dataCallback}
	get isListening() { return (this.#streams.port && this.#streams.port.readable && this.#streams.keeprd) !== null }

	async #readUntilClosed() {
		while (this.#streams.port.readable && this.#streams.keeprd) {
			this.#streams.reader = this.#streams.port.readable.getReader();
			let inBuff = new Uint8Array(5192), inOffs = 0, ff3Start, ff3Detect, slice, res
			try {
				while (true) {
					const { value, done } = await this.#streams.reader.read();
					if (done) break
					for (const i of value) {
						inBuff[inOffs++] = i
						ff3Start = (inBuff[0] !== 0x71 ? 0 : 7)
						ff3Detect = (inOffs > ff3Start ? inBuff.slice(inOffs - 3, inOffs).reduce((acc, val) => (acc << 8) | val, 0) : 0);
						if (ff3Detect == 0x00FFFFFF) {
							slice = inBuff.slice(0, inOffs - 3);
							inOffs = 0
							res = new nxData(slice)
							this.#dataCallback(res)
						}
					}
				}
			}
			catch (e) { console.log('readloop catch:', e) }
			finally { this.#streams.reader.releaseLock() }
		}
		await this.#streams.port.close().catch(console.log)
	}

	startRd(port = null) {
		if (port !== null) {
			this.#streams.port = port
			this.#streams.keeprd = true
			this.#readUntilClosed()
		}
	}

	async killRd() {
		this.#streams.keeprd = false;
		return this.#streams.reader?.cancel().catch((e) => { console.log(e) })
	}

	async sendText(text, crtn) {
		const t = new TextEncoder
		const bytes = t.encode(text)
		const res = new nxData(bytes, false)
		return this.sendBytes(bytes).then(() => {
			if (crtn) { this.#dataCallback(res) }
		})
	}

	async sendBytes(bytes) {
		const w = this.#streams.port.writable.getWriter()
		return w.write(bytes).then(w.releaseLock())
	}
}
