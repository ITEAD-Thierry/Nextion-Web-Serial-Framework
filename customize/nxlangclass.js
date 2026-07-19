class nxLang {
	// static language getters
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
			0xfd: 'transparent data finished', 0xfe: 'transparent data ready',
			version: "v.0.4 (work in progress)",
			copyright: "<a href='https://itead.cc/nextion-display/ref/35/'>NEXTION-Thierry&nbsp;蒂耶里</a>",
			disConnected: "Disconnected",
			usbConnected: "Port open: ",
			nexConnected: "Nextion HMI connected: "
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

	static get noSerialErr() {
		return "This browser has no support for the Nextion Web Serial Framework! " +
			"You'll have to use \n· Chrome or Edge >= v 89\n· Opera >= v 75\n· Firefox >= v 151"
	}

	static get captions() {
		return {
			comTools: 'Communication Tools',
			baud: 'Baud rate', port: 'Port', nextion: 'Nextion',
			command: 'Command', cmdDefault: 'Enter command...', send: 'Send', busadr: 'Bus Address',
			clear: 'Clear', autoscroll: 'Autoscroll', debug: 'Debug',
			sysInfo: 'System Information',
			commandTools: 'Command Tools',
			nextionOutput: 'Nextion Output',
			dataMon: 'Data Monitor',
		}
	}

	static get syserrors() {
		return {
			noresp: 'No response from HMI. Please try a different port or baud rate!',
			errcompane: 'Error initializing the communication pane',
			invport: 'Invalid port selected!',
			noports: 'No ports enabled!'
		}
	}

	static get touchTech() {
		return {
			O: 'No Touch', 1: 'Resistive', 2: 'Capacitive', 3: 'Capacitive'
		}
	}

}
