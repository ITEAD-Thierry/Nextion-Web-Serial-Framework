class nxUI {
	static get errors() {
		return {
			0x00: 'invalid instruction', 0x02: 'invalid componentID', 0x03: 'invalid pageID',
			0x04: 'invalid pictureID', 0x05: 'invalid fontID', 0x06: 'invalid file operation',
			0x09: 'invalid CRC', 0x11: 'invalid baud rate', 0x12: 'invalid waveformID or channel#',
			0x1a: 'invalid variable name or attribute', 0x1b: 'invalid variable operation',
			0x1c: 'attribute assignment failed', 0x1d: 'eeprom operation failed',
			0x1e: 'invalid number of parameters', 0x1f: 'invalid IO operation',
			0x20: 'invalid escape character', 0x23: 'variable name too long', 0x24: 'serial buffer overflow'
		};
	}
	static get status() {
		return {
			0x01: 'instruction success', 0x86: 'auto entered sleep mode', 0x87: 'auto wake from sleep',
			0x88: 'nextion ready', 0x89: 'start microSD upgrade', 0xfd: 'transparent data finished',
			0xfe: 'transparent data ready'
		};
	}
	static get types() {
		return {
			0: 'error', 1: 'error', 2: 'error', 3: 'status', 16: '(raw) data', 17: 'touch event',
			18: 'current page', 19: 'touch coords (awake)', 20: 'touch coords (sleep)', 21: 'string',
			22: 'number', 32: 'command'
		}
	}

	init(baudrate) {
		const baudList = [2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
		for (const x of baudList) {
			const b = (x == baudrate);
			this.baudSelector.add(new Option(x, x, b, b));
		}
	}

	addHandler(element, action, handler) {
		this[element].addEventListener(action, handler);
	}

	update(comProps) {
		const cVar = (comProps.actport == null);
		const rVar = (comProps.lastport == null);
		this.baudSelector.disabled = !cVar;
		this.connectButton.disabled = false;
		this.reconnButton.disabled = rVar;
		this.connectButton.innerText = (cVar ? "Connect new" : "Disconnect");
		this.commandLine.disabled = cVar;
		this.sendButton.disabled = cVar;
		if (!cVar) {
			this.statusContainer.innerText = `Connected to ${comProps.portPretty}`;
		} else {
			this.statusContainer.innerText = 'Disconnected' + (!rVar ? ` from ${comProps.portPretty}` : '');
		}
	}

	get baudset() {
		return parseInt(this.baudSelector.value)
	}

	log(dataObj, withBytes = false) {
		let logContent;
		let logClass;
		switch (dataObj.type) {
			case 0:
				logContent = nxUI.errors[dataObj.value];
				logClass = 'err';
				break;
			case 1:
				logContent = `unknown ident byte 0x${dataObj.ident.toString(16)}`;
				logClass = 'err';
				break;
			case 2:
				logContent = `incorrect enclosed byte count: ${dataObj.data.length}, expected ${dataObj.value}`;
				logClass = 'err';
				break;
			case 3:
				logContent = nxUI.status[dataObj.value];
				logClass = 'sts';
				break;
			case 17:
			case 19:
			case 20:
				logContent = JSON.stringify(dataObj.value);
				logClass = 'evt';
				break;
			default:
				logContent = dataObj.value;
				logClass = 'ret';
		}
		const logText = `${(dataObj.direction ? ">" : "<")} ${nxUI.types[dataObj.type]}: ${logContent}` +
			(withBytes || (this.type < 3) ? ` ${dataObj.bytesFormatted}` : '');
		//only for debugging purposes:
		//console.log(logtext); 
		const logHtml = `<pre class='${logClass}'>${logText}</pre>`;
		this.logContainer.innerHTML += logHtml;
		const isScrollBottom = this.logContainer.scrollHeight - this.logContainer.clientHeight <= this.logContainer.scrollTop + 1;
		if (isScrolledToBottom) {
			eleContainerLog.scrollTop = eleContainerLog.scrollHeight - eleContainerLog.clientHeight;
		}
	}

	#errMsg(e, t) {
		const m = (t == 0 ? e : (t < 3 ? 256 * t : null));
		return this.errors[m];
	}
}

