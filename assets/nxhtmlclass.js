class nxHTML {
	static get #baudList() {
		return [2400, 4800, 9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]
	}

	//mandatory UI part:
	static async initComm(parentNode) {
		parentNode.innerHTML = '<h2>' + nxLang.captions.comTools + '</h2>\
			<div><label for="selBaud" class="caption">' + nxLang.captions.baud + '</label><select id="selBaud"></select></div>\
			<div><span class="caption">' + nxLang.captions.port + '</span><select id="selPort"></select>&nbsp;\
			<button id="btnRefs" class="mini">...</button></div>\
			<div><span class="caption">' + nxLang.captions.nextion + '</span><button id="btnConn">wait..</button></div>';
		try {
			const b = document.getElementById("selBaud");
			b.length = 0;
			this.#baudList.forEach((x) => {
				const r = (x == 9600);
				b.add(new Option(x, x, r, r));
			})
		} catch (e) {/* ignore */ }
	}

	//optional UI parts:
	static async initSys(parentNode) {
		try {
			parentNode.innerHTML = '<h2>' + nxLang.captions.sysInfo + '</h2>\
			<div id="sysContainer" class="display"></div>';
		} catch (e) { /* ignore */ }
	}

	static async initCmd(parentNode) {
		try {
			parentNode.innerHTML = '<h2>' + nxLang.captions.commandTools + '</h2>\
				<div><span class="caption">'+nxLang.captions.busadr+'</span><input type="number" id="busAdr" placeholder="0" disabled></div>\
				<div><span class="caption">' + nxLang.captions.command + '</span><input type="text" id="inpCmd" placeholder="' + nxLang.captions.cmdDefault + '" disabled>\
				&nbsp;<button id="btnSend" class="mini"disabled>-&gt;</button></div>'
		} catch (e) { /* ignore */ }
	}

	static async initLog(parentNode) {
		try {
			parentNode.innerHTML = '<h2>' + nxLang.captions.nextionOutput + '</h2>\
				<div><button id="btnClear" disabled>' + nxLang.captions.clear + '</button>&nbsp;\
				<label for="chkScroll" class="caption"><input id="chkScroll" type="checkbox" checked>' + nxLang.captions.autoscroll + '</label>&nbsp;\
				<label for="chkDebug" class="caption"><input id="chkDebug" type="checkbox">' + nxLang.captions.debug + '</label></div>\
				<div id="logContainer" class="display"></div>';
		} catch (e) { /* ignore */ }
	}

	static async initVer(parentNode) {
		try {
			parentNode.innerHTML = '<div>' + nxLang.status.version + '</div>';
		} catch (e) { /* ignore */ }
	}

	static async initAut(parentNode) {
		try {
			parentNode.innerHTML = '<div>by&nbsp;' + nxLang.status.copyright + '</div>';
		} catch (e) { /* ignore */ }
	}

	static updCon(parentNode, s,m,b,p) {
		try {
			switch (s) {
				case 2:
					parentNode.innerHTML = '';
					break;
				case 1:
					parentNode.innerHTML = '';
					break;
				default:
					parentNode.innerHTML = '';
			}
		} catch (e) { console.log(e) /* ignore */ }
	}
}