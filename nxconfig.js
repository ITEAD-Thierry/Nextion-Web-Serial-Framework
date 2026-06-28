const myUIelements = {
	baudSelector: document.getElementById("baudSelector"),
	connectButton: document.getElementById("connectButton"),
	reconnButton: document.getElementById("reconnButton"),
	commandLine: document.getElementById("commandLine"),
	sendButton: document.getElementById("sendButton"),
	statusContainer: document.getElementById("statusContainer"),
	logContainer: document.getElementById("logContainer"),
	clearButton: document.getElementById("clearButton"),
	autoScroll: document.getElementById("autoScroll"),
	isDebug: document.getElementById("isDebug"),
	verContainer: document.getElementById("verContainer"),
	thfContainer: document.getElementById("thfContainer"),
	sysContainer: document.getElementById("sysContainer"),
	connIndic: document.getElementById("connIndic")
};
const myAllowedPorts = [
	{ usbProductId: 0xea60, usbVendorId: 0x10c4 }, // Nextion Foca Max Adapter
];