class nxComm {
	#ui;
	#comProps = {
		filter: [], baudrate: 9600, actport: null, lastport: null, reader: null, get portPretty() {
			const pPort = (this.actport ?? this.lastport);
			return (pPort ? JSON.stringify(pPort.getInfo(), (k, v) => { if (typeof (v) === 'number') { return '0x' + v.toString(16) } return (v) }) : '');
		}
	};
	#nxTerminator = Uint8Array.from([255, 255, 255]);

	constructor(uiObject, allowPorts) {
		this.#ui = Object.assign(new nxUI, uiObject);
		this.#ui.addHandler('connectButton', 'click', this.newconn.bind(this));
		this.#ui.addHandler('sendButton', 'click', this.sendCommand.bind(this));
		this.#ui.addHandler('reconnButton', 'click', this.connect.bind(this));
		this.#ui.addHandler('commandLine', 'keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sendButton.click() } });
		this.#comProps.filter = allowPorts;
		this.#ui.init(this.#comProps.baudrate);
		this.#ui.update(this.#comProps);
	}


	newconn() {
		this.#comProps.lastport = null;
		this.connect();
	}

	connect() {
		const portFlt = { filters: this.#comProps.filter };
		if (this.#comProps.actport == null) {
			const asyncHdl = new Promise((resolve, reject) => {
				(async () => {
					if (this.#comProps.lastport == null) {
						this.#comProps.actport = await navigator.serial.requestPort(portFlt);
					} else {
						this.#comProps.actport = this.#comProps.lastport;
						this.#comProps.lastport = null;
					}
					this.#comProps.baudrate = this.#ui.baudset;
					await this.#comProps.actport.open({ baudRate: this.#comProps.baudrate });
					this.#comProps.reader = this.#comProps.actport.readable.getReader();
					let inBuff = new Uint8Array(4096);
					let inOffs = 0;
					let ff3Detect;
					let slice;
					let res;
					this.#ui.update(this.#comProps);
					while (true) {
						const { value, done } = await this.#comProps.reader.read();
						if (done) {
							this.#comProps.reader.releaseLock();
							break;
						}
						for (const i of value) {
							inBuff[inOffs++] = i;
							ff3Detect = (ff3Detect << 8 | (i & 0xFF)) & 0x00FFFFFF;
							if (ff3Detect == 0x00FFFFFF) {
								slice = inBuff.slice(0, inOffs - 3);
								inOffs = 0;
								res = new nxData(slice);
								this.#ui.log(res);
							}
						}
					}
					await this.#comProps.actport.close();
					this.#comProps.lastport = this.#comProps.actport;
					this.#comProps.actport = null;
					this.#ui.update(this.#comProps);
					resolve();
				}).catch(()=>{alert('bingo')});
			});
		} else {
			await this.#comProps.reader.cancel();
		}
	}

	async #sendText(text, add3ff = true) {
		const enc = new TextEncoder();
		const bytes = enc.encode(text);
		let res = new nxData(bytes, false);
		await this.#sendBytes(bytes, add3ff);
		this.#ui.log(res);
	}

	async #sendBytes(bytes, add3ff = true) {
		const writer = this.#comProps.actport.writable.getWriter();
		await writer.write(bytes);
		if (add3ff) {
			await writer.write(this.#nxTerminator);
		}
		writer.close();
	}

	async sendCommand() {
		await this.#sendText(this.#ui.commandLine.value, true);
		this.#ui.commandLine.value = '';
	}

}

class nxData {
	#inout;
	#raw;
	#dataType;
	#content;
	#bytes;
	#identByte;

