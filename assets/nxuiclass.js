class nxUI {
	#elts;
	#comObj;
	#sysObj;
	#portConfig = {
		actPort: null, lastPort: null, baudRate: 9600, baudOk: false, portFilter: null, get portPretty() {
			const pPort = (this.actPort ?? this.lastPort).getInfo();
			return `USB\\VID=${nxUI.#hexOut(pPort['usbVendorId'])}&PID=${nxUI.#hexOut(pPort['usbProductId'])} @ ${this.baudRate} baud`;
		}
	};
	#actLog = true;
	#wfr = -1;
	#retResolve;
	static #hexOut(s) { return '0x' + s.toString(16).toUpperCase() }

	constructor(elements, comObject, portList = null) {

		this.#elts = elements;
		this.#comObj = comObject;
		this.#portConfig.portFilter = { filters: portList };
		this.#elts.connectButton.addEventListener('click', this.newConn.bind(this));
		this.#elts.sendButton.addEventListener('click', this.sendCommand.bind(this));
		this.#elts.reconnButton.addEventListener('click', this.reConn.bind(this));
		this.#elts.commandLine.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); sendButton.click() } });
		this.#elts.clearButton.addEventListener('click', this.clearScr.bind(this));
		this.#elts.baudSelector.addEventListener('click', this.setBauds.bind(this));
		this.update();
	}

	static get baudList() {
		return [2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];
	}

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
			0x00: 'booting...', 0x01: 'instruction success', 0x86: 'auto entered sleep mode',
			0x87: 'auto wake from sleep', 0x88: 'nextion ready', 0x89: 'start microSD upgrade',
			0xfd: 'transparent data finished', 0xfe: 'transparent data ready'
		};
	}

	static get types() {
		return {
			0: 'error', 1: 'error', 2: 'error', 3: 'status', 16: '(raw) data', 17: 'touch event',
			18: 'current page', 19: 'touch coords (awake)', 20: 'touch coords (sleep)', 21: 'string',
			22: 'number', 31: 'com ok', 32: 'command'
		}
	}

	static get events() {
		return { 0: 'release', 1: 'touch' };
	}

	static get version() {
		return "v.0.3 (work in progress)";
	}

	static get copyright() {
		return "by <a href='https://itead.cc/nextion-display/ref/35/'> NEXTION-Thierry</a>";
	}

	update() {
		const cVar = (this.#portConfig.actPort == null);
		const rVar = (this.#portConfig.lastPort == null);
		this.#elts.baudSelector.disabled = !cVar;
		this.#elts.connectButton.disabled = false;
		this.#elts.reconnButton.disabled = rVar || !cVar;
		this.#elts.connectButton.innerText = (cVar ? "Select+Connect" : "Disconnect");
		this.#elts.commandLine.disabled = cVar;
		this.#elts.sendButton.disabled = cVar;
		this.#elts.clearButton.disabled = cVar;
		this.#elts.connIndic.className = 'c' + this.connState;
		switch (this.connState) {
			case 2:
				this.#elts.statusContainer.innerText = `Connected to ${this.#sysObj['model']} @ ${this.#portConfig.baudRate}`;
				break;
			case 1:
				this.#elts.statusContainer.innerText = `Connected to ${this.#portConfig.portPretty}`;
				break;
			default:
				this.#elts.statusContainer.innerText = 'Disconnected' + (!rVar ? ` from ${this.#portConfig.portPretty}` : '');
		}
		this.#elts.sysContainer.innerHTML= this.#sysObj?this.sysInfoHtml:'';
		this.#elts.baudSelector.length=0;
		nxUI.baudList.forEach((x) => {
			const b = (x == this.#portConfig.baudRate);
			this.#elts.baudSelector.add(new Option(x, x, b, b));
		})
		this.#elts.verContainer.innerText = nxUI.version;
		this.#elts.thfContainer.innerHTML = nxUI.copyright;
	}

	async newConn() {
		if (!this.#portConfig.actPort) {
			this.#portConfig.actPort = await navigator.serial.requestPort(this.#portConfig.portFilter).catch(e => { alert(e.message) });
			if (this.#portConfig.actPort) {
				await this.#upNlisten();
				await this.#sysConnect();
			}
		} else {
			await this.#comObj.listen(null);
			this.#portConfig.lastPort = this.#portConfig.actPort;
			this.#portConfig.actPort = null;
			this.#sysObj = null;
			this.update();
		}
	}

	async reConn() {
		this.#portConfig.actPort = this.#portConfig.lastPort;
		this.#portConfig.lastPort = null;
		await this.#upNlisten();
		await this.#sysConnect();
	}

	async sendCommand() {
		await this.#comObj.sendText(this.#elts.commandLine.value, true);
		this.#elts.commandLine.value = '';
	}

	async sendRawCmd(s, wfr) {
		this.#wfr = wfr;
		this.#actLog = false;
		await this.#comObj.sendText(s, true);
		const self = this;
		const trig = await Promise.race([
			new Promise(function (resolve) { self.#retResolve = resolve }),
			new Promise((_, fail) => setTimeout(() => fail(new Error('Timeout')), 3000))
		]).then(() => {
			self.baudOk = true;
		}, (err) => {
			self.baudOk = false;
			alert('No Nextion response on selected port. Please try a different baud rate!')
		}).finally(()=>{this.update()});
	}

	clearScr() {
		this.#elts.logContainer.innerText = '';
	}

	setBauds(r) {
		this.#portConfig.baudRate = (typeof (r) != 'number' ? parseInt(this.#elts.baudSelector.value) : r);
	}

	get isDebug() { return this.#elts.isDebug.checked }
	get autoScroll() { return this.#elts.autoScroll.checked }
	get connState() { return this.#sysObj ? 2 : this.#portConfig.actPort != null ? 1 : 0 }
	get sysInfoHtml() { var h = Array(); Object.entries(this.#sysObj).forEach(([key, value]) => h.push(`<span class="sl">${key+':'}</span>${value}`)); return h.join('<br>')}
	#jumpDown() { this.#elts.logContainer.scrollTop = this.#elts.logContainer.scrollHeight }
	#addLog(html) { this.#elts.logContainer.innerHTML += html }
	set baudOk(o) {
		this.#portConfig.baudOk = o;
	}

	async #upNlisten() {
		const port = this.#portConfig.actPort
		await port.open({ baudRate: this.#portConfig.baudRate }).catch(e => { alert(e.message) });
		await this.#comObj.listen(port);
		this.update()
	}

	async #sysConnect() {
		this.#actLog=false;
		await this.sendCommand("DRAKJHSUYDGBNCJHGJKSHBDN");
		await this.sendRawCmd("connect", 31);
		this.#actLog = true;
	}

	log(dataObj) {
		let logContent;
		let logClass;
		let isSys = false;
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
				logContent = JSON.stringify(dataObj.value, (k, v) => { if (k === 'event') { return nxUI.events[v] } return (v) });
				logClass = 'evt';
				break;
			case 31:
				this.#sysObj = dataObj.value;
				logContent = JSON.stringify(dataObj.value);
				logClass = 'sts';
				isSys = true;
				break;
			case 32:
				logContent = dataObj.value;
				logClass = 'cmd';
				break;
			default:
				logContent = dataObj.value;
				logClass = 'ret';
		}

		const logText = `${(dataObj.direction ? ">" : "<")} ${nxUI.types[dataObj.type]}: ${logContent}` +
			(this.isDebug || (this.type < 3) ? ` <span>${dataObj.bytesFormatted}</span>` : '');

		const logHtml = `<pre class='${logClass}'>${logText}</pre>`;
		if (this.#actLog) {
			this.#addLog(logHtml);
		}
		if (this.autoScroll) {
			this.#jumpDown()
		}
		if (dataObj.direction && (this.#wfr == dataObj.type)) {
			this.#wfr = -1;
			this.#retResolve();
		}
	}
}
var myComm, myUI;
window.onload =
	function () {
		if ("serial" in navigator) {
			myComm = new nxComm()
			myUI = new nxUI(myUIelements, myComm, myAllowedPorts);
			myComm.logCallback = myUI.log.bind(myUI);
		} else {
			alert("This browser has no support for the Nextion Web Serial Framework! \
You'll have to use \n- either Chrome or Edge >= v89\n- or Opera >= v75\n- or Firefox >= v151");
		}
	}
