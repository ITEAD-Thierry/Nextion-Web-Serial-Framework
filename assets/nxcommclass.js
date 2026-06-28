class nxComm {
	#port = null;
	#reader = null;
	#nxTerminator = Uint8Array.from([255, 255, 255]);
	#logCallback = null;

	set logCallback(lcb) {
		this.#logCallback = lcb;
	}

	listen(port = null) {
		if (port != null) {
			this.#port = port;
			const asyncHdl = new Promise((resolve) => {
				(async () => {
					this.#reader = this.#port.readable.getReader();
					let inBuff = new Uint8Array(4096);
					let inOffs = 0;
					let ff3Start, ff3Detect, slice, res;
					while (true) {
						const { value, done } = await this.#reader.read();
						if (done) {
							this.#reader.releaseLock();
							break;
						}
						for (const i of value) {
							inBuff[inOffs++] = i;
							ff3Start = (inBuff[0] !== 0x71 ? 0 : 7);
							ff3Detect = (inOffs > ff3Start ? inBuff.slice(inOffs - 3, inOffs).reduce((acc, val) => (acc << 8) | val, 0) : 0);
							if (ff3Detect == 0x00FFFFFF) {
								slice = inBuff.slice(0, inOffs - 3);
								inOffs = 0;
								res = new nxData(slice);
								if (this.#logCallback) {
									this.#logCallback(res);
								}else{
									console.log(res);
								}
							}
						}
					}
					await this.#port.close();
					resolve();
				})().catch(e => { alert(e.message) });
			});
		} else {
			this.#reader.cancel();
		}
	}


	async sendText(text, add3ff = true) {
		const enc = new TextEncoder();
		const bytes = enc.encode(text);
		let res = new nxData(bytes, false);
		await this.sendBytes(bytes, add3ff);
		if (this.#logCallback) {
			this.#logCallback(res);
		}
	}

	async sendBytes(bytes, add3ff = true) {
		const writer = this.#port.writable.getWriter();
		await writer.write(bytes);
		if (add3ff) {
			await writer.write(this.#nxTerminator);
		}
		await writer.close();
	}
}