	constructor(byteArr, incoming = true, rawData = false) {
		this.#identByte = (incoming ? byteArr[0] : null);
		this.#bytes = byteArr.subarray(incoming ? 1 : 0);
		this.#inout = incoming;
		this.#raw = rawData;
		switch (true) {
			case (this.#identByte == null):
				if (this.#raw) {
					this.#dataType = 16; // (raw) data
					this.#content = this.bytesFormatted;
				} else {
					this.#dataType = 32; // command
					this.#content = this.#byteText;
				}
				break;
			case (this.#identByte == 0x00): // special handler handle the special 0x00 0x00 0x00 case on boot
				if (this.#bytes.length == 2 && this.#bytes[0] == 0 && this.#bytes[1] == 0) {
					this.#dataType = 3; // status
					this.#content = this.#identByte;
				} else if (this.#integrityCheck(0)) {
					this.#dataType = 0; //error
					this.#content = this.#identByte;
				}
				break;
			case ([0x02, 0x03, 0x04, 0x05, 0x06, 0x09, 0x11, 0x12, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x23, 0x24].includes(this.#identByte)):
				if (this.#integrityCheck(0)) {
					this.#dataType = 0; //error
					this.#content = this.#identByte;
				}
				break;
			case (this.#identByte == 0x65):
				if (this.#integrityCheck(3)) {
					this.#dataType = 17; // touch event from "send component ID" enabled
					this.#content = { pageID: this.#bytes[0], componentID: this.#bytes[1], event: this.#bytes[2] };
				}
				break;
			case (this.#identByte == 0x66):
				if (this.#integrityCheck(1)) {
					this.#dataType = 18; // current page number
					this.#content = this.#bytes[0];
				}
				break;
			case (this.#identByte == 0x67 || this.#identByte == 0x68):
				if (this.#integrityCheck(5)) {
					this.#dataType = this.#identByte - 0x54; // touch event from sendXY awake/sleep
					this.#content = { touchX: (this.#bytes[0] << 8) | this.#bytes[1], touchY: (this.#bytes[2] << 8) | this.#bytes[3], event: this.#bytes[4] };
				}
				break;
			case (this.#identByte == 0x70):
				this.#dataType = 21; // string data
				this.#content = this.#byteText;
				break;
			case (this.#identByte == 0x71):
				if (this.#integrityCheck(4)) {
					this.#dataType = 22; // numeric data
					this.#content = (((this.#bytes[3] << 8) | this.#bytes[2]) << 8 | this.#bytes[1]) << 8 | this.#bytes[0]; // reverse endian order
				}
				break;
			case ([0x01, 0x86, 0x87, 0x88, 0x89, 0xfd, 0xfe].includes(this.#identByte)):
				if (this.#integrityCheck(0)) {
					this.#dataType = 3; //status
					this.#content = this.#identByte;
				}
				break;
			default:
				this.#dataType = 1; // ident byte unknown
		}
	}

	/* private helpers for decoding */
	get #byteText() {
		const dcd = new TextDecoder();
		return dcd.decode(this.#bytes);
	}

	#integrityCheck(expected) {
		if (this.#bytes.length != expected) {
			this.#dataType = 2;
			this.#content = this.#identByte;
			return false;
		} else {
			return true;
		}
	}

	/* getters for public read-only properties */
	get direction() {
		return this.#inout;
	}

	get type() {
		return this.#dataType;
	}

	get data() {
		return this.#bytes;
	}

	get value() {
		return this.#content;
	}

	get bytesFormatted() {
		return `[ ${(this.#bytes.toHex().replace(/.{2}/g, "$&" + " "))}]`
	}
}

window.onload = function () {
	if ("serial" in navigator) {
		var Nextion = new nxComm(myUI, myPorts);
	} else {
		alert("This browser has no support for the Nextion Web Serial Framework! \
You'll have to use \n- either Chrome or Edge >= v89\n- or Opera >= v75\n- or Firefox >= v151");
	}
}