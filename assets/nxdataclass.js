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
		switch (!this.#raw) {
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
			case (this.#identByte == 0x63):
				if (this.#bytes[0] == 0x6F && this.#bytes[1] == 0x6D && this.#bytes[2] == 0x6F && this.#bytes[3] == 0x6b) {
					this.#dataType = 31; // connection info
					let txtArr = this.#byteText.split(',');
					this.#content = { _busAddr: txtArr[1].split('-')[1]??0, model: txtArr[2], firmware: 'S' + txtArr[3], cpuID: txtArr[4], serial: txtArr[5], flash: (txtArr[6] >> 20).toString(10) + ' MB' };
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
			this.#content = expected;
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
