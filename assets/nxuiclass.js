class nxUI {
	#elts; #comObj; #sysObj = null;
	#portConfig = { portList: Array(), portFilter: null }
	#cmdHist = Array()
	#retList = Object()

	// private UI element data getters & converters etc.
	get #selPort() { return this.#_('#selPort') ? this.#portConfig.portList[this.#_('#selPort').value] : null }
	get #portPretty() {
		const p = this.#selPort.getInfo();
		return `USB::VID=${this.#h(p['usbVendorId'])}&PID=${this.#h(p['usbProductId'])}`
	}
	get #selBaud() { return this.#_('#selBaud') ? this.#_('#selBaud').value : 9600 }
	get #selBus() { return this.#_('#busAdr') ? this.#_('#busAdr').value : 0 }
	get #inpCmd() { return this.#_('#inpCmd') ? this.#_('#inpCmd').value : '' }
	get #isDebug() { return this.#_('#chkDebug').checked }
	get #autoScroll() { return this.#_('#chkScroll').checked }
	get #connState() { return this.#sysObj ? 2 : (this.#comObj.isListening ? 1 : 0) }
	get #sysInfoHtml() {
		var h = Array()
		Object.entries(this.#sysObj).forEach(([key, value]) => {
			if (!key.startsWith('_')) h.push(`<span class="sl">${key + ':'}</span>${value}`)
		});
		return h.join('<br>')
	}
	get #connHtml() {
		var s = this.#connState; switch (s) {
			case 2: return `&#x1F7E2 ${nxLang.status.nexConnected} ${this.#sysObj.model} @ ${this.#selBaud} baud`; break
			case 1: return `&#x1F7E1 ${nxLang.status.usbConnected} ${this.#portPretty} @ ${this.#selBaud} baud`; break
			default: return `&#x1f534 ${nxLang.status.disConnected}`
		}
	}
	get #sysTimeout() { return Math.floor((1e6 / this.#selBaud) + 30) }

	// private helper functions
	#_(id) { if (id.charAt(0) == '#') return document.getElementById(id.slice(1)) }
	#h(s) { return '0x' + s.toString(16).toUpperCase() }
	#f(n) { return String.fromCharCode(0xFF).repeat(n) }
	#jumpDown() { this.#_('#logContainer').scrollTop = this.#_('#logContainer').scrollHeight }
	#addLog(html) { this.#_('#logContainer').innerHTML += html }
	async #updPortList() {
		let o = this.#selPort, p = this.#_('#selPort')
		p.length = 0;
		await navigator.serial.getPorts(this.#portConfig.portFilter)
			.then((ports) => {
				(this.#portConfig.portList = ports)
					.forEach((port, index) => {
						const p = port.getInfo();
						if (p['usbVendorId']) this.#_('#selPort').add(
							new Option(`USB::VID=${this.#h(p['usbVendorId'])}&PID=${this.#h(p['usbProductId'])}`, index, port == o, port == o));
					})
			})
			.catch((e) => { alert("Error updating port list: " + e.message) })
			.finally(() => {
				if (this.#_('#selPort').length == 0)
					this.#_('#selPort').add(new Option('', '', true, true))
			})
	}
	async #sysRtn(s, term = false, adr = 0, wfr = 999, timeout = this.#sysTimeout) {
		const self = this, tmp = this.#comObj.dataCallback
		this.#comObj.dataCallback = this.rtn.bind(this)
		this.#retList[wfr] = { resolve: null }
		return this.sendCmd(s, term, adr)
			.then(async () => {
				return Promise.race([
					new Promise(function (resolve) { self.#retList[wfr].resolve = resolve }),
					new Promise((_, reject) => setTimeout(() => reject("timeout " + adr), timeout))])
					.finally((p) => { this.#comObj.dataCallback = tmp; return p })
			})
	}
	async #sysConnect() {
		const cto = Math.floor(1e6 / this.#selBaud + 30)
		const self = this
		this.sendCmd('DRAKJHSUYDGBNCJHGJKSHBDN', true, 0, false)
		return this.#sysRtn('connect', true, 0, 31)
			.then((obj) => { if (obj) { return obj } else { throw new Error('resolved w/o object') } })
			.catch(async () => await this.#sysRtn('connect', true, 65535, 31)
				.then((obj) => { if (obj) { return obj } else { throw new Error('resolved w/o object') } }))
	}

	// private UI event handlers
	#evtRefs() {
		navigator.serial.requestPort(this.#portConfig.portFilter)
			.then(() => { this.#updPortList() })
			.catch((e) => { alert(nxLang.syserrors.invport) })
			.finally(() => { this.update() });
	}
	async #evtConn() {
		const p = this.#selPort
		if (p && !this.#comObj.isListening) {
			await p.open({ baudRate: this.#selBaud })
			this.#comObj.startRd(p)
			await this.#sysConnect()
				.then((obj) => { this.#sysObj = obj.value })
				.catch(async (err) => {
					alert(nxLang.syserrors.noresp)
					await this.#comObj.killRd()
				})
		} else if (this.#comObj.isListening) {
			await this.#comObj.killRd()
			this.#sysObj = null
		} else alert(nxLang.syserrors.noports)
		this.update()
	}
	#evtSend() {
		this.sendCmd(this.#inpCmd, true, this.#selBus).then(() => {
			this.#cmdHist=Array()
			this.#cmdHist.push(this.#inpCmd)
			this.#_('#inpCmd').value = ''
		});
	}

	constructor(portList = null) {
		this.#comObj = new nxComm(this.log.bind(this))
		this.#portConfig.portFilter = { filters: portList }
		// Create the mandatory UI part and add the event listeners
		try {
			nxHTML.initComm(this.#_('#comPane')).then(() => {
				this.#_('#btnRefs').addEventListener('click', this.#evtRefs.bind(this))
				this.#_('#btnConn').addEventListener('click', this.#evtConn.bind(this));
			}).then(() => { this.#updPortList() });
		} catch (e) {
			alert(nxLang.syserrors.errcompane)
			return
		}
		// Create the optional UI parts, add their respective event listeners and update the UI
		try {
			nxHTML.initSys(this.#_('#sysPane'));
		} catch (e) { /* ignore */ }
		try {
			nxHTML.initCmd(this.#_('#cmdPane')).then(() => {
				this.#_('#btnSend').addEventListener('click', this.#evtSend.bind(this))
				this.#_('#inpCmd').addEventListener('keydown', function (v) {
					if (v.key === 'Enter') {v.preventDefault(); this.#evtSend() }
					if(v.key ==='ArrowUp') {this.#_('#inpCmd').value=this.#cmdHist[this.#cmdHist.length-1]??''}
				}.bind(this));
			});
		} catch (e) { /* ignore */ }
		try {
			nxHTML.initLog(this.#_('#logPane'));
			this.#_('#btnClear').addEventListener('click', function () {
				this.#_('#logContainer').innerHTML = '';
			}.bind(this));
		} catch (e) { /* ignore */ }
		try {
			nxHTML.initVer(this.#_('#verPane'));
			nxHTML.initAut(this.#_('#autPane'));
		} catch (e) { /* ignore */ }
		this.update();
	}

	update() {
		const cVar = (!this.#selPort || !this.#selPort.readable)
		/* comPane's presence is mandatory */
		this.#_('#selBaud').disabled = !cVar
		this.#_('#btnRefs').disabled = !cVar
		this.#_('#btnConn').disabled = (this.#selPort === null)
		this.#_('#btnConn').innerText = (cVar ? "Connect" : "Disconnect")
		try { // cmdPane
			this.#_('#busAdr').value = this.#sysObj._busAddr
			this.#_('#inpCmd').disabled = cVar
			this.#_('#btnSend').disabled = cVar
		} catch (e) { /* ignore */ }
		try {
			this.#_('#btnClear').disabled = cVar
		} catch (e) { /* ignore */ }
		this.#_('#sysContainer').innerHTML = this.#sysObj ? this.#sysInfoHtml : '';
		this.#_('#conPane').innerHTML = this.#connHtml;
	}

	sendCmd(s, term = false, adr = 0, crtn = true) {
		const prefix = adr > 0 ? Uint8Array.from([(adr & 0xFF), (adr >> 8)]) : new Uint8Array(0)
		const postfix = term ? Uint8Array.from([0xFF, 0xFF, 0xFF]) : new Uint8Array(0)
		return this.#comObj.sendBytes(prefix)
			.then(this.#comObj.sendText(s, crtn))
			.then(this.#comObj.sendBytes(postfix))
	}

	rtn(dataObj) {
		if (this.#retList[dataObj.type]) {
			this.#retList[dataObj.type].resolve(dataObj)
		}
	}

	log(dataObj) {
		let logContent, logClass;
		switch (dataObj.type) {
			case 0:
				logContent = nxLang.errors[dataObj.value];
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
				logContent = nxLang.status[dataObj.value];
				console.log(logContent);
				logClass = 'sts';
				break;
			case 17:
			case 19:
			case 20:
				logContent = JSON.stringify(dataObj.value, (k, v) => { if (k === 'event') { return nxLang.events[v] } return (v) });
				logClass = 'evt';
				break;
			case 31:
				this.#sysObj = dataObj.value;
				logContent = JSON.stringify(dataObj.value);
				logClass = 'sts';
				break;
			case 32:
				logContent = dataObj.value;
				logClass = 'cmd';
				break;
			default:
				logContent = dataObj.value;
				logClass = 'ret';
		}
		this.#addLog(`<pre class='${logClass}'>${(dataObj.direction ? ">" : "<")} ` +
			`${nxLang.types[dataObj.type]}: ${logContent}` +
			(this.#isDebug || (this.type < 3)
				? ` <span>${dataObj.bytesFormatted}</span>`
				: '') + '</pre>')
		if (this.#autoScroll) this.#jumpDown()
	}
}

// Init routine
var myComm, myUI
window.onload =
	function () {
		"serial" in navigator ? myUI = new nxUI(portWhiteList) // create the UI object
			: alert(nxLang.noSerialErr)

	}
